import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Configure backend/.env first.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
let connected = false;
let transaction = false;
try {
  await client.connect();
  connected = true;
  // Serialize migrations and apply the whole batch atomically.
  await client.query('BEGIN');
  transaction = true;
  await client.query("SELECT pg_advisory_xact_lock(714013, 1)");
  await client.query('CREATE SCHEMA IF NOT EXISTS campusfind_internal');
  await client.query(`CREATE TABLE IF NOT EXISTS campusfind_internal.schema_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = new URL('../migrations/', import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  const applied = [];
  for (const name of files) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query(
      'SELECT checksum FROM campusfind_internal.schema_migrations WHERE name = $1', [name],
    );
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error('Applied migration changed; restore it and add a new migration.');
      }
      continue;
    }
    await client.query(sql);
    await client.query(
      'INSERT INTO campusfind_internal.schema_migrations (name, checksum) VALUES ($1, $2)',
      [name, checksum],
    );
    applied.push(name);
  }
  await client.query('COMMIT');
  transaction = false;
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
} catch (error) {
  if (transaction) await client.query('ROLLBACK').catch(() => {});
  // Do not print connection URLs, passwords or server error details.
  console.error('Migration failed. Check connectivity, permissions, existing tables and migration checksums.');
  if (error?.code && /^[A-Z0-9]{5}$/.test(error.code)) console.error(`PostgreSQL code: ${error.code}`);
  process.exitCode = 1;
} finally {
  if (connected) await client.end();
}
