# Data Export Privacy (NH-P1-T017)

## Export Contents

The data export contains a JSON file with the candidate's own data:

- **account.json** — email, status, verification, timestamps
- **profile/basic-profile.json** — name, headline, summary, DOB
- **profile/preferences.json** — location, job preferences
- **profile/education.json** — education history
- **profile/work-experience.json** — work history
- **profile/skills.json** — skills with proficiency
- **profile/languages.json** — languages with proficiency
- **profile/certifications.json** — certifications
- **profile/training.json** — training courses
- **profile/achievements.json** — achievements
- **profile/professional-links.json** — professional links
- **privacy/settings.json** — privacy settings
- **security/sessions-summary.json** — session timestamps and device info (no IP, tokens, or session IDs)

## Excluded Data

The following are never included in export:

- Password hashes
- Refresh token hashes
- Email verification/reset/share tokens
- Internal authorization IDs
- Audit log records
- IP addresses
- Raw user agents
- Session IDs
- Other users' data

## Storage Security

- Export files stored in private local storage directory
- Object keys are non-guessable (include random component)
- Download URLs are short-lived (5 minutes)
- Presigned URLs are generated on-demand, never persisted
- Export files expire after 7 days
- Expired exports return 410 Gone

## Worker Security

- Worker runs in-process within the API
- Temporary files are cleaned up after upload
- Failed exports are marked FAILED with safe failure category
- Retries are idempotent (no duplicate archives)
