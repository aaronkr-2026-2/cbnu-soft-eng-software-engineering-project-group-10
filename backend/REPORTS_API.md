# Reports API

Implemented October 30, 2026. Base URL is the backend URL. Public responses never
include author email, student number, password hashes or session tokens. All
example IDs and report content below are fictional.

## Catalogs and reads

- GET /catalogs -> {categories:[{id,name}], locations:[{id,name}]} (active only).
- GET /reports -> {items: ReportSummary[], next_cursor: string | null}.
- GET /reports/:id -> ReportDetail directly. Invalid UUID: 400; missing/deleted: 404.
- GET /me/reports -> same list response, scoped to authenticated account.

List query parameters (unknown/repeated/empty invalid parameters return 400):

| Parameter | Rules |
| --- | --- |
| limit | integer 1–50, default 20 |
| cursor | opaque base64url string up to 512 characters |
| report_type | lost or found |
| status | open or recovered |
| category_id / location_id | UUID |
| q | trimmed non-empty keyword string, maximum 100 characters |

Filters combine with AND. Search is PostgreSQL simple full-text search across
Title + description using parameterized plainto_tsquery: words, not arbitrary SQL,
regex or substring matching. It has no language-specific stemming. Punctuation
is interpreted by PostgreSQL's text parser. Empty matches return 200 with an empty
items array and null cursor, not 404. Both recovery states are included by default.

ReportSummary fields:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "report_type": "lost",
  "status": "open",
  "title": "Blue notebook",
  "category": {"id":"00000000-0000-4000-8000-000000000010","name":"Other"},
  "location": {"id":"00000000-0000-4000-8000-000000000020","name":"Library"},
  "occurred_on": "2026-10-28",
  "created_at": "2026-10-30T01:00:00.000Z",
  "updated_at": "2026-10-30T01:00:00.000Z",
  "recovered_at": null,
  "images": []
}
```

ReportDetail adds description. Images contain id, url, width and height; resolve
relative /images/:id URLs against the BACKEND origin, not the frontend host.
TypeScript definitions and fictional fixtures are in src/reports/.

## Cursor/date rules

Lists sort by created_at DESC, id DESC. Cursors preserve database microseconds;
never reconstruct them from a formatted date. Pass the returned cursor via
URLSearchParams, keeping filters/limit stable. Reset pagination after changing
filters. There is no total count or numeric page. On unchanged data, equal-time
rows are neither skipped nor duplicated. Newer rows appear on a first-page
refresh; concurrent changes do not produce a snapshot guarantee.

occurred_on is YYYY-MM-DD in Asia/Seoul, from 1900-01-01 through today. Validate
calendar dates without timezone conversion. Other dates are ISO 8601 UTC timestamps.

## Authenticated writes

Send Authorization: Bearer <token> and Content-Type: application/json.

POST /reports -> 201 ReportDetail. Required body:

```json
{
  "title":"Blue notebook",
  "description":"Fictional demonstration report.",
  "report_type":"lost",
  "category_id":"00000000-0000-4000-8000-000000000010",
  "location_id":"00000000-0000-4000-8000-000000000020",
  "occurred_on":"2026-10-28"
}
```

Use real catalog IDs from /catalogs. Title: 1–120 trimmed characters; description:
1–3000; valid date; active catalog IDs. Client-supplied author_id is rejected.

PATCH /reports/:id -> 200 ReportDetail. Owner-only. Accepts any non-empty subset
of title, description, category_id, location_id, occurred_on, status. report_type
and author are immutable. Recovered sets recovered_at once; repeated recovered
preserves it; reopening clears it. Unknown fields or empty updates return 400.

DELETE /reports/:id -> 200 {success:true}. Owner-only soft delete; public reads and
image URLs then return 404. Images are deleted in the same transaction. Repeat
delete returns 404. Existing private chat remains readable, with new sends blocked.

## Images

POST /reports/:id/images: authenticated owner, multipart/form-data, exactly one
file field named file and no text fields. Up to 4 MiB input, JPEG/PNG/WebP only,
single-frame, at most 16 million pixels. Server decodes contents regardless of
client MIME/name, strips metadata, rotates and resizes inside 1600x1600, then
encodes WebP. Output must be at most 1 MiB. Maximum three images per report.
Response: 201 {id,url,width,height}.

GET /images/:id: public for non-deleted reports, returns image/webp, nosniff,
no-store. DELETE /reports/:reportId/images/:imageId: owner-only, 200 {success:true}.
Invalid content: 400; too large: 413; missing: 404; image processor busy: 503.
Uploads and deletes store metadata/content atomically in PostgreSQL.

## Errors and limits

Missing/invalid session: 401. Wrong owner: 403. Unknown report/image: 404.
Input errors: 400. All authenticated report/image/chat writes share a per-user
60-per-minute fixed window per process; excess returns 429 with Retry-After.
Unexpected failures return a generic 500 response. The server accepts JSON bodies
up to 32 KiB and has bounded active requests; clients should retry transient
503s with backoff, not send unlimited requests.
