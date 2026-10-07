# Sprint 01 — CampusFind

## Goal and capacity

**Goal:** Students can browse lost/found reports from the backend and open a report's details to identify belongings that may be theirs.

- Planning date: 2026-10-07. Proposed sprint: 2026-10-08–2026-10-14 (one week, Asia/Seoul); adjust to the actual class schedule.
- Owner: project author (solo developer, as recorded in `Project.md`).
- Assumed capacity: 16 person-hours; selected work: 14 hours, plus 2 hours for unexpected problems. These are planning estimates, not hours already worked.
- Deliverable: a local, read-only demonstration with clearly identified synthetic seed data. Persistent posting, real accounts, image upload and deployment remain outside this sprint.

## Diagnosis of the current repository

Static inspection on 2026-10-07 found:

| Evidence | Consequence |
| --- | --- |
| `frontend/app/page.tsx` contains six hardcoded reports and local search/status filtering. | The homepage is a UI prototype, not connected to report data from the backend. |
| The homepage links to `/items/{id}`, `/login`, `/register` and `/post`; only `/` and `/tasks` have page files. The hero detail button has no action. | Core navigation cannot complete the advertised journeys. |
| `backend/src/tasks/` serves an in-memory task list; `frontend/services/api.service.ts` supports only tasks and login. | No lost/found list or detail API exists. |
| `backend/src/auth/auth.service.ts` checks one hardcoded plaintext account and returns a success flag; there is no token/session or route guard. | Authentication is a demo and must not be treated as protection for real reports. |
| API URL and CORS origin are hardcoded to localhost. | Deployment configuration needs separate work. |
| Existing backend specs check the generated Hello World endpoint; the frontend has no test script. | Report journeys have no regression coverage. |

`Project.md` describes intended Supabase services, not an implemented database/auth integration. Its phrase “Nest.js API Routes” should be read as a separate NestJS backend; correcting the broader project document is deferred.

### Baseline verification (2026-10-07)

- `backend: npm run build` — passed.
- `backend: npm test` — one test failed because the `beforeEach` hook in `src/app.controller.spec.ts` exceeded its 10-second timeout. This does not establish an application logic defect; investigate environment/setup timing before changing test limits.
- `frontend: npm run lint` — stopped after several minutes without a result; inconclusive, not a pass.
- No frontend build, browser walkthrough or end-to-end suite was run during this planning task. Route gaps above are based on source inspection.
- Planning document whitespace was checked with `git diff --check`; six remote issues and their labels were read back and verified.

## Prioritized product backlog

The six GitHub issues are linked at the end of this document. Rank is the execution priority; P1 precedes P2. Readiness describes whether an item is ready for consideration, refinement or implementation, not whether coding is complete.

| Rank / ID | Item | Type | Priority | Readiness | Short rationale | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| 1 / CF-01 | Serve lost/found reports from NestJS and connect homepage | Feature | P1 | Implementation | A shared report source is required before students can browse actual API results. | Selected: 8 h |
| 2 / CF-02 | Repair report detail and unavailable navigation | Bug | P1 | Implementation | Existing controls lead to missing pages or perform no action. | Selected: 6 h |
| 3 / CF-03 | Replace demo authentication with persistent sessions | Engineering | P1 | Refinement | Posting needs a real identity and server-side authorization; a success flag is insufficient. | Later |
| 4 / CF-04 | Create and persist validated lost/found reports | Feature | P2 | Refinement | Students need to contribute reports; requires storage and identity decisions first. | Later |
| 5 / CF-05 | Automate report search and filter regression checks | Test | P2 | Refinement | Protect combined search/status behavior as the report data source changes. | Later |
| 6 / CF-06 | Configure API URL and CORS through environment settings | Engineering | P2 | Consideration | Remove localhost assumptions before a hosted integration. | Later |

CF-01 and CF-02 include their own focused tests; CF-05 adds broader search/filter regression coverage. No claim is made that all six items fit in this sprint.

## CF-01 — API-backed browsing (8 person-hours)

**User story:** As a student looking for a lost belonging, I want to browse report data served by CampusFind so that the list and detail view use the same information.

**Implementation scope:** Add a NestJS reports module with `GET /reports` and `GET /reports/:id`. Initially use a small, deterministic in-memory set of synthetic reports. Define id, name, description, category, location, date, Lost/Found status and display emoji. Replace the homepage's embedded array with API loading while retaining its existing search and status filter behavior. Show a visible demo-data notice. Do not collect personal contact information in this slice.

**Acceptance checks:**

