# Reports read API contract — October 29, 2026

Implementation target for frontend/backend coordination, pending team review.
These endpoints are NOT implemented: requests currently return 404. No reports
tables, migration, controller or seed data are added by this contract.

Canonical TypeScript shapes: `src/reports/reports.contract.ts`. Fictional examples:
`src/reports/reports.fixtures.ts`. They are compile-checked, not database records
or runtime HTTP validators. Frontend may copy the types/fixtures until a shared
package is justified; do not import backend source into the frontend build.

## GET /reports

Public read endpoint, no Bearer token required. Query parameters:

| Parameter | Default | Rules |
| --- | --- | --- |
| limit | 20 | One decimal integer from 1 to 50 |
| cursor | omitted | One non-empty opaque string, at most 512 characters |

Unknown or repeated query parameters, blank values, non-integer limits and
out-of-range limits return 400. Search/filter/sort parameters are not yet part
of this initial contract; their implementation is scheduled later.

Success: 200 with `ReportListResponse`:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "report_type": "lost",
      "status": "open",
      "title": "Blue notebook near the library",
      "category": { "id": "00000000-0000-4000-8000-000000000010", "name": "Other" },
      "location": { "id": "00000000-0000-4000-8000-000000000020", "name": "Library" },
      "occurred_on": "2026-10-28",
      "created_at": "2026-10-29T01:00:00.000Z",
      "updated_at": "2026-10-29T01:00:00.000Z"
    }
  ],
  "next_cursor": null
}
```

All example values are fictional. Empty results return 200 with
`{"items":[],"next_cursor":null}`. There is no total count or page number.
Both open and recovered reports are included, with their status explicitly shown.
Catalog objects include names to avoid a separate lookup for each card. Historical
reports retain references to inactive catalogs. The response excludes description
on list pages, author identity, email, student number, card numbers and session data.

### Pagination semantics

Sort by `(created_at DESC, id DESC)`; ID breaks ties. For an unchanged dataset,
following cursors returns every row once. Fetch `limit + 1` rows internally to
decide whether another page exists. If so, return at most limit items and a cursor
anchored at the LAST RETURNED row, not the extra row. Otherwise next_cursor is null.

Clients must treat cursors as opaque and URL-encode them using URLSearchParams.
Keep the same limit while paging; reset the cursor when refreshing the list.
Backend implementation should encode a version, full database timestamp precision
and UUID in bounded base64url JSON. Do not reconstruct cursors from the displayed
timestamp: JavaScript milliseconds may lose PostgreSQL microseconds. Validate the
version, timestamp and UUID and use SQL parameters; malformed cursors return 400.
The cursor grants no permissions and does not need to identify a still-existing row.

Newer inserts appear after refreshing the first page. This is not a snapshot:
deletions or edits between requests may change results, and counts are not promised.
Public timestamps use UTC ISO 8601; clients must accept fractional seconds without
assuming exactly three digits. occurred_on is a calendar date in Asia/Seoul and
must not shift through UTC conversion.

## GET /reports/:id

Public read endpoint. Require a UUID in canonical hyphenated form (hex is
case-insensitive). Invalid UUID -> 400. Valid UUID without a report -> 404.
Success -> 200 with `ReportDetail` directly, without an `item` wrapper: the same
fields as a list item plus `description`. No author/contact fields or images.

## Error examples and next steps

Use the existing API error envelope, for example:

```json
{"statusCode":400,"message":"Invalid report cursor","error":"Bad Request"}
```

```json
{"statusCode":404,"message":"Report not found","error":"Not Found"}
```

The frontend should branch on status, not exact message text. A network error has
no guaranteed HTTP response. These report errors are proposed behavior, not live
endpoints. Next: review with frontend, add the migration in the planned October 31
step, then implement catalogs and read endpoints with pagination boundary tests.
