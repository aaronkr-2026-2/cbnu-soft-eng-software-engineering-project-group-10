# Reports schema proposal — October 28, 2026

Design only: no reports migration or endpoint is included. Agree on the list and
detail contract next, then introduce migrations in the planned implementation step.

| Table | Column | Proposed type and constraint |
| --- | --- | --- |
| categories | id | uuid primary key, generated |
| categories | name | text, required, trimmed length 1–80; unique ignoring case |
| categories | is_active | boolean, required, default true |
| locations | id | uuid primary key, generated |
| locations | name | text, required, trimmed length 1–120; unique ignoring case |
| locations | is_active | boolean, required, default true |
| reports | id | uuid primary key, generated |
| reports | author_id | uuid, required FK users.id, ON DELETE RESTRICT |
| reports | category_id | uuid, required FK categories.id, ON DELETE RESTRICT |
| reports | location_id | uuid, required FK locations.id, ON DELETE RESTRICT |
| reports | report_type | text, required, CHECK IN ('lost', 'found') |
| reports | status | text, required, CHECK IN ('open', 'recovered'), default 'open' |
| reports | title | text, required, trimmed length 1–120 |
| reports | description | text, required, trimmed length 1–3000 |
| reports | occurred_on | date, required, campus date of loss/finding |
| reports | created_at | timestamptz, required, default now() |
| reports | updated_at | timestamptz, required, default now(); set on each update |

Each user can own many reports. A report has one category and one location.
Inactive catalog entries remain linked to old reports but cannot be selected for
new ones. Seed an Other category and Unknown campus location when catalogs are
implemented, rather than forcing users to invent details.

## Dates, permissions and public data

- occurred_on is YYYY-MM-DD in Asia/Seoul. Validate actual calendar dates and
  reject future dates at the API boundary. A date avoids inventing an exact time.
- Return created_at and updated_at as ISO 8601 timestamps with explicit timezone.
- Derive author_id from the authenticated session, never from client input.
- Both lost and found reports start open. Only the owner may mark recovered
  after return of the item, or reopen a report. Enforce this in future write APIs.
- Public responses exclude email, student number, password hashes and sessions.
  Forms should discourage publishing sensitive card numbers or identifying details.
- No chat, image storage, or account/report deletion API is included in this step.

## Indexes and deletion

Propose a B-tree index on (created_at DESC, id DESC) for stable listing and cursor
pagination, plus indexes on author_id, category_id and location_id. Add composite
filter indexes only when actual query shapes and measurements justify them.

Restrict parent deletion to avoid losing reports silently. Deactivate catalogs
instead of deleting them. Account deletion and report soft deletion require
separate policies before implementing their endpoints.
