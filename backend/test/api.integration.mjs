import 'reflect-metadata';
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

config({ path: '.env.test.local', override: true, quiet: true });
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith('_test')
) {
  throw new Error(
    'Use a dedicated database ending in _test in .env.test.local',
  );
}
const migration = spawnSync(process.execPath, ['scripts/migrate.mjs'], {
  env: process.env,
  encoding: 'utf8',
  windowsHide: true,
});
assert.equal(migration.status, 0, migration.stderr);
const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../dist/app.module.js');

await test('signup creates user/student atomically; login and logout persist in PostgreSQL', async () => {
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  const suffix = randomUUID();
  const email = `${suffix}@example.invalid`;
  const secondEmail = `second-${suffix}@example.invalid`;
  const password = `Test-${randomUUID()}`;
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    async function request(method, path, body, token, expected = 200) {
      const res = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const result = await res.json();
      assert.equal(res.status, expected, JSON.stringify(result));
      return result;
    }
    const signup = {
      email,
      password,
      full_name: 'Test Student',
      student_number: suffix,
    };
    await request(
      'POST',
      '/auth/register',
      { ...signup, student_number: '' },
      null,
      400,
    );
    const user = await request('POST', '/auth/register', signup, null, 201);
    assert.equal(user.student_number, suffix);
    assert.equal(user.password_hash, undefined);
    await request(
      'POST',
      '/auth/register',
      { ...signup, email: email.toUpperCase() },
      null,
      409,
    );
    await request(
      'POST',
      '/auth/register',
      { ...signup, email: secondEmail },
      null,
      409,
    );
    assert.equal(
      (await db.query('SELECT id FROM users WHERE email=$1', [secondEmail]))
        .rowCount,
      0,
    );
    const stored = (
      await db.query('SELECT password_hash FROM users WHERE id=$1', [user.id])
    ).rows[0];
    assert.notEqual(stored.password_hash, password);
    await request(
      'POST',
      '/auth/login',
      { email, password: 'wrong-password-value' },
      null,
      401,
    );
    const { access_token: token } = await request('POST', '/auth/login', {
      email,
      password,
    });
    const me = await request('GET', '/auth/me', undefined, token);
    assert.equal(me.full_name, signup.full_name);
    assert.equal(me.student_number, suffix);
    await request('GET', '/auth/me', undefined, null, 401);
    await request('POST', '/auth/logout', undefined, token);
    await request('GET', '/auth/me', undefined, token, 401);
    const next = await request('POST', '/auth/login', { email, password });
    await db.query(
      "UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",
      [user.id],
    );
    await request('GET', '/auth/me', undefined, next.access_token, 401);
    await request('GET', '/reports', undefined, null, 404);
    await request('GET', '/conversations', undefined, null, 404);
    // Three login requests above already consumed this IP's quota.
    for (let i = 0; i < 7; i++) {
      await request(
        'POST',
        '/auth/login',
        { email, password: 'incorrect-password' },
        null,
        401,
      );
    }
    const blocked = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.0.2.99',
      },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(blocked.status, 429);
    const retryAfter = Number(blocked.headers.get('Retry-After'));
    assert.ok(retryAfter > 0 && retryAfter <= 60);
    const sessions = await db.query(
      'SELECT count(*)::int AS count FROM auth_sessions WHERE user_id=$1',
      [user.id],
    );
    assert.equal(sessions.rows[0].count, 1);
  } finally {
    await db.query('DELETE FROM users WHERE email=ANY($1::text[])', [
      [email, secondEmail],
    ]);
    await app.close();
    await db.end();
  }
});
