# Database

PostgreSQL 17, application configured by DATABASE_URL. Existing account data is
preserved; migrations are forward-only additions. Run npm run db:migrate before
starting the API. The migration runner serializes runs, applies each batch in a
transaction and checks checksums. LF/CRLF-only variants are accepted for existing
checksums; SQL changes to an applied migration are still rejected.

| Migration | Tables/indexes |
| --- | --- |
| 001_auth.sql | users, students, auth_sessions |
| 002_reports.sql | categories, locations, reports and list/FK indexes; catalog seeds |
| 003_images.sql | report_images: metadata and bounded bytea content |
| 004_chat.sql | conversations, conversation_members, messages and history indexes |
| 005_report_search.sql | partial GIN full-text index for non-deleted reports |

Signup inserts users/students atomically. Email uniqueness ignores case and
surrounding whitespace. Student numbers are unique but self-reported, not verified.
Session tokens are stored only as SHA-256 hashes and expire after 24 hours.

Reports reference their author and catalogs with restrictive foreign keys. Active
catalogs are available for new choices; historical reports retain inactive labels.
Soft deletion hides public reports and atomically deletes their images. Conversation
history remains available only to its members; deleted-report rooms are read-only.
Recovery status and recovered_at have a database consistency constraint.

Images are fully decoded, stripped of metadata and normalized to WebP by sharp.
Their data and metadata share one row, so upload/delete failures roll back together.
No external filesystem/object-store orphan cleanup is needed. The three-image cap
is enforced while holding the report row lock. At most 1 MiB per stored image;
large deployments should migrate blobs to object storage with a durable cleanup job.

Each conversation has one requester and the report owner, inserted atomically.
UNIQUE(report_id,requester_id) prevents duplicate rooms. Messages reference their
membership and have UNIQUE(conversation_id,sender_id,client_message_id). Report
and room locks serialize sends against deletion and preserve message commit order.

Application/test databases remain separate. Seeds only accept names ending in
_test. The old .local/previous-scope backups are unchanged. Back up the entire
application DB (including images), test restore on a separate DB, and do not edit
old migrations. See DEPLOYMENT.md for operations and REPORTS_SCHEMA.md for the
original design history (the migration files now define the implemented schema).
