# Public Profile Rendering — Security Architecture

## Access Modes

- **OWNER**: Authenticated candidate viewing own preview
- **LINK_HOLDER**: External access via valid share token
- **PLATFORM_AUTHENTICATED**: External access via approved public identifier

## Data Filtering Rules

1. Hidden sections are removed at the API layer, not the frontend
2. Sensitive fields (email, phone, dateOfBirth, userId, session data) never leave the backend
3. Completion score is owner-only
4. Hidden-section indicators appear only in owner preview
5. Public routes return safe 404 for any unauthorized access

## Share Token Security

- Tokens are 32 cryptographically random bytes, SHA-256 hashed
- Only the hash is stored in the database
- Rotation generates a new token; old hash is replaced atomically
- Disabling a share link sets enabled=false; does not reveal profile existence
- Raw tokens never appear in logs, audit metadata, or database plaintext

## Audit Metadata

Audit events for external profile views use safe metadata only:

- `accessMode` (LINK_HOLDER or PLATFORM_AUTHENTICATED)
- `visibleSectionCount`
- No raw tokens, hashes, profile content, or email addresses

## Caching Strategy

- Owner preview: no-store or private cache
- Link-only pages: noindex, no-store
- Discoverable pages: noindex (SEO deferred to later task)
- Share tokens never cached publicly
