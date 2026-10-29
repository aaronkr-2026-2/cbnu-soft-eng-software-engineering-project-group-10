# Step 1: Student Accounts

The current scope covers PostgreSQL and signup, login and logout.
Reports, chat, image uploads and performance benchmarks are not implemented.

## First-time setup

Run `npm ci`, create a PostgreSQL database, copy `.env.example` to `.env`, and set `DATABASE_URL`. Run `npm run db:migrate` followed by `npm run start:dev`. The portable database helper below only works on a machine where `.local/pgsql` and `.local/pgdata` already exist.

## Run on the configured local machine

```powershell
npm run db:local:start
npm run db:migrate
npm run start:dev
```

API: http://127.0.0.1:3001. If a backend process is already running in the
background, stop it before starting another instance on the same port.
Portable PostgreSQL is stored in `.local/` and is not a Windows service;
start it again after rebooting. Local binaries and credentials are not included
in Git; see the database guide for setup on another machine.

- [Database structure](DATABASE.md)
- [Signup, login and logout examples](API.md)

`npm run test:integration` uses a dedicated test database. Other checks are
`npm test`, `npm run test:e2e` and `npm run lint`.

The frontend `/tasks` page uses email/password login, `/auth/me`, and logout from this API. The main CampusFind login/register and listing pages remain a separate localStorage UI demo; connecting those pages to this API is still pending.

## HTTP configuration and verification

Run commands from backend/. The server reads PORT (default 3001) and CORS_ORIGINS
(default http://localhost:3000) from .env. PORT must be an integer from 1 to 65535.
CORS_ORIGINS is a comma-separated list of exact HTTP(S) origins without trailing
slashes, paths, credentials or wildcards. Example:

```dotenv
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Invalid settings fail startup. Restart after changes. The server binds to
127.0.0.1 for local development. CORS controls browser access, not authentication.
The frontend contributor should set NEXT_PUBLIC_API_URL to the matching backend
URL, for example http://localhost:3001.

Create a separate campusfind_auth_test database and configure its DATABASE_URL in
ignored .env.test.local. npm run test:integration rejects database names not ending
in _test, applies migrations and removes generated test accounts afterward. Never
use real student data. Run npm test and npm run lint as additional checks.
See API.md for session/error behavior and REPORTS_SCHEMA.md for the proposed next
schema. Reports migrations and endpoints are not implemented yet.

## Reports preparation and week-two review

- [Reports API contract and pagination](REPORTS_API.md)
- [Schema proposal](REPORTS_SCHEMA.md)
- [Week-two review and remaining work](WEEK_02_REVIEW.md)

The TypeScript reports contract and fixtures compile with the backend, but do not
register routes or create database records. They prepare coordination with the
frontend before the planned migration step.
