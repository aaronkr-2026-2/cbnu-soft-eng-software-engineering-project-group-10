# Backend deployment (free demo first)

The default recommendation for a zero-budget demo is Render Free for the API
and Neon Free for PostgreSQL. No cloud resources have been created by this change.
Free limits can change: review the provider dashboard before provisioning.
Render's free API can sleep after 15 idle minutes. Neon free storage/compute is
limited; keep demo data small. Run seeds and benchmarks locally, not on free cloud.
Do not use Render Free Postgres for a long-lived project: it expires after 30 days.

Sources checked October 30, 2026:
- https://render.com/docs/free
- https://neon.com/blog/neon-free-plan-1-gb-per-project

## Render + Neon

1. Create a free Neon project. Obtain its direct PostgreSQL connection string
   with TLS enabled. Treat it as a secret; never commit it or paste it in logs.
2. Create a Render Web Service from the GitHub repository/branch you choose.
   Set root directory to backend, runtime Node, and select the Free instance.
3. Build command: `npm ci --include=dev && npm run build`.
4. Start command: `node scripts/migrate.mjs && node dist/main.js`.
   Migrations run before serving traffic, under a PostgreSQL transaction lock.
   They are repeatable and verify applied checksums. Never run benchmark seeds here.
5. Set environment: DATABASE_URL (Neon secret), NODE_ENV=production,
   HOST=0.0.0.0, CORS_ORIGINS=https://YOUR-FRONTEND-HOST. Keep Render's PORT.
   Set health check path to /health/ready. Pin Node to the current supported 24.x
   release in provider settings. The package engines field documents that range.
6. The frontend contributor sets NEXT_PUBLIC_API_URL to the HTTPS service URL,
   rebuilds frontend, and tests signup/login/reports. CORS origins have no path
   or trailing slash. No frontend files are changed by this backend increment.
7. Make a demo account and a few fictional reports. Verify image persistence
   across restart and chat REST fallback if a stream reconnects. First access
   after inactivity may be slow; do not use keep-alive traffic to defeat quotas.

Do not guess trusted proxy networks. TRUST_PROXY is empty by default: rate limits
then use the direct peer, so users behind a platform proxy may share a quota.
Configure only documented/verified proxy IPs or CIDRs for the chosen host.
Never set trust proxy to true or trust all networks just to improve demo behavior.
TLS termination and trusted proxy verification need testing on the actual host.

Images are normalized to WebP and stored in PostgreSQL, not Render's ephemeral
filesystem. Up to three images per report, at most 1 MiB each. For 1 GB free DB
storage, even a few hundred maximum-sized images plus indexes can exhaust quota.
The free deployment is for a SMALL demo, not the synthetic 100k-user dataset.
Close SSE streams when the UI is idle/hidden to avoid unnecessary database compute.

## Docker / VPS alternative

Docker is optional and not installed on the development machine used for this
implementation. The Dockerfile/Compose recipe has not been built on that machine.
Verify it on a Docker host before treating it as a tested deployment.

Create ignored backend/.env.deploy with a strong URL-safe password (for example
64 random hexadecimal characters) and the exact frontend origin:

```dotenv
POSTGRES_PASSWORD=REPLACE_WITH_RANDOM_HEX_PASSWORD
CORS_ORIGINS=https://YOUR-FRONTEND-HOST
```

From backend/:

```sh
docker compose --env-file .env.deploy up --build -d
docker compose --env-file .env.deploy logs migrate api
```

The database has a persistent volume and no published port. API is published on
host loopback port 3001. Put your HTTPS reverse proxy in front of it and disable
proxy buffering for /conversations/*/events. Preserve Authorization headers.
Configure TRUST_PROXY only for that proxy and pass it explicitly to the API
service environment if needed. The API runs as a non-root user.

For upgrades, back up first, then rebuild and recreate migrate and api so the
one-shot migration runs again. Do not use `down -v` on persistent data. Roll back
application images only when compatible with the current forward-only schema;
there are no automatic destructive down migrations.

## Backups and operation

Use pg_dump -Fc against the direct PostgreSQL endpoint and restore into a separate
empty database with pg_restore. Back up the entire DB, including report_images.
Keep credentials in the environment or pgpass, never in committed command files.
Verify restoration before relying on a backup. Backups and TLS are operator tasks;
this change does not claim they are already configured on a cloud account.

GET /health/live checks the process; /health/ready checks database connectivity.
Graceful shutdown closes database pools and SSE connections. Logs omit raw SQL,
request bodies, passwords and tokens. Monitor HTTP errors, storage, connections
and CPU. Per-process rate limits are not distributed; use one instance initially.
Set infrastructure resource/egress limits and budget alerts before any paid upgrade.

## Release verification

Run npm run lint, npm test, npm run test:e2e, npm run test:integration locally.
Check npm audit --omit=dev. Provision a fresh test database and replay migrations.
Verify a real HTTPS client, CORS, database TLS, reconnects and backups on the
selected host before announcing deployment. No hosted URL is created by this repo.
