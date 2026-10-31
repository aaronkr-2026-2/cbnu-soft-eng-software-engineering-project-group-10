# Account API — Step 1

Base URL: `http://127.0.0.1:3001`. Send JSON with `Content-Type: application/json`.

## Sign up: POST /auth/register

```json
{
  "email": "student@example.com",
  "password": "ExamplePassword123!",
  "full_name": "Alex Smith",
  "student_number": "20260001"
}
```

Returns 201 with id, email, full_name and student_number. Passwords must contain
12–128 characters. Duplicate emails or student numbers return 409; invalid input
returns 400. Registration does not sign the user in automatically; call login next.

Signup creates the user and student in one transaction. Concurrent requests with
the same email or student number result in one 201 and one 409. Email matching
ignores case and surrounding whitespace. The rejected request leaves no partial
user or student record; correcting the conflicting value allows a retry.
Integration tests cover both concurrent conflict cases and successful retries.

## Log in: POST /auth/login

```json
{
  "email": "student@example.com",
  "password": "ExamplePassword123!"
}
```

Returns 200 with `access_token`, `token_type: Bearer` and `expires_in: 86400`.
Incorrect credentials return 401.

## Check the current session: GET /auth/me

Header: `Authorization: Bearer <access_token>`.
Returns the current account and student information without password_hash.
Missing, expired or revoked tokens return 401.

## Log out: POST /auth/logout

Send the same Authorization header. No request body is required.
Returns `{"success":true}` and revokes that session. Other sessions remain valid.

## Login request limit

`POST /auth/login` accepts up to **10 requests per IP in a 60-second window**,
starting with the first request. Registration has a separate 30/IP/minute limit. Successful logins, incorrect passwords and
invalid credential input all count toward the limit. The eleventh request returns
**429** with a `Retry-After` header indicating how many seconds to wait, before
querying the account or deriving the password hash. Blocked requests do not extend
the window. Authenticated report/image/chat writes also have a separate 60/user/minute limit.

Counters are held in one process's memory and reset on restart. Clients sharing
an IP share the quota. The map holds at most 10,000 active IPs to bound memory use;
when full, new IPs receive 429 with a 60-second retry interval. The limiter uses Express request.ip: direct peer by default, or forwarded client IP only behind explicitly configured TRUST_PROXY addresses. Deploying behind a proxy or
across multiple servers requires revisiting IP identification and shared counter
storage. This is not complete protection against distributed brute-force attacks.

This is a local development baseline. Email/student-status verification and
password reset remain outside scope. Reports and chat are documented in REPORTS_API.md and CHAT_API.md.

## Session policy and errors

Login returns an opaque Bearer token, not a JWT. Each login creates a separate
session lasting 24 hours. Requests do not extend it; there is no refresh token.
A page reload does not revoke the server session, but the client must still
possess the token to call /auth/me. For initial integration, keep tokens in
memory; a full reload then requires login again. Persistent login and HttpOnly
cookies are future decisions. The localStorage demo profile is not authentication.
Never put tokens in URLs or logs.

Logout revokes only the supplied session; other sessions remain valid. Missing,
malformed, unknown, expired and revoked tokens return 401. Repeated logout also
returns 401. On 401, clear client authentication state and request login again.
Expired rows can remain in the database but cannot authorize requests.

Errors contain statusCode and message, plus error for standard HTTP exceptions.
Handle the status code rather than matching message text:

| Status | Meaning | Client action |
| --- | --- | --- |
| 400 | Invalid input | Correct form data |
| 401 | Invalid credentials or session | Show login error or sign in again |
| 409 | Duplicate email/student number | Correct conflicting data |
| 429 | Login attempt limit | Wait for Retry-After seconds |
| 500 | Unexpected failure | Show a generic retry message |

Unknown accounts and wrong passwords return the same Invalid email or password
message for otherwise valid input. Unexpected errors return Internal server error
without SQL, passwords or stack traces in the HTTP response. Server diagnostics
are private and must not be published. Network/CORS failures can have no readable
HTTP response; display a connection error in that case.

## Reports and chat API

See [REPORTS_API.md](REPORTS_API.md) for implemented reports/images and
[CHAT_API.md](CHAT_API.md) for conversations/messages/SSE. See DEPLOYMENT.md for
free demo hosting and limits. Never load-test a shared or free hosted service.
