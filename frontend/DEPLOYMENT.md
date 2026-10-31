# Frontend demo deployment

Prepared October 31, 2026. No account, cloud service, commit or deployment was
created by this implementation.

## Prerequisites

Use the backend implementation containing reports, images and chat migrations
002–005, not the older auth-only backend currently present in some frontend
checkouts. Merge the reviewed Tung and Thanh work through the team's normal
workflow before publishing the combined application. Do not force-push branches.

The backend must have a public HTTPS URL, its migrations applied, and CORS_ORIGINS
set to the exact frontend origin (no trailing slash). API requests and authenticated
SSE go directly from the browser to that backend; no frontend API proxy is needed.

## Vercel personal demo

Vercel Hobby is a possible free option for eligible personal, non-commercial
projects within its quotas. Git organization/private repository and collaboration
restrictions may prevent importing this classroom repository under Hobby. Check
eligibility in the dashboard before choosing a provider; do not change repository
visibility or purchase a plan just to bypass an import error.

1. Select the reviewed repository and branch in your own hosting account.
2. Set the Root Directory to frontend and Framework Preset to Next.js.
3. Use Node 24.x, install with npm ci and build with npm run build.
4. Set NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-HOST before building.
   This is a public URL, never a database connection string or secret.
5. Deploy, then configure backend CORS_ORIGINS with the assigned frontend origin.
   Add each preview origin explicitly if you need preview deployments to work.
6. Rebuild when changing NEXT_PUBLIC_API_URL: Next.js embeds it at build time.
7. Test signup/login, a report with a photo, ownership checks and a conversation
   with two accounts. Check the browser Network panel for CORS/mixed-content errors.

Source references (checked October 31, 2026):
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/deployments/troubleshoot-project-collaboration
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/monorepos

## Any Node hosting provider

Run npm ci, npm run build, then npm run start -- --port PORT.
Provide NEXT_PUBLIC_API_URL at build time. This app uses dynamic detail/chat
routes and is not configured for static-only hosting. Hosting fees and quotas
depend on the provider; no paid resources are required by the code.

## Demo behavior and limits

- Sessions are memory-only. Refreshing or opening a new tab requires login.
- Free API hosts may sleep; requests allow up to 60 seconds and expose retries.
- Photos are limited to three per report, 4 MiB input each; the server validates
  decoded content. Save a report first, then upload on its detail page.
- After an interrupted photo upload, refresh before retrying: upload is not
  idempotent. Message retries do reuse the same client_message_id.
- Chat streams stop when the tab is hidden and reconnect with bounded backoff.
  REST history recovers missed pages; the stream only signals changes.
- Private authorization is enforced by the backend. Public report responses omit
  author identity; ownership UI checks the paginated /me/reports endpoint.
- Local test results are not evidence of cloud uptime or high-scale capacity.
- Keep .env.local, test traces and LOCAL_DAILY_PLAN.md out of Git. Traces may
  contain test session tokens; use only disposable accounts.
