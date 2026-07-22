# Account Lifecycle (NH-P1-T017)

## Data Export

### Request Data Export

```
POST /api/v1/candidates/me/data-exports
```

Auth: Bearer token (candidate role)

Response 202:

```json
{
  "id": "uuid",
  "status": "PENDING",
  "requestedAt": "2026-07-21T10:00:00.000Z"
}
```

Rate limit: 3 requests per 30 days, max 1 active PENDING/PROCESSING request.

### List Own Exports

```
GET /api/v1/candidates/me/data-exports
```

Auth: Bearer token (candidate role)

Returns array of export status objects, newest first.

### Get Export Status

```
GET /api/v1/candidates/me/data-exports/:exportId
```

Auth: Bearer token (candidate role)

Returns single export status.

### Download Export

```
POST /api/v1/candidates/me/data-exports/:exportId/download
```

Auth: Bearer token (candidate role)

Response 200:

```json
{
  "downloadUrl": "<short-lived-url>",
  "expiresInSeconds": 300
}
```

Rate limit: 10 requests per hour per export.

### Export Statuses

- `PENDING` — requested, waiting for worker
- `PROCESSING` — worker is generating archive
- `READY` — archive available for download (7-day expiry)
- `FAILED` — generation failed
- `EXPIRED` — archive past retention window
- `CANCELLED` — cancelled

## Account Deactivation

### Deactivate Account

```
POST /api/v1/candidates/me/deactivate
```

Auth: Bearer token (candidate role)

Request:

```json
{
  "currentPassword": "CurrentPass#2026",
  "confirmation": "DEACTIVATE"
}
```

Response 200:

```json
{
  "deactivated": true,
  "sessionsRevoked": 2
}
```

Rate limit: 5 attempts per 15 minutes.

### Effects

- Account status set to `DELETED`
- All sessions revoked
- Share token disabled
- Public profile disabled
- Login/refresh fail after deactivation
- Profile data is retained in database (not permanently deleted)
