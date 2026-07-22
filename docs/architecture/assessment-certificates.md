# Assessment Certificates

## Overview
Passed eligible certification attempts produce exactly one secure verifiable PDF certificate.

## Certificate Lifecycle
```
PENDING -> GENERATING -> READY
GENERATING -> FAILED
FAILED -> PENDING
READY -> REVOKED
READY -> EXPIRED
```

## Certificate Eligibility
1. Attempt is finalized and scored
2. Result is PASSED
3. Certificate policy is enabled (certificateEnabled)
4. Assessment type is CERTIFICATION
5. No existing certificate for the attempt
6. Valid holder name exists in CandidateProfile

## Holder Name Priority
1. CandidateProfile.fullName (required)
2. No email fallback

## PDF Content
- NextHire branding
- Certificate title
- Holder name
- Assessment title
- Score percentage
- Issue/expiry dates
- Certificate number
- Verification URL
- Disclaimer (no external accreditation)

## Worker (BullMQ)
- Queue: `assessment-certificates`
- Job: `assessment.generate_certificate`
- Worker atomically transitions PENDING -> GENERATING -> READY
- PDF generated with pdfkit, uploaded to private storage
- SHA-256 checksum and file size recorded
- Bounded retries (3 attempts with exponential backoff)

## Storage
- MinIO/S3-compatible storage with local filesystem fallback
- Private bucket with non-guessable object keys
- Short-lived signed URLs for download (5 minutes)

## Security
- Verification code: 48-char hex, stored as SHA-256 hash
- Only hash hint stored (first 8 chars + "...")
- Ownership check enforced on all candidate endpoints
- Signed URLs never persisted or logged
- Private/no-store caching on certificate pages

## Endpoints
- `GET /v1/candidates/me/certificates` - List my certificates
- `GET /v1/candidates/me/certificates/:id` - Certificate detail
- `POST /v1/candidates/me/certificates/:id/download` - Get download URL
- `POST /v1/candidates/me/certificates/:id/retry` - Retry failed generation
- `GET /v1/public/certificates/verify/:code` - Public verification

## Error Codes
- 400 CERTIFICATE_GENERATION_NOT_RETRYABLE
- 403 CERTIFICATE_ACCESS_DENIED
- 404 CERTIFICATE_NOT_FOUND
- 409 CERTIFICATE_NOT_READY
- 410 CERTIFICATE_EXPIRED / REVOKED