1. `GET /reports` returns 200 and the agreed report fields; an existing ID returns the matching report and an unknown ID returns 404. Automated backend checks cover all three cases.
2. With both apps running, the homepage shows reports from the API; a known keyword and Lost/Found selection narrow the displayed results correctly, and no matches show the existing empty state.
3. During a delayed request the UI shows loading; an API failure shows an understandable error with retry; an empty successful response shows an empty state, not fabricated reports.

**Dependencies:** Existing NestJS app and Next.js homepage; agree the small report contract before CF-02 starts. No Supabase account or database provisioning is needed for this demonstration.

**Likely blockers:** Local port/CORS mismatch, backend startup configuration, disagreement between API field names and UI types, and the baseline test timeout recorded below. Diagnose local configuration first; use the agreed contract when developing the UI independently. Investigate the test timeout before adding endpoint tests; use contingency time and reduce scope explicitly if it persists.

## CF-02 — Working detail/navigation flow (6 person-hours)

**User story:** As a student browsing reports, I want detail controls to open the matching report so that I can read its description, place and date.

**Implementation scope:** Add `/items/[id]` using CF-01's detail endpoint. Wire the hero detail control to a real seeded report; make “View all items” navigate to the report list. Until posting/accounts are implemented, replace unsupported `/post`, `/login` and `/register` navigation with visibly unavailable controls and a short user-facing explanation. Do not redirect students to the unrelated tasks demo.

**Acceptance checks:**

1. A report card and the hero detail control open the matching report with name, description, category, Lost/Found status, location and date; a back-to-list link works.
2. Opening an unknown ID shows “Report not found” with a way back; API failure has a distinct recoverable error state. Both outcomes are checked separately.
3. All homepage action controls are audited: implemented actions work, and unimplemented posting/account actions are clearly unavailable rather than linking to missing pages. Verify at mobile and desktop widths.

**Dependencies:** CF-01 report contract and detail endpoint. Page layout can start against a fixture after the contract is agreed, but final verification requires the backend.

**Likely blockers:** Route parameter handling in the installed Next.js version and backend availability. Read the installed framework guidance before implementation; reserve buffer for integration.

## Ordered tasks and ownership

All tasks are started by the solo project author; AI assistance is disclosed in `AI_LOG.md`.

| Order | Parent | Small task | Estimate |
| --- | --- | --- | --- |
| 1 | CF-01 | Define report fields and deterministic seed fixtures | 1 h |
| 2 | CF-01 | Implement list/detail endpoints and unknown-ID behavior | 2 h |
| 3 | CF-01 | Connect homepage; add loading, error, retry and empty states | 3 h |
| 4 | CF-01 | Test endpoints and manually verify search/status integration | 2 h |
| 5 | CF-02 | Build report detail route, back link and failure states | 3 h |
| 6 | CF-02 | Repair hero/list actions and mark unavailable actions clearly | 1 h |
| 7 | CF-02 | Check detail/unknown/error cases and mobile/desktop navigation | 2 h |
| 8 | Both | Contingency for integration failures | 2 h |

If time is short, complete and verify CF-01 first and record unfinished CF-02 checks explicitly; do not mark incomplete work done or expand the sprint to posting/authentication.

## Asynchronous check-ins

Post brief progress comments on the two selected issues on 2026-10-10 and 2026-10-13 (proposed dates), using: **Done / Next / Blocked / Remaining estimate**. For solo work these are a progress record for the instructor. At sprint end, record which acceptance checks passed and carry incomplete work forward. No progress check-ins have been performed by creating this plan.

## Definition of Done

- [ ] The item's acceptance checks pass, with test output or reproducible manual steps recorded in its issue/PR.
- [ ] Relevant automated tests pass and both changed applications build; relevant lint checks pass or pre-existing failures are explicitly recorded and distinguished from new ones.
- [ ] Loading, empty, unavailable-data and error behavior are checked where applicable.
- [ ] Changed UI works at mobile and desktop widths, with keyboard-accessible controls.
- [ ] The author reviews and can explain the changes; no credentials or real personal data are committed.
- [ ] Code is committed and integrated into `main`; setup notes are updated if behavior/configuration changed.
- [ ] `AI_LOG.md` records assistance honestly; the issue links evidence and is closed only when complete.

## GitHub tracking

- [CF-01: Serve lost/found reports from NestJS and connect homepage](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/2)
- [CF-02: Repair report detail and unavailable navigation](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/3)
- [CF-03: Replace demo authentication with persistent sessions](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/4)
- [CF-04: Create and persist validated lost/found reports](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/5)
- [CF-05: Automate report search and filter regression checks](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/6)
- [CF-06: Configure API URL and CORS through environment settings](https://github.com/aaronkr-2026-2/cbnu-soft-eng-software-engineering-project-group-10/issues/7)
