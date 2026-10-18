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
