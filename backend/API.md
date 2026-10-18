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
starting with the first request. Successful logins, incorrect passwords and
invalid credential input all count toward the limit. The eleventh request returns
**429** with a `Retry-After` header indicating how many seconds to wait, before
querying the account or deriving the password hash. Blocked requests do not extend
the window. This limiter does not apply to other endpoints.

Counters are held in one process's memory and reset on restart. Clients sharing
an IP share the quota. The map holds at most 10,000 active IPs to bound memory use;
when full, new IPs receive 429 with a 60-second retry interval. The limiter uses
the direct connection address, not `X-Forwarded-For`. Deploying behind a proxy or
across multiple servers requires revisiting IP identification and shared counter
storage. This is not complete protection against distributed brute-force attacks.

This is a local development baseline. Email verification, password reset and
frontend integration are not implemented. Report and chat APIs are not included.
