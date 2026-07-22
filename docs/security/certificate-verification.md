# Certificate Verification Security

## Design
- Public verification endpoint accepts a high-entropy verification code
- Code is stored as SHA-256 hash only
- Raw code is never logged, stored, or returned

## Anti-Enumeration
- Rate limited: 30/minute/IP
- All invalid codes return identical NOT_FOUND response
- No timing differences between valid/invalid codes

## Public Response (Limited)
Public verification exposes only:
- Certificate validity status
- Holder name
- Assessment title
- Score percentage
- Certificate number
- Issue and expiry dates

Never exposed: candidate ID, email, phone, attempt ID, storage key, checksum, signed URL

## Download Security
- Ownership check before signed URL generation
- 5-minute signed URL expiry
- No signed URL persistence
- Private/no-store cache headers
