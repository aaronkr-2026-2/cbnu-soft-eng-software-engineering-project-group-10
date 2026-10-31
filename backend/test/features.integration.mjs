import 'reflect-metadata';
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import sharp from 'sharp';
config({ path: '.env.test.local', override: true, quiet: true });
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith('_test')
)
  throw new Error('Dedicated _test database required');
const migration = spawnSync(process.execPath, ['scripts/migrate.mjs'], {
  env: process.env,
  encoding: 'utf8',
  windowsHide: true,
});
assert.equal(migration.status, 0, migration.stderr);
const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../dist/app.module.js');

await test('reports, images and private conversations', async (t) => {
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  const users = [],
    reports = [];
  const prefix = 'fixture' + randomUUID().replaceAll('-', '');
  let base;
  async function req(method, path, body, token, status = 200) {
    const response = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result;
  }
  async function upload(id, token, bytes, status = 201, mime = 'image/png') {
    const data = new FormData();
    data.append(
      'file',
      new Blob([bytes], { type: mime }),
      'untrusted-name.png',
    );
    const res = await fetch(base + '/reports/' + id + '/images', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: data,
    });
    const body = await res.json();
    assert.equal(res.status, status, JSON.stringify(body));
    return body;
  }
  try {
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    for (let i = 0; i < 3; i++) {
      const email = `${prefix}-${i}@example.invalid`,
        password = 'FixturePassword123!';
      const user = await req(
        'POST',
        '/auth/register',
        {
          email,
          password,
          full_name: 'Fictional Student',
          student_number: `${prefix}-${i}`,
        },
        null,
        201,
      );
      users.push({ ...user, email, password });
      users[i].token = (
        await req('POST', '/auth/login', { email, password })
      ).access_token;
    }
    const [owner, visitor, outsider] = users;
    const catalogs = await req('GET', '/catalogs');
    assert.ok(catalogs.categories.length > 0);
    assert.ok(catalogs.locations.length > 0);
    const draft = {
      title: prefix + ' blue notebook',
      description: 'Fictional test data only',
      report_type: 'lost',
      category_id: catalogs.categories[0].id,
      location_id: catalogs.locations[0].id,
      occurred_on: '2026-01-01',
    };
    async function create(change = {}) {
      const r = await req(
        'POST',
        '/reports',
        { ...draft, ...change },
        owner.token,
        201,
      );
      reports.push(r.id);
      return r;
    }
    await t.test(
      'strict report validation and public projections',
      async () => {
        await req('POST', '/reports', draft, null, 401);
        for (const change of [
          { title: '' },
          { author_id: outsider.id },
          { occurred_on: '2099-01-01' },
          { occurred_on: '2026-02-30' },
          { report_type: 'other' },
          { category_id: randomUUID() },
        ])
          await req(
            'POST',
            '/reports',
            { ...draft, ...change },
            owner.token,
            400,
          );
        await req('GET', '/reports/not-uuid', undefined, null, 400);
        await req('GET', '/reports/' + randomUUID(), undefined, null, 404);
        const r = await create();
        assert.equal(r.report_type, 'lost');
        assert.equal(r.status, 'open');
        assert.deepEqual(r.images, []);
        assert.equal(r.author_id, undefined);
        assert.equal(r.email, undefined);
        assert.equal(r.student_number, undefined);
        const list = await req('GET', '/reports?q=' + prefix);
        assert.equal(list.items.length, 1);
        assert.equal(list.items[0].description, undefined);
        for (const query of [
          'limit=0',
          'limit=51',
          'limit=abc',
          'limit=1&limit=2',
          'cursor=bad',
          'unknown=1',
          'status=bad',
          'category_id=no',
          'q=' + 'x'.repeat(101),
        ])
          await req('GET', '/reports?' + query, undefined, null, 400);
        assert.equal(
          (await req('GET', '/reports?q=' + encodeURIComponent("' OR 1=1 --")))
            .items.length,
          0,
        );
      },
    );
    const report = reports[0];
    await t.test(
      'owner permissions, state transitions and filters',
      async () => {
        await req(
          'PATCH',
          '/reports/' + report,
          { title: 'Hacked' },
          visitor.token,
          403,
        );
        await req(
          'DELETE',
          '/reports/' + report,
          undefined,
          visitor.token,
          403,
        );
        const recovered = await req(
          'PATCH',
          '/reports/' + report,
          { status: 'recovered' },
          owner.token,
        );
        assert.ok(recovered.recovered_at);
        assert.equal(recovered.report_type, 'lost');
        assert.equal(
          (
            await req(
              'PATCH',
              '/reports/' + report,
              { status: 'recovered' },
              owner.token,
            )
          ).recovered_at,
          recovered.recovered_at,
        );
        assert.equal(
          (
            await req(
              'PATCH',
              '/reports/' + report,
              { status: 'open' },
              owner.token,
            )
          ).recovered_at,
          null,
        );
        await req(
          'PATCH',
          '/reports/' + report,
          { report_type: 'found' },
          owner.token,
          400,
        );
        await req('PATCH', '/reports/' + report, {}, owner.token, 400);
        await create({ report_type: 'found' });
        await create({ report_type: 'lost' });
        const filtered = await req(
          'GET',
          `/reports?q=${prefix}&report_type=found&status=open&category_id=${draft.category_id}&location_id=${draft.location_id}`,
        );
        assert.equal(filtered.items.length, 1);
        assert.equal(
          (await req('GET', '/me/reports', undefined, visitor.token)).items
            .length,
          0,
        );
        assert.equal(
          (await req('GET', '/me/reports?q=' + prefix, undefined, owner.token))
            .items.length,
          3,
        );
      },
    );
    await t.test(
      'cursor keeps timestamp precision and breaks equal-time ties',
      async () => {
        await db.query(
          "UPDATE reports SET created_at='2026-10-01T00:00:00.123456Z' WHERE id=ANY($1::uuid[])",
          [reports],
        );
        await db.query(
          "UPDATE reports SET created_at='2026-10-01T00:00:00.123457Z' WHERE id=$1",
          [report],
        );
        let cursor = null;
        const ids = [];
        do {
          const data = await req(
            'GET',
            `/reports?q=${prefix}&limit=1` +
              (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''),
          );
          ids.push(...data.items.map((r) => r.id));
          cursor = data.next_cursor;
        } while (cursor);
        assert.equal(ids[0], report);
        assert.equal(new Set(ids).size, 3);
        assert.equal(ids.length, 3);
      },
    );
    await t.test(
      'decoded image limits, ownership and transactional deletion',
      async () => {
        const bytes = await sharp({
          create: { width: 32, height: 24, channels: 3, background: '#336699' },
        })
          .png()
          .toBuffer();
        await upload(report, visitor.token, bytes, 403);
        await upload(
          report,
          owner.token,
          Buffer.from('<svg onload="alert(1)"/>'),
          400,
        );
        await upload(
          report,
          owner.token,
          Buffer.alloc(4 * 1024 * 1024 + 1),
          413,
        );
        const image = await upload(
          report,
          owner.token,
          bytes,
          201,
          'text/plain',
        );
        const res = await fetch(base + image.url);
        assert.equal(res.status, 200);
        assert.equal(res.headers.get('Content-Type'), 'image/webp');
        assert.equal(
          (await sharp(Buffer.from(await res.arrayBuffer())).metadata()).format,
          'webp',
        );
        await upload(report, owner.token, bytes);
        await upload(report, owner.token, bytes);
        await upload(report, owner.token, bytes, 400);
        assert.equal((await req('GET', '/reports/' + report)).images.length, 3);
        await req(
          'DELETE',
          `/reports/${report}/images/${image.id}`,
          undefined,
          visitor.token,
          403,
        );
        await req(
          'DELETE',
          `/reports/${report}/images/${image.id}`,
          undefined,
          owner.token,
        );
        assert.equal((await fetch(base + image.url)).status, 404);
      },
    );
    let room;
    await t.test(
      'atomic conversation membership and idempotent private messages',
      async () => {
        await req(
          'POST',
          '/conversations',
          { report_id: report },
          owner.token,
          400,
        );
        const pair = await Promise.all([
          req(
            'POST',
            '/conversations',
            { report_id: report },
            visitor.token,
            201,
          ),
          req(
            'POST',
            '/conversations',
            { report_id: report },
            visitor.token,
            201,
          ),
        ]);
        room = pair[0].id;
        assert.equal(room, pair[1].id);
        assert.equal(
          (
            await db.query(
              'SELECT count(*)::int AS n FROM conversation_members WHERE conversation_id=$1',
              [room],
            )
          ).rows[0].n,
          2,
        );
        await req(
          'GET',
          `/conversations/${room}/messages`,
          undefined,
          outsider.token,
          404,
        );
        await req(
          'POST',
          `/conversations/${room}/messages`,
          { body: 'no', client_message_id: randomUUID() },
          outsider.token,
          404,
        );
        const message = {
          body: 'Hello, is this still available?',
          client_message_id: randomUUID(),
        };
        const sent = await Promise.all([
          req(
            'POST',
            `/conversations/${room}/messages`,
            message,
            visitor.token,
            201,
          ),
          req(
            'POST',
            `/conversations/${room}/messages`,
            message,
            visitor.token,
            201,
          ),
        ]);
        assert.equal(sent[0].id, sent[1].id);
        await req(
          'POST',
          `/conversations/${room}/messages`,
          { ...message, body: 'Different' },
          visitor.token,
          409,
        );
        await req(
          'POST',
          `/conversations/${room}/messages`,
          { body: 'Yes', client_message_id: randomUUID() },
          owner.token,
          201,
        );
        const first = await req(
          'GET',
          `/conversations/${room}/messages?limit=1`,
          undefined,
          owner.token,
        );
        assert.ok(first.next_cursor);
        const second = await req(
          'GET',
          `/conversations/${room}/messages?limit=1&cursor=${first.next_cursor}`,
          undefined,
          visitor.token,
        );
        assert.notEqual(first.items[0].id, second.items[0].id);
        assert.equal(second.next_cursor, null);
        assert.equal(
          (await req('GET', '/conversations', undefined, outsider.token)).items
            .length,
          0,
        );
      },
    );
    await t.test(
      'SSE is member-only and closes after token revocation',
      async () => {
        await req(
          'GET',
          `/conversations/${room}/events`,
          undefined,
          outsider.token,
          404,
        );
        const token = (
          await req('POST', '/auth/login', {
            email: owner.email,
            password: owner.password,
          })
        ).access_token;
        const abort = new AbortController();
        try {
          const response = await fetch(`${base}/conversations/${room}/events`, {
            headers: { Authorization: 'Bearer ' + token },
            signal: abort.signal,
          });
          assert.equal(response.status, 200);
          const reader = response.body.getReader();
          let output = '';
          const readUntil = async (needle) => {
            const timer = setTimeout(() => abort.abort(), 8000);
            try {
              while (!output.includes(needle)) {
                const part = await reader.read();
                if (part.done) break;
                output += new TextDecoder().decode(part.value);
              }
              assert.ok(output.includes(needle), output);
            } finally {
              clearTimeout(timer);
            }
          };
          await readUntil('event: ready');
          await req(
            'POST',
            `/conversations/${room}/messages`,
            { body: 'Live update', client_message_id: randomUUID() },
            visitor.token,
            201,
          );
          await readUntil('event: refresh');
          await req('POST', '/auth/logout', undefined, token);
          await readUntil('event: session-ended');
          await reader.cancel();
        } finally {
          abort.abort();
        }
      },
    );
    await t.test(
      'SSE reconnect recovers REST history and detects expiry',
      async () => {
        const token = (
          await req('POST', '/auth/login', {
            email: visitor.email,
            password: visitor.password,
          })
        ).access_token;
        const abort = new AbortController();
        try {
          const response = await fetch(`${base}/conversations/${room}/events`, {
            headers: { Authorization: 'Bearer ' + token },
            signal: abort.signal,
          });
          assert.equal(response.status, 200);
          const reader = response.body.getReader();
          let output = '';
          const timer = setTimeout(() => abort.abort(), 8000);
          try {
            while (!output.includes('event: ready')) {
              const chunk = await reader.read();
              if (chunk.done) break;
              output += new TextDecoder().decode(chunk.value);
            }
            assert.ok(output.includes('event: ready'));
            assert.equal(
              (
                await req(
                  'GET',
                  `/conversations/${room}/messages`,
                  undefined,
                  token,
                )
              ).items.length,
              3,
            );
            await db.query(
              "UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=encode(sha256($1::bytea),'hex')",
              [Buffer.from(token)],
            );
            while (!output.includes('session-ended')) {
              const chunk = await reader.read();
              if (chunk.done) break;
              output += new TextDecoder().decode(chunk.value);
            }
            assert.ok(output.includes('session-ended'));
            await reader.cancel();
            await req(
              'GET',
              `/conversations/${room}/messages`,
              undefined,
              token,
              401,
            );
          } finally {
            clearTimeout(timer);
          }
        } finally {
          abort.abort();
        }
      },
    );
    await t.test(
      'soft deletion removes public data/images and keeps private history read-only',
      async () => {
        await req('DELETE', '/reports/' + report, undefined, owner.token);
        await req('GET', '/reports/' + report, undefined, null, 404);
        assert.equal(
          (
            await db.query(
              'SELECT count(*)::int AS n FROM report_images WHERE report_id=$1',
              [report],
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (await req('GET', '/reports?q=' + prefix)).items.length,
          2,
        );
        await req(
          'POST',
          '/conversations',
          { report_id: report },
          outsider.token,
          404,
        );
        await req(
          'POST',
          `/conversations/${room}/messages`,
          { body: 'No longer writable', client_message_id: randomUUID() },
          visitor.token,
          409,
        );
        assert.equal(
          (
            await req(
              'GET',
              `/conversations/${room}/messages`,
              undefined,
              owner.token,
            )
          ).items.length,
          3,
        );
      },
    );
  } finally {
    if (users.length) {
      const ids = users.map((u) => u.id);
      await db.query(
        'DELETE FROM conversations WHERE report_id IN (SELECT id FROM reports WHERE author_id=ANY($1::uuid[]))',
        [ids],
      );
      await db.query('DELETE FROM reports WHERE author_id=ANY($1::uuid[])', [
        ids,
      ]);
      await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ids]);
    }
    await app.close();
    await db.end();
  }
});
