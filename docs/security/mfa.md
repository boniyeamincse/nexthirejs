# Two-Factor Authentication (TOTP MFA)

Module: NH-M04. Backend `apps/api/src/modules/auth/mfa/`, frontend `MfaSettingsPanel` on `/settings/security` and the challenge step on `/login`.

## Design

- **Factor**: RFC 6238 TOTP (otplib v12) — SHA-1, 6 digits, 30-second period, ±1 window.
- **Secret storage**: TOTP secrets are encrypted at rest with AES-256-GCM
  (`MfaEncryptionService`), ciphertext format `base64(iv[12] || tag[16] || data)`, versioned
  (`secretEncryptionVersion`) for future key rotation. Key source `MFA_SECRET_ENCRYPTION_KEY`
  (32 bytes hex/base64); in development a key is derived from `AUTH_ACCESS_TOKEN_SECRET`
  with a startup warning. Plaintext secrets are returned to the owner exactly once during
  enrollment (QR + manual key) and never logged.
- **Enrollment**: begins with password re-authentication; a PENDING enrollment expires
  after 10 minutes. Confirmation requires a valid TOTP; on success the account flips to
  ENABLED and 10 recovery codes are generated.
- **Recovery codes**: 10 codes, 12 characters from an unambiguous A–Z/2–9 alphabet,
  generated with `crypto.randomInt`. Stored as SHA-256 hashes only (unique `codeHash`
  supports O(1) consumption via a single conditional `updateMany`). Single-use —
  consumption is atomic. Regeneration requires a valid TOTP and replaces the whole set.
  - Deviation note: NH-SEC-T001 originally proposed Argon2id for recovery codes. The
    schema's unique-hash lookup design requires a deterministic hash, so SHA-256 is used
    (codes have 31^12 ≈ 8×10^17 entropy; offline brute force is not a practical threat and
    online use is bounded by challenge attempt limits).
- **Login challenge**: when MFA is ENABLED, `POST /auth/login` validates credentials but
  returns `{ mfaRequired: true, challengeToken, expiresAt, allowedMethods }` instead of
  tokens; no session or cookie is issued. The 32-byte challenge token is stored as a
  SHA-256 hash, expires in 5 minutes, allows at most 5 failed attempts (then REVOKED),
  and is consumed atomically (`PENDING → CONSUMED` guarded update) so a token can never
  complete two logins.
- **Trusted devices**: opt-in at challenge verification. A 32-byte token (SHA-256 hashed
  in DB) is set as the `nexthire_mfa_trust` HttpOnly cookie scoped to `/api/v1/auth`,
  valid 30 days. Login with a valid trust token skips the challenge. Devices are listed
  and revocable individually or in bulk; revocation is ownership-checked (foreign device
  IDs return 404, verified by an IDOR E2E test). Only a short browser summary is stored,
  never the raw user agent.
- **Disable**: requires password re-authentication plus a valid TOTP or recovery code.
  Wipes the encrypted secret, deletes recovery codes, revokes trusted devices and pending
  challenges in one transaction.

## Mandatory MFA policy

`MfaPolicyService` + `MFA_REQUIRED_ROLE_CODES` (constants): `expert`,
`expert_application_reviewer`, `assessment_manager`, `company_owner`, `company_admin`,
`superadmin`. Candidates remain optional.

Enforcement:

- `GET /auth/mfa/status` returns `requiredByPolicy` so clients can prompt setup.
- `MfaRequiredGuard` rejects sensitive workflows with `403 MFA_REQUIRED_BY_POLICY` when a
  mandatory-role user has not enabled MFA. Currently applied to the expert application
  review controller; new sensitive admin/expert/company controllers must add the guard.

## Rate limits

| Endpoint                   | Limit                                                |
| -------------------------- | ---------------------------------------------------- |
| status                     | 60/min                                               |
| begin enrollment           | 5/15 min                                             |
| confirm enrollment         | 10/15 min                                            |
| disable                    | 5/15 min                                             |
| regenerate recovery codes  | 5/15 min                                             |
| challenge verify           | 30/min per IP (per-challenge cap: 5 failed attempts) |
| trusted device list/revoke | 30/min (revoke-all 10/min)                           |

## Audit events

`auth.mfa.enrollment.started/confirmed/failed`, `auth.mfa.disabled`,
`auth.mfa.disable.failed`, `auth.mfa.challenge.created/verified/failed`,
`auth.login.mfa_challenge_required`, `auth.mfa.recovery_codes.regenerated`,
`auth.mfa.trusted_device.trusted/revoked/revoked_all`. Metadata never contains secrets,
codes, tokens, or hashes.

## Privacy invariants

- No plaintext secret, recovery code, challenge token, or trust token is persisted or logged.
- Challenge verification failures return generic `MFA_CODE_INVALID` /
  `MFA_RECOVERY_CODE_INVALID` without revealing which factor exists.
- Frontend keeps recovery codes only in component state, shows them once, and never writes
  them to storage.
