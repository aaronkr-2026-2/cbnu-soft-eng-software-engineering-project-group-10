# Report card and detail UI proposal — October 28, 2026

Historical design proposal from October 28. The October 31 implementation now
uses the real report API; see README.md and lib/report-types.ts for current behavior.
The notes below describe the original planning increment.

## Card

Display lost/found label, title, category, location, occurred_on (campus calendar
date), and open/recovered status. Link the title and primary action to the detail
route. Use a neutral placeholder rather than implying an uploaded photo exists.
Never show student numbers, account emails or card identification numbers.

## Detail

Show the same summary followed by description, created_at and updated_at in the
viewer's locale with timezone context. occurred_on remains date-only; do not shift
it across timezones. On small screens use one column, with title and status first.
Owner actions will require server authorization when write APIs exist. Contact
and recovery actions need agreed backend capabilities before enabling real flows.

## Backend mapping to agree on

| UI concept | Proposed backend field |
| --- | --- |
| Lost or found | report_type: lost / found |
| Recovery badge | status: open / recovered |
| Heading and body | title / description |
| Category/location labels | catalog lookup for category_id / location_id |
| Incident date | occurred_on: YYYY-MM-DD, Asia/Seoul |
| Publication timestamps | created_at / updated_at: ISO 8601 |

Current fixtures use kind and occurredAt plus string catalog labels. Keep them
as fixtures until the backend list/detail contract is agreed; do not silently
rename their fields and claim API compatibility. Email contact on existing demo
items is not the planned public response model. Next step: agree on response
fields, empty/error states and pagination with the backend contributor.
