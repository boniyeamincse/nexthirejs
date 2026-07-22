# Password Security Architecture

## Hashing Algorithm
- Argon2id with default parameters (memory=4096KB, time=3, parallelism=1)
- No custom salt (argon2 generates salt automatically)

## Password Policy
- Minimum length: 10 characters
- Maximum length: 128 characters
- Uppercase letter: required
- Lowercase letter: required
- Digit: required
- Special character: required
- Whitespace: not trimmed
- Current password reuse: blocked

## Change Password Flow
1. User submits current password + new password + confirmation
2. Current password verified against stored Argon2id hash
3. New password validated against shared policy
4. New password must differ from current password
5. Password is hashed with Argon2id
6. Transactionally:
   a. Password hash updated in database
   b. passwordChangedAt timestamp set
   c. All other active sessions revoked with reason 'PASSWORD_CHANGED'
7. Current session remains active
8. Audit events recorded: auth.password_change.succeeded/failed

## Password Reset Flow
1. User requests reset via email
2. 32-byte random token generated, SHA-256 hashed in DB
3. Email sent with token (1-hour expiry)
4. On reset: password hash updated, passwordChangedAt set, all sessions revoked

## Rate Limiting
- Change password: 5 attempts per 15 minutes per user
- Login: 5 attempts per minute per IP
- Password reset request: not rate limited per user (rate limited per IP via global throttler)

## Security Controls
- Passwords never appear in logs, audit metadata, or API responses
- Audit metadata redacts sensitive keys including password, token, hash
- Wrong current password returns generic error (no indication of which field is wrong)
- All other sessions revoked on password change/reset
