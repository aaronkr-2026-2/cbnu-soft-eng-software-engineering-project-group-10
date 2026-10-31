# Private conversations and realtime

Implemented October 30, 2026. Every endpoint requires Authorization: Bearer <token>.
Non-members receive 404 for room-specific operations, hiding room existence.
The report owner and requesting user are the only members. No groups, attachments,
read receipts, typing indicators, notifications or membership-management API.

## REST

POST /conversations with {"report_id":"UUID"} -> 201 {id,report_id,created_at}.
Starts or returns the same room for that requester/report. Creation inserts both
members atomically. Owners cannot start a room with themselves (400). Missing or
deleted reports return 404. Concurrent retries do not create duplicate rooms.

GET /conversations?limit=20&cursor=... -> {items,next_cursor}. Returns only the
caller's rooms, newest creation first (created_at + ID). Each row includes id,
report_id, created_at, report_title, report_deleted. It is not sorted by last message.

GET /conversations/:id/messages?limit=20&cursor=... -> {items,next_cursor}.
Returns newest messages first; frontend may reverse items for display. Pagination
uses the same bounded 1–50 limit and opaque cursor rules as reports. Each message:
{id,conversation_id,sender_id,client_message_id,body,created_at}. No email or student
number is exposed. sender_id identifies the speaker relative to /auth/me.id.

POST /conversations/:id/messages with:

```json
{"client_message_id":"00000000-0000-4000-8000-000000000001","body":"Is this item still available?"}
```

Returns 201 with the saved message. body is trimmed and 1–2000 characters. Generate
one UUID per composed message and REUSE it when retrying a failed send. Same room,
sender, key and body returns the original row (also 201); changed body with the
same key returns 409. Sender comes from the session, never client input.

After report soft deletion, history remains private/readable, but new messages
return 409. Retrying an already saved identical message still returns that row.
All writes share the 60/user/minute process-local limit with reports/images.

## SSE refresh transport

GET /conversations/:id/events returns text/event-stream after session/membership
checks. Use fetch with an Authorization header and parse SSE frames from its body.
Native EventSource cannot set that header; do not put tokens in query strings.

Events:
- ready: {conversation_id}. Fetch latest REST history immediately.
- refresh: {conversation_id}. Fetch latest REST history and merge/deduplicate by ID.
- session-ended: {status:401|404}. Stream closes; clear auth on 401 and sign in again.
- unavailable: {retry:true}. Stream closes; reconnect with backoff.

The server polls PostgreSQL every two seconds for that room's newest message and
rechecks the session/membership on every tick. Heartbeat comments keep an idle
stream active. No global broadcasts, no message content in the event, and no
in-memory-only messages. Fetch REST on EVERY reconnect, even if Last-Event-ID was
sent: transport events are invalidations, not a durable replay log. Re-fetch pages
until the client reaches known message IDs to recover more than one page of missed
messages. Do not rely only on the first page after a long disconnect.

Close streams when leaving the room or hiding the UI. Maximum three streams per
user, 100 per process, also subject to the production entrypoint's 64 active
request limit. Slow clients are disconnected on backpressure. Token revocation or
expiry is detected on the next completed polling tick (normally within two seconds,
longer if the database is delayed). REST remains authoritative during outages.

This is a bounded demo realtime design, not a high-scale pub/sub system. On a free
sleeping host, handle cold starts and reconnects; long-lived polling also consumes
free database compute. Before scaling, replace per-connection polling with durable
notifications/pub-sub and distributed quotas, while retaining REST recovery.
