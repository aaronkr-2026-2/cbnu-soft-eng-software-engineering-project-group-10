# CampusFind frontend

Next.js App Router frontend for the NestJS/PostgreSQL CampusFind API. Project
content is English. The implementation replaces browser-local report fixtures
with server-backed data.

## Run locally

Use Node 24.x. From frontend/:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your running backend origin.
npm run dev
```

The default frontend is http://localhost:3000 and the example API is
http://localhost:3001. Configure backend CORS_ORIGINS to match the frontend origin.
The backend must include migrations 002–005 and the reports/images/chat APIs.
The older backend copied into this branch may not yet include those changes;
use the reviewed Tung implementation until the branches are merged.

## Available flows

- Register, login, profile and logout against the real account API.
- Public report cards and direct detail links, with loading/error/empty states.
- Keyword search (350 ms debounce), type/status/category/location filters and
  cursor pagination. Filters live in the URL and survive navigation.
- Create, edit, recover/reopen and confirm deletion of owned reports.
- Select, preview, upload and remove photos, including progress and failures.
  Reports save first; photos are uploaded from the report detail screen.
- Inbox, private message history, older-page loading and safe send retries.
- Authenticated SSE refresh events, reconnect backoff and REST recovery across
  missed pages. Streams pause while the browser tab is hidden.
- Responsive layouts, explicit form labels, keyboard focus and a skip link.

## Session and API behavior

Tokens exist only in memory. Refreshing or opening another tab requires login.
401 responses clear the session. Logging out waits for server confirmation;
a network failure does not incorrectly claim the token was revoked.
Reports and conversations are never stored in localStorage.

Public reports intentionally omit author identity. Ownership controls are
derived from the paginated /me/reports endpoint, while the backend remains the
authority for every write. This lookup may take longer for accounts with many
reports; a future API-owned permission flag could avoid that scan.

Images resolve relative URLs against the API origin, use browser loading and
fallbacks, and do not require a paid image service. The backend validates content.
Uploads are not idempotent: after an ambiguous network failure, refresh the report
before retrying. Message retries preserve their UUID and body.

## Checks

```powershell
npm run lint
npm run build
npm run test:e2e
```

The default browser tests use mocked HTTP responses and Microsoft Edge, on desktop
and mobile viewport projects. Install Edge or select an installed Playwright
channel through PLAYWRIGHT_CHANNEL. The tests start a production server at
localhost:3030; build first and leave that port free. For the mocked suite, build
with the example NEXT_PUBLIC_API_URL=http://localhost:3001.

The opt-in tests/live.spec.ts uses LIVE_API_URL pointing to a dedicated local test
backend. It creates disposable accounts with a frontend-live-20261031- prefix
and uses two browser contexts for a report, upload and private chat. Never point
it at a real student database. An operator must clean these fixture accounts and
their related records from the test database after running it. The test redirects
the example API URL to the selected local backend; hosting configuration still
needs a separate deploy smoke test.

See DEPLOYMENT.md for hosting configuration and VALIDATION.md for verified results
and outstanding checks. Test traces/screenshots are ignored and may contain
disposable credentials; do not publish them.

## Scope

This is a demo MVP. Profile editing, password recovery, email/student verification,
moderation, read receipts, chat attachments and notification badges are not exposed
because the backend has no corresponding contract. No million-request capacity
claim is made. Production deployment and a classroom demo rehearsal remain
operator steps; this change does not push or deploy.
