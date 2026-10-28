# Database — Step 1

Application database: `campusfind_auth` (local PostgreSQL).
Test database: `campusfind_auth_test`.

| Table | Columns | Purpose |
| --- | --- | --- |
| users | id, email, password_hash, created_at | Login accounts |
| students | user_id, full_name, student_number | Student details; user_id references users.id |
| auth_sessions | token_hash, user_id, expires_at, created_at | Login sessions; logout deletes the session |

- Each student has one account. Signup creates both records in one transaction.
- Emails are unique ignoring case; student numbers are also unique.
- Passwords are hashed with scrypt; plaintext passwords are not stored.
- Student numbers are self-reported and have no verification workflow yet.
- Sessions expire after 24 hours. Only token hashes are stored in the database.
- `campusfind_internal.schema_migrations` tracks applied migrations.

This step has one migration: `migrations/001_auth.sql`.
Run `npm run db:migrate`; repeated runs do not create duplicate tables.

Connection settings are in `.env`, with test settings in `.env.test.local`.
Do not commit these files. Use `npm run db:local:start` to start PostgreSQL and
`npm run db:local:stop` to stop it without deleting data. On another machine with
PostgreSQL installed, create a database and configure DATABASE_URL.

The previous expanded implementation was removed from the current source.
The old `campusfind` and `campusfind_test` databases remain as local backups and
are no longer used by the application. A dump and the old migrations are stored
in `.local/previous-scope/`. Do not edit migrations already applied to the old
databases; this smaller implementation uses new databases and a separate migration history.

The next reports/categories/locations design is in [REPORTS_SCHEMA.md](REPORTS_SCHEMA.md).
It is a proposal only; the live schema remains unchanged.
