# CampusFind backend

NestJS + PostgreSQL backend for student accounts, lost/found reports, bounded
image uploads and private conversations. Implemented on October 30, 2026 following
the remaining backend plan through December. Frontend integration is separate.

## Local setup

Use Node 24.x and PostgreSQL 17. From backend/:

```sh
npm ci
# Copy .env.example to .env, then configure DATABASE_URL privately.
npm run db:migrate
npm run start:dev
```

On the original configured Windows machine, npm run db:local:start starts the
portable PostgreSQL in ignored .local/. Other machines need their own database;
portable binaries and credentials are not committed. API defaults to
http://127.0.0.1:3001. Stop your own old API process before restarting on that port.

Set PORT, HOST and CORS_ORIGINS as documented in .env.example. The API validates
port/origin/bind/proxy settings. /health/live reports process health and
/health/ready checks PostgreSQL. Database pool size is five, with connection and
statement timeouts. Never publish .env or database dumps.

## Implemented features

- Signup/login/me/logout with hashed passwords and opaque, hashed session tokens.
- Seeded category/location catalogs; reports list/detail/create/edit/recovery,
  owner-only writes, soft deletion, search and stable cursor pagination.
- Up to three decoded/re-encoded WebP images per report; atomic database storage.
- Private two-member conversations linked to reports, paginated history,
  idempotent sends and authenticated SSE refresh notifications.
- Startup migrations, safe errors, local rate limits, health checks, Docker
  packaging, a free-cloud deployment guide, and local benchmark tooling.

API.md documents accounts; REPORTS_API.md documents report operations;
CHAT_API.md documents messages and realtime. DEPLOYMENT.md explains Render Free
+ Neon Free and the optional Docker/VPS route. DATABASE.md describes migrations.
BENCHMARK_RESULTS.md records actual local measurements and limitations.

## Verification

Create a separate database with a name ending in _test, configure its
DATABASE_URL in ignored .env.test.local, then run:

```sh
npm run lint
npm test
npm run test:e2e
npm run test:integration
```

Integration builds first, applies migrations only to the test DB, and cleans its
own fictional accounts/reports. Tests cover unauthorized writes, cursor precision,
image validation, message retries and revocation of active event streams.
Do not point tests or seed scripts at a real student database.

## Boundaries

This is a single-instance demo baseline, not a production security certification
or a million-RPS system. Email/student status verification, password reset,
moderation, account deletion, distributed rate limits and object storage are not
implemented. Images consume PostgreSQL storage; use small demo data on free tiers.
Auth tokens stay in client memory; reload requires login. SSE requires an
Authorization-capable fetch client and REST resync on every reconnect.

The original read-only /tasks and root Hello World routes are retained for course
compatibility; they are not the reports API. No frontend files are changed here.
