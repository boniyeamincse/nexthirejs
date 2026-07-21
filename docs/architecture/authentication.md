# Authentication Architecture

## Overview

The NextHire authentication system uses a dual-token session model:

- **Access token**: short-lived JWT (15 min), stored in memory by the web client
- **Refresh token**: long-lived random token (30 days), stored in HttpOnly cookie

## Session Model

The `UserSession` table in PostgreSQL is the source of truth for all sessions:

- One session per browser/device login
- Sessions have status: `ACTIVE`, `REVOKED`, `EXPIRED`, `COMPROMISED`
- Refresh tokens are SHA-256 hashed before storage; raw tokens are never stored
- Token rotation uses `tokenFamilyId` for grouping related tokens
- Replay detection: a rotated token cannot be reused; concurrent rotation conflicts mark the session as `COMPROMISED`

## Auth Flow

```text
1. Login: email + password → access token + refresh cookie
2. Refresh: refresh cookie → rotated token pair (atomic)
3. Current user: access token → user profile
4. Logout: access token → session revoked + cookie cleared
```

## Token Design

### Access Token (JWT)

- Algorithm: HS256
- Lifetime: 15 minutes (configurable via `AUTH_ACCESS_TOKEN_TTL_MINUTES`)
- Claims: `sub` (userId), `sid` (sessionId), `roles`, `type: 'access'`, `iat`, `exp`, `iss`, `aud`
- Never includes: password hashes, private profile data, internal role IDs

### Refresh Token

- Raw: 32 cryptographically random bytes, base64url-encoded
- Stored: SHA-256 hash
- Rotation: Every successful refresh atomically replaces the hash
- Replay: An old (rotated) token hash is no longer in the DB → rejected
- Concurrent rotation conflict → session marked `COMPROMISED`

## Cookie Configuration

| Property | Development        | Production         |
| -------- | ------------------ | ------------------ |
| Name     | `nexthire_refresh` | `nexthire_refresh` |
| HttpOnly | true               | true               |
| Secure   | false              | true               |
| SameSite | Lax                | Lax                |
| Path     | `/api/v1/auth`     | `/api/v1/auth`     |
| Max-Age  | 30 days            | 30 days            |

The cookie is set only on login and refresh. It is cleared on logout or on any refresh error.

## CORS

- Explicit origin allowlist via `API_CORS_ORIGINS`
- Credentials enabled for cookie-based auth
- Local development: web and API are same-site on localhost ports
- Production: must preserve same-site behavior or add CSRF protection

## Rate Limiting

- Login: 5 attempts per IP per minute (`@Throttle`)
- Refresh: 30 attempts per IP per minute (`@Throttle`)

## Audit Events

| Event                       | When                                                 |
| --------------------------- | ---------------------------------------------------- |
| `auth.login.succeeded`      | Successful login                                     |
| `auth.login.failed`         | Failed login (wrong password, unverified, suspended) |
| `auth.session.refreshed`    | Successful token refresh                             |
| `auth.refresh_token.reused` | Concurrent rotation conflict (potential replay)      |
| `auth.logout.completed`     | Successful logout                                    |

Audit metadata excludes all credentials, tokens, and hashes.

## Guard

The `AuthGuard` (registered as `APP_GUARD`):

1. Checks `@Public()` decorator — bypasses auth
2. Extracts Bearer token from Authorization header
3. Verifies JWT signature, issuer, audience, expiry, and claims
4. Validates session status (except for routes with `@AllowRevokedSession()`)
5. Attaches `AuthenticatedPrincipal` to request context

## Frontend Auth Client

- Access token stored in memory (React state)
- Session storage used only for tab-reload recovery
- On page load, the auth provider calls `POST /api/v1/auth/refresh` (with cookie) to bootstrap
- Protected routes redirect to `/login` when unauthenticated
- Logout clears local state and calls `POST /api/v1/auth/logout`

## Environment Variables

| Variable                        | Default               | Description                 |
| ------------------------------- | --------------------- | --------------------------- |
| `AUTH_ACCESS_TOKEN_SECRET`      | (required)            | HMAC secret for JWT signing |
| `AUTH_ACCESS_TOKEN_TTL_MINUTES` | 15                    | Access token lifetime       |
| `AUTH_REFRESH_TOKEN_TTL_DAYS`   | 30                    | Refresh token lifetime      |
| `AUTH_JWT_ISSUER`               | nexthire              | JWT issuer claim            |
| `AUTH_JWT_AUDIENCE`             | nexthire-api          | JWT audience claim          |
| `AUTH_REFRESH_COOKIE_NAME`      | nexthire_refresh      | Refresh cookie name         |
| `WEB_APP_URL`                   | http://localhost:3000 | Frontend URL for CORS       |

## Deferred Work

- Session listing UI (NH-P1-T004)
- Logout all devices (NH-P1-T004)
- Remote session revocation
- Password reset
- MFA
- Social login
- OAuth provider integrations
