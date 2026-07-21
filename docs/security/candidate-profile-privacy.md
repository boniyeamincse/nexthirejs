# Candidate Profile Privacy

## Overview

Candidate profile privacy is managed through a dedicated `CandidateProfilePrivacy` model with a one-to-one relation to the `User` model. The privacy system provides:

1. **Overall Discoverability** — three-mode control over who can find the candidate
2. **Section Visibility** — per-section control over what external viewers can read
3. **Policy Versioning** — versioned defaults for safe future migrations
4. **Reusable Decision Service** — backend logic that future public/recruiter features must use

## Data Flow

```
Candidate (authenticated)
  → GET /candidates/me/privacy
  ← Defaults (no DB row) or Persisted settings

Candidate (authenticated)
  → PUT /candidates/me/privacy { overallDiscoverability, sections }
  ← Persisted settings (DB upsert)
```

## Access Control

- Only authenticated users with the `candidate` role can read/update their own privacy
- User ID is sourced from the authenticated principal, never from the request body
- `SUSPENDED` or `DELETED` accounts cannot read or update privacy
- Cross-user access is prevented by user ID ownership enforcement

## Privacy Decision Model

The `CandidatePrivacyDecisionService` provides queryable decision methods:

- `canPlatformDiscoverCandidate(settings)` — returns true if discoverability is `PLATFORM_DISCOVERABLE`
- `canShareByLink(settings)` — returns true if discoverability allows link-based sharing
- `canExternalViewerReadSection(settings, section, viewerContext)` — evaluates viewer-context rules

### Viewer Context Rules

| Context | PRIVATE | LINK_ONLY | PLATFORM_DISCOVERABLE |
|---------|---------|-----------|----------------------|
| OWNER | Allowed | Allowed | Allowed |
| INTERNAL_SYSTEM | Allowed | Allowed | Allowed |
| ANONYMOUS | Denied | Denied | Only PUBLIC sections |
| LINK_HOLDER | Denied | Allowed (future) | Allowed |
| PLATFORM_AUTHENTICATED | Denied | Denied | Allowed |

Section visibility further restricts access:
- `HIDDEN` denies all external viewer types
- `PLATFORM_ONLY` denies anonymous/public access
- `PUBLIC` allows anonymous access only when overall discoverability permits

## Audit Events

- `candidate.privacy.viewed` — recorded when settings are read (best-effort)
- `candidate.privacy.updated` — recorded after successful persistence

Safe metadata includes: `settingsSource`, `policyVersion`, `oldDiscoverability`, `newDiscoverability`, `changedSectionNames`, `changedSectionCount`.

No profile content, email, phone, URLs, or request bodies are included in audit metadata.

## Security Constraints

1. Backend is the source of truth for all privacy decisions
2. Frontend must not claim public or recruiter views are active
3. Privacy updates are idempotent
4. Profile data is never modified by privacy operations
5. Profile completion percentage is unchanged by privacy changes
6. Hidden sections still retain their data in the database
7. No internal IDs (row ID, user ID) are exposed in API responses
