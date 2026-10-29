# CampusFind frontend

Next.js App Router with React, TypeScript, Tailwind CSS and Lucide icons.

## Run locally

From frontend/, run npm ci, copy .env.example to .env.local, then npm run dev.
Open http://localhost:3000. NEXT_PUBLIC_API_URL defaults to http://localhost:3001.
This public value is embedded at build time: restart development or rebuild after
changing it. Never put secrets in NEXT_PUBLIC_ variables. The backend must allow
this browser origin in CORS_ORIGINS (localhost and 127.0.0.1 are different origins).

## Account flows (implemented October 28)

- /register validates full name, student number, email, password and agreement.
  It calls POST /auth/register, disables repeated submissions, displays errors,
  and sends successful registrations to /login. Registration does not log in.
- /login calls POST /auth/login followed by GET /auth/me. Profile information
  comes from the server, not from the email address or a localStorage profile.
- Tokens remain in memory only. Client-side navigation keeps the session; a full
  reload or new tab requires login again. No password or token is persisted.
- Sessions expire after the API lifetime (currently 24 hours). The client checks
  /auth/me when the window regains focus. A 401 clears session state and shows a
  sign-in message; protected screens expose a login link with a return path.
- Logout calls POST /auth/logout. A successful response or 401 clears local
  state; connection failures keep the session visible and allow retry.
- /profile is read-only because no backend profile-update API exists yet.
- /tasks is a diagnostic page with its own in-memory session.

## Listings remain a demo

Homepage, browse, detail, post/edit and My posts still use browser-local fixture
items (campusfind-demo-items-v1). Their ownership checks are UI demonstrations,
not server authorization. No shared report API or durable image upload is wired
up. Old campusfind-demo-session-v1 data is ignored and removed on mount.
See REPORT_UI_PLAN.md for the October 28 card/detail proposal. Do not present
fixture items or demo edits as real backend records.

## Verification

Run npm run lint and npm run build. Manually exercise:

1. Blank/invalid signup: English field errors and focus on the first error.
2. Successful signup: one request, then login prompt; duplicate data: show 409.
3. Wrong password: login error; correct password: server profile appears.
4. Client navigation keeps login; full reload signs out without restoring a demo profile.
5. Logout succeeds and protected pages require login. Network failure allows retry.
6. Expired/unknown token returns 401 and removes account state on focus.
7. Keyboard navigation, labels, password visibility and narrow screens remain usable.

Backend startup and account contract are maintained by the backend contributor.
