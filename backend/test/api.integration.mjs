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
const { httpConfig } = await import('../dist/config/http.config.js');
const { DatabaseService } =
  await import('../dist/database/database.service.js');

await test('signup creates user/student atomically; login and logout persist in PostgreSQL', async (t) => {
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  const suffix = randomUUID();
  const email = `${suffix}@example.invalid`;
  const secondEmail = `second-${suffix}@example.invalid`;
  const fixtureEmails = [email, secondEmail];
  app.enableCors(httpConfig({ CORS_ORIGINS: 'http://localhost:3000' }).cors);
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
    await t.test('CORS permits the configured frontend only', async () => {
      for (const origin of [
        'http://localhost:3000',
        'https://untrusted.example',
      ]) {
        const response = await fetch(base + '/auth/login', {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type',
          },
        });
        assert.equal(
          response.headers.get('Access-Control-Allow-Origin'),
          origin === 'http://localhost:3000' ? origin : null,
        );
      }
    });
    await t.test(
      'missing, malformed and unknown tokens return 401',
      async () => {
        for (const path of ['/auth/me', '/auth/logout']) {
          for (const header of [
            undefined,
            'Basic invalid',
            'Bearer short',
            `Bearer ${'0'.repeat(64)}`,
          ]) {
            const response = await fetch(base + path, {
              method: path.endsWith('logout') ? 'POST' : 'GET',
              headers: header ? { Authorization: header } : {},
            });
            assert.equal(response.status, 401);
            const body = await response.json();
            assert.equal(body.statusCode, 401);
            assert.equal(body.error, 'Unauthorized');
          }
        }
      },
    );
    for (const field of ['email', 'password', 'full_name', 'student_number']) {
      await t.test(
        `signup rejects missing ${field} without creating records`,
        async () => {
          const incompleteSignup = { ...signup };
          delete incompleteSignup[field];
          // This suite runs sequentially against the dedicated test database.
          // Check both tables, including the missing-email case where there is
          // no submitted email available to identify an accidental user record.
          const countsSql = `SELECT
          (SELECT count(*)::int FROM users) AS users,
          (SELECT count(*)::int FROM students) AS students`;
          const before = (await db.query(countsSql)).rows[0];

          const result = await request(
            'POST',
            '/auth/register',
            incompleteSignup,
            null,
            400,
          );

          assert.equal(result.statusCode, 400);
          assert.equal(result.error, 'Bad Request');
          const after = (await db.query(countsSql)).rows[0];
          assert.deepEqual(
            after,
            before,
            `Missing ${field} must not create a user or student`,
          );
        },
      );
    }
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
    for (const conflict of ['email', 'student_number']) {
      await t.test(
        `concurrent signup with duplicate ${conflict} preserves atomicity`,
        async () => {
          const marker = randomUUID();
          const sharedEmail = `${marker}@example.invalid`;
          const candidates = [
            { ...signup, email: sharedEmail, student_number: `${marker}-a` },
            {
              ...signup,
              email:
                conflict === 'email'
                  ? ` ${sharedEmail.toUpperCase()} `
                  : `other-${sharedEmail}`,
              student_number:
                conflict === 'student_number' ? `${marker}-a` : `${marker}-b`,
            },
          ];
          const emails = candidates.map((candidate) =>
            candidate.email.trim().toLowerCase(),
          );
          fixtureEmails.push(...emails);

          // Send both requests before awaiting either; either request may win.
          const results = await Promise.all(
            candidates.map(async (candidate) => {
              const response = await fetch(base + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidate),
              });
              return { status: response.status, body: await response.json() };
            }),
          );
          assert.deepEqual(
            results.map((result) => result.status).sort((a, b) => a - b),
            [201, 409],
          );
          const winner = results.findIndex((result) => result.status === 201);
          const loser = 1 - winner;
          assert.equal(
            results[loser].body.message,
            'Email or student number already registered',
          );

          const users = await db.query(
            'SELECT id,email FROM users WHERE email=ANY($1::text[])',
            [emails],
          );
          assert.equal(
            users.rowCount,
            1,
            'The rejected request must not leave an account behind',
          );
          assert.equal(users.rows[0].id, results[winner].body.id);
          const students = await db.query(
            'SELECT user_id,student_number FROM students WHERE student_number=ANY($1::text[])',
            [candidates.map((candidate) => candidate.student_number)],
          );
          assert.equal(students.rowCount, 1);
          assert.equal(students.rows[0].user_id, users.rows[0].id);
          assert.equal(
            students.rows[0].student_number,
            candidates[winner].student_number,
          );

          // Fix only the conflicting value to verify the other value remains usable.
          const retry = { ...candidates[loser] };
          if (conflict === 'email') retry.email = `retry-${sharedEmail}`;
          else retry.student_number = `${marker}-retry`;
          fixtureEmails.push(retry.email.trim().toLowerCase());
          const created = await request(
            'POST',
            '/auth/register',
            retry,
            null,
            201,
          );
          const persisted = await db.query(
            `SELECT u.id FROM users u JOIN students s ON s.user_id=u.id
           WHERE u.email=$1 AND s.student_number=$2`,
            [retry.email.trim().toLowerCase(), retry.student_number],
          );
          assert.equal(persisted.rowCount, 1);
          assert.equal(persisted.rows[0].id, created.id);
        },
      );
    }
    const stored = (
      await db.query('SELECT password_hash FROM users WHERE id=$1', [user.id])
    ).rows[0];
    assert.notEqual(stored.password_hash, password);
    const wrongPassword = await request(
      'POST',
      '/auth/login',
      { email, password: 'wrong-password-value' },
      null,
      401,
    );
    await t.test(
      'unknown account and wrong password share a safe error',
      async () => {
        const unknownAccount = await request(
          'POST',
          '/auth/login',
          {
            email: `unknown-${suffix}@example.invalid`,
            password,
          },
          null,
          401,
        );
        assert.deepEqual(unknownAccount, wrongPassword);
        assert.equal(unknownAccount.message, 'Invalid email or password');
        const count = await db.query(
          'SELECT count(*)::int AS count FROM auth_sessions WHERE user_id=$1',
          [user.id],
        );
        assert.equal(count.rows[0].count, 0);
      },
    );
    const { access_token: token } = await request('POST', '/auth/login', {
      email,
      password,
    });
    const me = await request('GET', '/auth/me', undefined, token);
    assert.equal(me.full_name, signup.full_name);
    assert.equal(me.student_number, suffix);
    await request('GET', '/auth/me', undefined, null, 401);
    const next = await request('POST', '/auth/login', { email, password });
    await t.test(
      'logout revokes only its session and repeated logout returns 401',
      async () => {
        assert.notEqual(next.access_token, token);
        assert.equal(next.expires_in, 86400);
        await request('POST', '/auth/logout', undefined, token);
        await request('GET', '/auth/me', undefined, token, 401);
        await request('POST', '/auth/logout', undefined, token, 401);
        const remaining = await request(
          'GET',
          '/auth/me',
          undefined,
          next.access_token,
        );
        assert.equal(remaining.id, user.id);
      },
    );
    await db.query(
      "UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",
      [user.id],
    );
    await request('GET', '/auth/me', undefined, next.access_token, 401);
    await request('POST', '/auth/logout', undefined, next.access_token, 401);
    await t.test(
      'unexpected database errors do not expose internal details',
      async () => {
        const pool = app.get(DatabaseService).pool;
      const original = pool.query.bind(pool);
        try {
          pool.query = () => {
            throw new Error('SELECT secret_password FROM private_table');
          };
          const result = await request(
            'GET',
            '/auth/me',
            undefined,
            next.access_token,
            500,
          );
          assert.equal(result.message, 'Internal server error');
          assert.equal(
            JSON.stringify(result).includes('secret_password'),
            false,
          );
        } finally {
          pool.query = original;
        }
      },
    );
    await request('GET', '/reports', undefined, null, 404);
    await request('GET', '/conversations', undefined, null, 404);
    // Four login requests above already consumed this IP's quota.
    for (let i = 0; i < 6; i++) {
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
      fixtureEmails,
    ]);
    await app.close();
    await db.end();
  }
});
