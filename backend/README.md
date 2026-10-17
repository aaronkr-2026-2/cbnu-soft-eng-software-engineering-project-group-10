# Step 1: Student Accounts

The current scope covers PostgreSQL and signup, login and logout.
Reports, chat, image uploads and performance benchmarks are not implemented.

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

The frontend has not been integrated. The existing /tasks page uses nickname-based
login and is not compatible with this email/token API. Frontend integration is a
separate step.
