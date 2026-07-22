# Assessment Certificates API

## Authentication
All certificate endpoints (except public verification) require `candidate` role.

## Rate Limits
- Certificate list/detail: 60/minute/candidate
- Certificate download: 10/hour/certificate
- Certificate retry: 3/day/certificate
- Public verification: 30/minute/IP

## GET /v1/candidates/me/certificates
List certificates for the authenticated candidate.

Query params: `page`, `pageSize`, `status`

Response:
```json
{
  "items": [{
    "id": "uuid",
    "certificateNumber": "CERT-20260722-ABCD1234",
    "assessmentTitle": "Assessment Name",
    "scorePercentage": 85,
    "status": "READY",
    "issuedAt": "2026-07-22T00:00:00.000Z",
    "expiresAt": "2027-07-22T00:00:00.000Z",
    "downloadAvailable": true
  }],
  "pagination": { "page": 1, "pageSize": 25, "totalItems": 1, "totalPages": 1 }
}
```

## GET /v1/candidates/me/certificates/:id
Certificate detail.

## POST /v1/candidates/me/certificates/:id/download
Returns a short-lived download URL.
```json
{ "downloadUrl": "...", "expiresInSeconds": 300 }
```

## POST /v1/candidates/me/certificates/:id/retry
Resets FAILED certificate to PENDING and queues regeneration.

## GET /v1/public/certificates/verify/:code
Public verification endpoint. No authentication required.
```json
{
  "valid": true,
  "status": "VALID",
  "certificateNumber": "CERT-...",
  "holderName": "John Doe",
  "assessmentTitle": "Assessment Name",
  "scorePercentage": 85,
  "issuedAt": "2026-07-22T00:00:00.000Z",
  "expiresAt": "2027-07-22T00:00:00.000Z"
}
```
