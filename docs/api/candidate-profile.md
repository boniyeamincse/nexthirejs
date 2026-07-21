# Candidate Profile API

## Privacy Settings

### GET /api/v1/candidates/me/privacy

Returns the privacy settings for the authenticated candidate. If no settings have been saved, versioned defaults are returned with `source: "DEFAULT"`.

**Access:** Authenticated candidate only

**Success Response (200):**
```json
{
  "overallDiscoverability": "PRIVATE",
  "sections": {
    "BASIC_PROFILE": "PLATFORM_ONLY",
    "LOCATION_AND_PREFERENCES": "HIDDEN",
    "EDUCATION": "PLATFORM_ONLY",
    "WORK_EXPERIENCE": "PLATFORM_ONLY",
    "SKILLS_AND_LANGUAGES": "PLATFORM_ONLY",
    "CERTIFICATIONS_AND_TRAINING": "PLATFORM_ONLY",
    "ACHIEVEMENTS_AND_LINKS": "PLATFORM_ONLY"
  },
  "policyVersion": "candidate-privacy-v1",
  "source": "DEFAULT|PERSISTED",
  "createdAt": null,
  "updatedAt": null
}
```

### PUT /api/v1/candidates/me/privacy

Creates or updates privacy settings for the authenticated candidate.

**Access:** Authenticated candidate only

**Request Body:**
```json
{
  "overallDiscoverability": "LINK_ONLY",
  "sections": {
    "BASIC_PROFILE": "PUBLIC",
    "LOCATION_AND_PREFERENCES": "HIDDEN",
    "EDUCATION": "PLATFORM_ONLY",
    "WORK_EXPERIENCE": "PUBLIC",
    "SKILLS_AND_LANGUAGES": "PLATFORM_ONLY",
    "CERTIFICATIONS_AND_TRAINING": "HIDDEN",
    "ACHIEVEMENTS_AND_LINKS": "PLATFORM_ONLY"
  }
}
```

**Success Response (200):** Same structure as GET response with `source: "PERSISTED"`.

**Error Codes:**
- `400 CANDIDATE_PRIVACY_VALIDATION_FAILED` — invalid discoverability or visibility value
- `400 CANDIDATE_PRIVACY_SECTION_MISSING` — required section not provided
- `400 CANDIDATE_PRIVACY_SECTION_UNSUPPORTED` — unknown section key
- `401 AUTH_ACCESS_TOKEN_INVALID` — missing or invalid token
- `403 CANDIDATE_ROLE_REQUIRED` — user does not have candidate role
- `403 AUTH_ACCOUNT_UNAVAILABLE` — suspended or deleted account

### Discoverability Modes
- `PRIVATE` — visible only to candidate and authorized internal processes
- `LINK_ONLY` — future share-link access (not yet implemented)
- `PLATFORM_DISCOVERABLE` — future platform search (not yet implemented)

### Visibility Modes
- `HIDDEN` — only candidate and internal services
- `PLATFORM_ONLY` — future authenticated company/recruiter views
- `PUBLIC` — future anonymous/public views

### Supported Sections
- `BASIC_PROFILE`
- `LOCATION_AND_PREFERENCES`
- `EDUCATION`
- `WORK_EXPERIENCE`
- `SKILLS_AND_LANGUAGES`
- `CERTIFICATIONS_AND_TRAINING`
- `ACHIEVEMENTS_AND_LINKS`

## 4. Candidate Public Profile Preview

### 4.1 Owner Preview

```
GET /api/v1/candidates/me/profile-preview
```

Authenticated candidate only. Returns full profile with privacy summary and completion.

Response: `200 OK` with `OwnerProfilePreview` shape.

### 4.2 Public Discoverable Profile

```
GET /api/v1/public/candidates/:publicId
```

Public. Returns platform-discoverable profile or 404.

### 4.3 Link-Only Profile

```
GET /api/v1/public/candidate-profile?token=<raw-token>
```

Public. Returns profile accessible via share link or 404.

### 4.4 Share Link Management

```
POST /api/v1/candidates/me/profile-share-link/rotate
PUT /api/v1/candidates/me/profile-share-link
GET /api/v1/candidates/me/profile-share-link/status
```

### 4.5 Error Codes

All external public profile endpoints return `404 PUBLIC_CANDIDATE_PROFILE_NOT_FOUND` for private, suspended, deleted, undiscoverable, or invalid-token profiles.

### 4.6 Privacy Filtering

The backend profile assembler applies section-level privacy filtering based on the viewer context (OWNER, LINK_HOLDER, PLATFORM_AUTHENTICATED). Hidden sections are omitted entirely from API responses. Sensitive fields (email, dateOfBirth, completion score, user ID, auth tokens) are never exposed externally.
