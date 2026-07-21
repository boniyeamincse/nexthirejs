# Web Session Security

## Cookie Configuration

| Property | Development        | Production         |
| -------- | ------------------ | ------------------ |
| Name     | `nexthire_refresh` | `nexthire_refresh` |
| HttpOnly | true               | true               |
| Secure   | false              | true               |
| SameSite | Lax                | Lax                |
| Path     | `/api/v1/auth`     | `/api/v1/auth`     |
| Max-Age  | 30 days            | 30 days            |

- `HttpOnly=true` prevents JavaScript access to the refresh token.
- `Secure=true` in production ensures the cookie is only sent over HTTPS.
- `SameSite=Lax` prevents CSRF for same-site requests. In local development, web and API run on the same domain (localhost), so this is sufficient.
- Path is scoped to `/api/v1/auth` to limit cookie exposure.

## Deployment Assumptions

- Web and API are served from the same origin in local development (`localhost:3000` and `localhost:3001` are different ports but same origin for SameSite purposes).
- In production, if web and API are cross-site (`app.example.com` vs `api.example.com`), `SameSite=None; Secure` is required, along with CSRF token protection.
- Currently no CSRF token implementation is needed because the local development model is same-site.

## CORS Configuration

- `API_CORS_ORIGINS` env var defines the explicit allowlist.
- `credentials: true` enables cookie sharing with approved origins.
- In development, set `API_CORS_ORIGINS=http://localhost:3000`.

## Access Token Storage

- Access tokens are stored in memory (React state) via the `AuthContext`.
- Session storage is used only for tab-reload recovery (non-persistent).
- **Access tokens are never stored in localStorage.**
- **Refresh tokens are never accessible to JavaScript.**

## Browser Storage Review

| Storage              | Access Token       | Refresh Token       |
| -------------------- | ------------------ | ------------------- |
| Memory (React state) | ✅ Short-lived     | ❌ Not stored       |
| sessionStorage       | ✅ Tab-reload only | ❌ Not stored       |
| localStorage         | ❌ Never used      | ❌ Never used       |
| HttpOnly cookie      | ❌ Not used        | ✅ Secure storage   |
| JavaScript           | ✅ Bearer header   | ❌ Never accessible |

## Threat Mitigations

| Threat                   | Mitigation                                                    |
| ------------------------ | ------------------------------------------------------------- |
| XSS token theft          | Access token in memory only; refresh token inaccessible to JS |
| CSRF state change        | `SameSite=Lax` + JSON content-type check                      |
| Refresh token replay     | Rotation with atomic hash replacement                         |
| Concurrent rotation race | Optimistic locking via `updateMany` with old hash check       |
| Stolen refresh cookie    | `Secure` flag in production; short rotation window            |
