# Week-two backend review

Performed on October 29, 2026, covering the October 29 contract task and the
October 30 review slot early. No work is claimed to have occurred on October 30.

## Decisions and lessons

- Preserve the existing account schema and applied migrations. Signup already
  uses a transaction and unique constraints; regression tests protect rollback.
- Session state is server-owned. Tokens live in client memory, have a fixed
  24-hour lifetime, and are revoked individually by logout. A UI profile or a
  successful page refresh does not prove authentication.
- Check missing/malformed/unknown/expired tokens as well as successful login.
  Wrong passwords and unknown accounts share one response. Tests also verify
  logout isolation, safe server-error responses and configured CORS behavior.
- Configuration validation should fail early. CORS is a browser access policy,
  not authorization; backend ownership checks will still be required for writes.
- Contract types and fictional fixtures enable parallel frontend work without
  pretending that a database table or API route already exists.
- Cursor ordering needs both timestamp and UUID. Preserve database timestamp
  precision inside the cursor; display timestamps must not become pagination keys.

## Review scope and verification

Run from backend/: npm run test:integration, npm test, npm run test:e2e and
npm run lint. Integration includes build and runs against the dedicated _test
PostgreSQL database. The reports contract is checked by the TypeScript build;
its future HTTP behavior is not implemented or tested yet.

Existing auth regression coverage is reused, not duplicated just to create new
commits. This review does not claim a production security audit or a frontend
end-to-end verification.

## Remaining work

1. Frontend contributor reviews REPORTS_API.md and maps report_type/occurred_on
   to existing demo fields. Types/fixtures are proposed coordination artifacts,
   not evidence that both contributors have approved the contract.
2. Add categories/locations/reports migration in the October 31 plan step.
3. Add catalogs and GET list/detail endpoints in their scheduled increments.
   Cover equal timestamps, empty/final pages, malformed cursors, unknown IDs,
   and exclusion of private account fields with database-backed tests.
4. Keep email verification, password reset, persistent browser login, images,
   chat and distributed rate limiting out of this increment.

No reports routes, migrations, chat or frontend changes are part of this review.

Validation on October 29: build, 12 PostgreSQL integration tests, 18 unit tests,
one e2e smoke test and lint passed. No new report HTTP behavior is claimed.
