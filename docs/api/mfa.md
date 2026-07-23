# MFA API

Base prefix `/api/v1`. All endpoints are under `auth/mfa` except the login integration.
Authenticated endpoints require a Bearer access token. See `docs/security/mfa.md` for the
security model.

## Login integration

`POST /auth/login` — unchanged request. Response is now a union:

- No MFA: `{ accessToken, accessTokenExpiresAt, user }` (+ refresh cookie), as before.
- MFA enabled: `200 { mfaRequired: true, challengeToken, expiresAt, allowedMethods }` —
  no tokens or cookies issued. `allowedMethods` is `["TOTP"]` or `["TOTP","RECOVERY_CODE"]`.
- MFA enabled + valid `nexthire_mfa_trust` cookie: normal login response (challenge skipped).

`POST /auth/mfa/challenge/verify` (public, 30/min)

Request: `{ challengeToken, method: "TOTP" | "RECOVERY_CODE", code, trustDevice?, deviceName? }`

- `200` — login completed: `{ accessToken, accessTokenExpiresAt, user }`, sets refresh
  cookie; with `trustDevice: true` also sets the `nexthire_mfa_trust` cookie (30 days).
- `401` — `MFA_CHALLENGE_INVALID | MFA_CHALLENGE_EXPIRED | MFA_CHALLENGE_CONSUMED |
MFA_CHALLENGE_ATTEMPTS_EXCEEDED | MFA_CODE_INVALID | MFA_RECOVERY_CODE_INVALID`.

## Settings endpoints (authenticated)

| Method | Path                                  | Purpose                                                                                        | Notes                                   |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| GET    | `/auth/mfa/status`                    | `MfaSecurityStatus` incl. `requiredByPolicy`, `recoveryCodesRemaining`, `currentDeviceTrusted` | 60/min                                  |
| POST   | `/auth/mfa/enrollment`                | Begin setup; body `{ currentPassword }` → `{ qrDataUrl, manualSecret, enrollmentExpiresAt }`   | 401 wrong password, 409 already enabled |
| POST   | `/auth/mfa/enrollment/confirm`        | Body `{ code }` → `{ recoveryCodes[10], enabledAt }` (codes shown once)                        | 400 not started/expired, 401 bad code   |
| POST   | `/auth/mfa/disable`                   | Body `{ currentPassword, code }` (TOTP or recovery code) → 204                                 | Clears trust cookie                     |
| POST   | `/auth/mfa/recovery-codes/regenerate` | Body `{ code }` (TOTP) → `{ recoveryCodes[10], generatedAt }`                                  | Invalidates old set                     |
| GET    | `/auth/mfa/trusted-devices`           | `{ devices: MfaTrustedDeviceSummary[] }`                                                       | Active only                             |
| DELETE | `/auth/mfa/trusted-devices/:deviceId` | Revoke one (owner only) → 204                                                                  | 404 if not owned                        |
| DELETE | `/auth/mfa/trusted-devices`           | Revoke all → 204                                                                               | Clears trust cookie                     |

Validation: shared Zod schemas in `@nexthire/validation` (`beginMfaEnrollmentSchema`,
`confirmMfaEnrollmentSchema`, `disableMfaSchema`, `regenerateMfaRecoveryCodesSchema`,
`verifyMfaChallengeSchema`); error codes in `@nexthire/constants` `MFA_ERROR_CODES`.

## Policy enforcement

Endpoints guarded by `MfaRequiredGuard` return `403 MFA_REQUIRED_BY_POLICY` for users whose
roles are in `MFA_REQUIRED_ROLE_CODES` until they enable MFA. Currently guarded:
`/v1/manage/experts/*` (expert application review).
