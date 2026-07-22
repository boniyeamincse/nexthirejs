# Account Deactivation Security (NH-P1-T017)

## Flow

1. Candidate provides current password and types "DEACTIVATE" as confirmation
2. Password verified against stored Argon2id hash
3. Confirmation must be exact literal "DEACTIVATE"
4. Transactional update:
   a. User status set to `DELETED`
   b. `deactivatedAt` timestamp recorded
   c. `deactivationReason` set to `USER_REQUESTED`
   d. All active sessions revoked with reason `ACCOUNT_DEACTIVATED`
   e. Share token disabled (profile no longer discoverable or link-shareable)
5. Current session also revoked (user is logged out)
6. Audit event `candidate.account.deactivated` recorded

## Post-Deactivation

- Login returns 403 `AUTH_ACCOUNT_UNAVAILABLE`
- Refresh token flow returns 401
- All protected APIs return 403
- Public profile endpoints return 404
- Profile data is retained in database (not deleted)

## Rate Limiting

- 5 deactivation attempts per 15 minutes
- Prevents brute-force guessing of passwords

## Audit Metadata

- `sessionsRevokedCount` — number of sessions revoked
- No passwords, tokens, or hashes in metadata
- Audit service sanitizes metadata automatically
