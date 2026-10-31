# Frontend validation — October 31, 2026

Checkout: Thanh. Existing Git identity: TanThanh1603. No commit, push or cloud
deployment was performed. Backend source files were not changed by this work.

## Checks completed

- ESLint: passed without warnings after correcting the image-rule comment.
- Production build: passed with Next.js 16.4.3 and Node 24.15.0, including TypeScript.
- Playwright: 17 passed, one intentionally skipped. Seven mocked UI scenarios
  ran on desktop and mobile, the SSE parser ran in both projects, and the real
  two-account integration ran on desktop only.
- Runtime dependency audit (npm audit --omit=dev): zero reported vulnerabilities.
- Full audit still reports 16 moderate development-toolchain findings related
  to ESLint/minimatch dependencies. A forced downgrade suggested by npm was not
  applied. These are not included in the runtime-only audit result above.
- git diff --check: passed. The local plan and test output remain ignored.

## Behavior exercised

Mocked browser checks cover filters, cursor paging, delayed/stale responses,
network error versus empty results, owner publish/edit/status requests, immutable
report type, image validation and multipart errors, private message retry keys,
401 expiry, direct links, non-owner controls and sign-out on reload. Reconnect
tests recover 55 missed messages across multiple pages without duplication.
The parser test splits UTF-8 and CRLF boundaries one byte at a time.

The real integration used the existing Tung backend with its dedicated _test
PostgreSQL database on a separate local port. It created two disposable accounts,
published a report, uploaded and removed an image, exchanged private messages
through realtime refresh, changed recovery status and deleted the report.
It verified that deleted reports return 404 and their conversations reject new
messages as read-only. The test-specific accounts and related records were
cleaned afterward, and the temporary backend server was stopped.

Screenshots of mobile report detail and desktop live chat were visually reviewed.
The mobile check also asserts no horizontal document overflow. This is browser
viewport coverage, not testing on physical phones or a complete accessibility
audit. Test artifacts remain local and ignored.

## Issue found and corrected

A pending debounced search could replace the route after a report card was
clicked. Filters now use Next.js-supported native history updates, guard against
changing a different pathname, and display pending-search feedback before showing
results. The two-account journey and desktop/mobile filter regressions passed
after the correction. Live fixtures now use unique titles to avoid collisions
between repeated test runs.

## Still required before the public demo

1. Review and merge the matching frontend/backend branches through the team's
   normal process. The backend bundled in an older frontend checkout is not a
   substitute for the new reports/images/chat implementation.
2. Provision the selected hosting accounts and configure HTTPS API URL, CORS and
   database migrations. NEXT_PUBLIC_API_URL must be supplied at build time.
3. Repeat the two-account smoke journey at the deployed URLs, including free-host
   cold start, image delivery and reconnect after a real network interruption.
4. Complete team acceptance and presentation rehearsal. No cloud uptime, maximum
   user count or high-throughput benchmark is inferred from these local tests.

See DEPLOYMENT.md for setup. Memory-only sessions require login after refresh;
profile editing, password recovery, moderation and email/student verification
remain outside the available backend contract.
