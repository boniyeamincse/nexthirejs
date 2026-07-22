# Phase 1 Security Invariants

## Authentication

1. **Access tokens** — HS256 JWT, 15-min TTL, claims: `sub` (userId), `sid` (sessionId), `roles`. Verified on every protected request.
2. **Refresh tokens** — 32-byte random, SHA-256 hashed in DB, single-use with atomic rotation. Replay detection sets session COMPROMISED.
3. **Cookies** — HttpOnly, Secure (prod), SameSite=Lax, path-scoped. Access token in-memory + sessionStorage (not localStorage).
4. **Password hashing** — Argon2id (configurable via env).
5. **Rate limiting** — 100/min global, tighter on auth (login 5/min, change-password 5/15min, deactivate 5/15min, data-export 3/30d, download 10/h).

## Authorization and Ownership

1. **AuthGuard** — Global guard; checks JWT validity, session ACTIVE status, account ACTIVE status. Public routes use `@Public()`.
2. **RolesGuard** — Applied to candidate endpoints via `@RequireRoles('candidate')`.
3. **Ownership** — All self-service queries scoped by `userId` from the authenticated principal. Client payloads never control user IDs.
4. **Account status filter** — DELETED/SUSPENDED accounts cannot login, refresh, or access protected APIs.

## Session Invariants

1. **Password reset** — revokes ALL sessions.
2. **Password change** — revokes ALL OTHER sessions; preserves current session with new token.
3. **Deactivation** — revokes EVERY session, disables share token.
4. **Logout** — revokes current session only.
5. **Logout all** — revokes all sessions for the user.
6. **Revoked sessions** — cannot refresh or access protected APIs.

## Privacy and Data Exposure

1. **Public profiles** — exclude email, DOB, completion score, sessions, auth metadata.
2. **Hidden sections** — omitted from public/link-only JSON based on `CandidateSectionVisibility`.
3. **Discoverability** — PRIVATE profiles return 404 externally; LINK_ONLY requires valid token.
4. **Share tokens** — 32-byte random hex, SHA-256 hashed in DB, delivered via query param (not path).
5. **Data export** — contains only safe candidate data; excludes password hashes, token hashes, audit logs, IPs, session IDs.

## Logging and Audit

1. **Sensitive data** — raw passwords, tokens, hashes, cookies, signed URLs, auth headers never appear in logs.
2. **Audit events** — metadata auto-stripped of sensitive keys; sanitized by `AuditService`.
3. **Audit coverage** — registration, login, email verification, password reset/change, profile CRUD, privacy changes, deactivation, data export.

## CORS and Transport

1. **CORS** — explicit allowlist via `API_CORS_ORIGINS`, credentials enabled, preflight handled.
2. **CSRF** — no CSRF token required (SameSite=Lax + credentialed origin check covers browser-based requests).
3. **All production traffic** must use HTTPS.

## Storage and Export

1. **Export files** — stored in private bucket/container with non-guessable keys.
2. **Download URLs** — short-lived (5 minutes), generated on-demand, never stored or logged.
3. **Expired exports** — return HTTP 410 Gone.
4. **Worker** — no temporary files left behind; idempotent job processing.
