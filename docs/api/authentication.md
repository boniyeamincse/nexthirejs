# API Authentication

## Endpoints

### POST /api/v1/auth/login

Authenticate with email and password.

**Access:** Public

**Request:**

```json
{
  "email": "candidate@example.com",
  "password": "StrongPass#2026"
}
```

**Success (200):**

```json
{
  "accessToken": "<short-lived-jwt>",
  "accessTokenExpiresAt": "2026-07-21T11:15:00.000Z",
  "user": {
    "id": "uuid",
    "email": "candidate@example.com",
    "status": "ACTIVE",
    "roleCodes": ["candidate"]
  }
}
```

Also sets the refresh token cookie (`nexthire_refresh`).

**Errors:**

- `400` — `AUTH_LOGIN_VALIDATION_FAILED`
- `401` — `AUTH_INVALID_CREDENTIALS`
- `403` — `AUTH_EMAIL_NOT_VERIFIED`
- `403` — `AUTH_ACCOUNT_UNAVAILABLE`
- `429` — Too many attempts

---

### POST /api/v1/auth/refresh

Obtain a new access token using the refresh cookie.

**Access:** Public (authenticated by refresh cookie)

**Request:** No body required.

**Success (200):**

```json
{
  "accessToken": "<new-short-lived-jwt>",
  "accessTokenExpiresAt": "2026-07-21T11:30:00.000Z"
}
```

A new refresh cookie replaces the old one.

**Errors:**

- `401` — `AUTH_REFRESH_TOKEN_MISSING`
- `401` — `AUTH_REFRESH_TOKEN_INVALID`
- `401` — `AUTH_SESSION_EXPIRED`
- `401` — `AUTH_SESSION_REVOKED`
- `401` — `AUTH_REFRESH_TOKEN_REUSED`
- `429` — Too many attempts

On error, the refresh cookie is cleared.

---

### GET /api/v1/auth/me

Get the current authenticated user.

**Access:** Protected (Bearer token required)

**Headers:** `Authorization: Bearer <access-token>`

**Success (200):**

```json
{
  "id": "uuid",
  "email": "candidate@example.com",
  "status": "ACTIVE",
  "roleCodes": ["candidate"]
}
```

**Errors:**

- `401` — `AUTH_ACCESS_TOKEN_MISSING`
- `401` — `AUTH_ACCESS_TOKEN_INVALID`
- `401` — `AUTH_SESSION_REVOKED`

---

### POST /api/v1/auth/logout

Log out from the current device.

**Access:** Protected (Bearer token required)

**Headers:** `Authorization: Bearer <access-token>`

**Success (204):** No content. The refresh cookie is cleared.

**Errors:**

- `401` — Access token missing, invalid, or session not found

Idempotent: calling logout on an already-revoked session also returns 204.

---

## Guard Behavior

The `AuthGuard` is registered globally:

1. Routes with `@Public()` bypass authentication.
2. All other routes require a valid Bearer access token.
3. The token must have valid signature, issuer, audience, and expiry.
4. The session must be `ACTIVE` (except for logout, which uses `@AllowRevokedSession()`).
5. The guard attaches `AuthenticatedPrincipal` to the request.

## Error Response Format

```json
{
  "message": "AUTH_ERROR_CODE",
  "error": "Error Type",
  "statusCode": 401
}
```

Error codes use the `AUTH_` prefix and never expose internal details, token values, or hashes.
