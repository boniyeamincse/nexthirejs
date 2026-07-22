# Phase 1 API Inventory

Base URL: `/api/v1`

## Public Endpoints

### Auth

| Method | Path                              | Rate Limit | Description                     |
| ------ | --------------------------------- | ---------- | ------------------------------- |
| POST   | `/auth/register/candidate`        | 5/min      | Register new candidate          |
| POST   | `/auth/email-verification/verify` | 3/min      | Verify email with token         |
| POST   | `/auth/email-verification/resend` | 1/min      | Resend verification email       |
| POST   | `/auth/login`                     | 5/min      | Login with email/password       |
| POST   | `/auth/refresh`                   | 30/min     | Refresh access token via cookie |
| POST   | `/auth/forgot-password`           | —          | Request password reset email    |
| POST   | `/auth/reset-password`            | —          | Reset password with token       |

### Public Profiles

| Method | Path                               | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| GET    | `/public/candidates/:publicId`     | Platform-discoverable profile |
| GET    | `/public/candidate-profile?token=` | Share-link profile            |

### Configuration

| Method | Path                | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/config/countries` | Supported countries list |

### Health

| Method | Path      | Description          |
| ------ | --------- | -------------------- |
| GET    | `/health` | Service health check |

## Authenticated Endpoints (candidate role required)

### Auth/Session

| Method | Path                        | Description               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/auth/me`                  | Current user info         |
| POST   | `/auth/logout`              | End current session       |
| GET    | `/auth/sessions`            | List active sessions      |
| DELETE | `/auth/sessions/:sessionId` | Revoke specific session   |
| POST   | `/auth/logout-all`          | Revoke all sessions       |
| POST   | `/auth/change-password`     | Change password (5/15min) |

### Account

| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/candidates/me/account-security` | Security summary             |
| POST   | `/candidates/me/deactivate`       | Deactivate account (5/15min) |

### Profile Sections

| Method              | Path                                        | Description            |
| ------------------- | ------------------------------------------- | ---------------------- |
| GET/PUT             | `/candidates/me/profile`                    | Basic profile          |
| GET/PUT             | `/candidates/me/preferences`                | Career preferences     |
| GET/POST/PUT/DELETE | `/candidates/me/education`                  | Education records      |
| PUT                 | `/candidates/me/education/reorder`          | Reorder education      |
| GET/POST/PUT/DELETE | `/candidates/me/experience`                 | Work experience        |
| PUT                 | `/candidates/me/experience/reorder`         | Reorder experience     |
| GET/POST/PUT/DELETE | `/candidates/me/skills`                     | Skills                 |
| PUT                 | `/candidates/me/skills/reorder`             | Reorder skills         |
| GET/POST/PUT/DELETE | `/candidates/me/languages`                  | Languages              |
| PUT                 | `/candidates/me/languages/reorder`          | Reorder languages      |
| GET/POST/PUT/DELETE | `/candidates/me/certifications`             | Certifications         |
| PUT                 | `/candidates/me/certifications/reorder`     | Reorder certifications |
| GET/POST/PUT/DELETE | `/candidates/me/training`                   | Training courses       |
| PUT                 | `/candidates/me/training/reorder`           | Reorder training       |
| GET/POST/PUT/DELETE | `/candidates/me/achievements`               | Achievements           |
| PUT                 | `/candidates/me/achievements/reorder`       | Reorder achievements   |
| GET/POST/PUT/DELETE | `/candidates/me/professional-links`         | Professional links     |
| PUT                 | `/candidates/me/professional-links/reorder` | Reorder links          |

### Privacy & Preview

| Method  | Path                                       | Description           |
| ------- | ------------------------------------------ | --------------------- |
| GET/PUT | `/candidates/me/privacy`                   | Privacy settings      |
| GET     | `/candidates/me/profile-preview`           | Owner profile preview |
| POST    | `/candidates/me/profile/share-link/rotate` | Rotate share token    |
| GET/PUT | `/candidates/me/profile/share-link`        | Share link status     |

### Completion

| Method | Path                                | Description          |
| ------ | ----------------------------------- | -------------------- |
| GET    | `/candidates/me/profile-completion` | Completion dashboard |

### Data Export

| Method | Path                                       | Rate Limit | Description         |
| ------ | ------------------------------------------ | ---------- | ------------------- |
| POST   | `/candidates/me/data-exports`              | 3/30d      | Request data export |
| GET    | `/candidates/me/data-exports`              | —          | List exports        |
| GET    | `/candidates/me/data-exports/:id`          | —          | Export status       |
| POST   | `/candidates/me/data-exports/:id/download` | 10/h       | Download export     |

## Response Envelope

All responses use a `{ success, data, message, errors, requestId }` envelope pattern. Paginated responses include `{ data, meta: { total, page, perPage } }`.

## Error Codes

Auth errors prefixed `AUTH_*`, account errors `ACCOUNT_*`, data export errors `DATA_EXPORT_*`, profile errors `PROFILE_*`, privacy errors `PRIVACY_*`.
