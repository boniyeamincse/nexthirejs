# NextHire Module — Candidate Profile

**Module ID:** `NH-MODULE-CANDIDATE-PROFILE`  
**Module Type:** Complete Full-Stack Module  
**Target Coding Agent:** Claude  
**Primary Scope:** `apps/api`, `apps/web`, Prisma, shared packages  
**Required Final Commit:** `feat(candidate): implement complete candidate profile module [NH-MODULE-CANDIDATE-PROFILE]`

---

## 1. Core Instruction

Read this file completely and implement only the complete Candidate Profile module.

Before changing code:

1. Inspect the entire repository.
2. Read `README.md` and `docs/task/status.md`.
3. Inspect authentication, roles, sessions, files, audit, rate limiting, validation, location, language, skill, API-client, and frontend conventions.
4. Inspect all existing Candidate-related code and migrations.
5. Reuse and complete existing code; do not create duplicate profile modules.
6. Run baseline lint, type-check, tests, and builds.
7. Record missing dependencies and repository findings.
8. Mark the module `BLOCKED` and do not commit when a critical dependency is unavailable.

This is one complete module instruction. Implement database, API, frontend, privacy, completion scoring, tests, documentation, and Git verification.

Do not implement Expert, Company, Job, Booking, Payment, Learning, Assessment, or AI Interview features here.

---

## 2. Product Goal

Allow an authenticated Candidate to build and maintain a complete professional profile that can later support:

- free CV generation
- public Candidate profile
- verified-company Candidate search
- Expert interview preparation
- assessment personalization
- job applications

The profile must cover:

```text
Basic identity
Professional headline and summary
Profile photo
Location
Career preferences
Education
Work experience
Projects
Skills
Languages
Certifications
Training
Achievements
Professional links
Privacy settings
Public profile preview
Completion score
CV readiness
```

---

## 3. Module Boundary

### Include

- Candidate Profile foundation
- every professional profile section
- profile ownership
- privacy projection
- public profile
- profile photo
- completion score
- CV readiness
- backend and frontend
- tests and documentation

### Exclude

- CV templates
- PDF CV export
- Company Candidate database
- Candidate messaging
- Jobs and applications
- Expert booking
- Payments
- account password/security settings
- account deactivation/data export
- AI-generated profile content

Expose clean typed data for a future CV Builder, but do not generate a CV in this module.

---

## 4. Authorization Rules

1. Only authenticated active users with the `CANDIDATE` role may manage Candidate Profile.
2. Candidate can access only their own profile and child records.
3. Never accept `candidateId` or `userId` from client payloads.
4. Resolve identity from the authenticated session.
5. Suspended, deactivated, locked, or deleted accounts cannot update profile data.
6. Backend authorization is authoritative.
7. Public access must follow privacy settings.
8. Internal IDs must not leak unnecessarily.
9. Every write must be audited safely.
10. All timestamps use UTC.

---

# 5. Candidate Profile Sections

## 5.1 Basic Profile

Fields:

```ts
{
  firstName: string;
  lastName: string;
  displayName?: string | null;
  headline?: string | null;
  professionalSummary?: string | null;
  dateOfBirth?: string | null;
  gender?: CandidateGender | null;
  phoneNumber?: string | null;
  profilePhotoFileId?: string | null;
}
```

Validation:

- first and last name required, Unicode-safe, 1–80 characters
- display name optional, maximum 120
- headline optional, 5–160
- summary optional, 50–3,000, sanitized plain text
- date of birth is date-only, not future, never public by default
- phone normalized when possible and private by default
- do not infer gender

Suggested gender enum:

```text
MALE
FEMALE
NON_BINARY
PREFER_NOT_TO_SAY
OTHER
```

Profile photo:

- JPEG, PNG, WEBP
- maximum 5 MB
- validate MIME and file signature
- private/controlled storage
- safe transformed display URL
- no raw storage key in normal DTO

---

## 5.2 Location

Fields:

```ts
{
  countryId: string;
  stateOrDivision?: string | null;
  city?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  willingToRelocate: boolean;
}
```

Rules:

- country required for completion
- reuse active country catalog
- validate IANA timezone
- public projection uses privacy-approved location granularity
- postal code private by default
- do not collect or expose street address

---

## 5.3 Career Preferences

Fields:

```ts
{
  currentCareerLevel?: CandidateCareerLevel | null;
  desiredJobTitles: string[];
  preferredEmploymentTypes: CandidateEmploymentType[];
  preferredWorkModes: CandidateWorkMode[];
  expectedSalaryMin?: string | null;
  expectedSalaryMax?: string | null;
  expectedSalaryCurrency?: string | null;
  noticePeriodDays?: number | null;
  availableFrom?: string | null;
  openToOpportunities: boolean;
}
```

Career levels:

```text
INTERN
ENTRY_LEVEL
JUNIOR
MID_LEVEL
SENIOR
LEAD
MANAGER
DIRECTOR
EXECUTIVE
```

Employment types:

```text
FULL_TIME
PART_TIME
CONTRACT
INTERNSHIP
FREELANCE
TEMPORARY
```

Work modes:

```text
ONSITE
REMOTE
HYBRID
```

Rules:

- maximum 10 desired titles
- no duplicate titles
- salaries use exact decimal strings
- no floating-point money
- salary min cannot exceed max
- currency is uppercase ISO 4217
- support `BDT`
- notice period 0–365
- salary private by default

---

## 5.4 Education

Fields:

```ts
{
  institutionName: string;
  degreeName: string;
  fieldOfStudy?: string | null;
  educationLevel: CandidateEducationLevel;
  startDate?: string | null;
  endDate?: string | null;
  isCurrentlyStudying: boolean;
  grade?: string | null;
  description?: string | null;
  countryId?: string | null;
  city?: string | null;
}
```

Levels:

```text
SECONDARY
HIGHER_SECONDARY
DIPLOMA
BACHELOR
MASTER
MBA
PHD
PROFESSIONAL
OTHER
```

Rules:

- institution and degree required
- current study has no end date
- start cannot be after end
- description maximum 2,000
- grade maximum 100
- support create, update, delete, and reorder
- every mutation must enforce ownership

---

## 5.5 Work Experience

Fields:

```ts
{
  companyName: string;
  jobTitle: string;
  employmentType?: CandidateEmploymentType | null;
  location?: string | null;
  workMode?: CandidateWorkMode | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  responsibilities: string[];
  achievements: string[];
}
```

Rules:

- company, title, and start date required
- non-current record requires end date
- start cannot be after end
- description maximum 3,000
- maximum 20 responsibilities and 20 achievements
- maximum 500 characters per item
- no empty items
- support reorder
- completion logic must support fresh graduates through education plus projects

---

## 5.6 Projects

Fields:

```ts
{
  title: string;
  role?: string | null;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  isOngoing: boolean;
  projectUrl?: string | null;
  repositoryUrl?: string | null;
  technologies: string[];
}
```

Rules:

- title required
- description 30–2,000
- safe URL validation
- maximum 30 technologies
- no duplicates
- ongoing date rules
- support reorder

---

## 5.7 Skills

Use existing skill catalog.

Fields:

```ts
{
  skillId: string;
  proficiencyLevel: CandidateSkillLevel;
  yearsOfExperience?: number | null;
  isPrimary: boolean;
}
```

Levels:

```text
BEGINNER
INTERMEDIATE
ADVANCED
EXPERT
```

Rules:

- maximum 50 skills
- maximum 10 primary skills
- active catalog skill only
- no duplicates
- experience 0–60
- transactional replace-all is acceptable
- do not create uncontrolled duplicate custom skills

---

## 5.8 Languages

Fields:

```ts
{
  languageCode: string;
  proficiency: CandidateLanguageProficiency;
}
```

Levels:

```text
BASIC
CONVERSATIONAL
PROFESSIONAL
FLUENT
NATIVE
```

Rules:

- active language catalog only
- maximum 15
- no duplicates
- validate standardized language codes

---

## 5.9 Certifications

Fields:

```ts
{
  name: string;
  issuingOrganization: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  doesNotExpire: boolean;
  credentialId?: string | null;
  credentialUrl?: string | null;
  description?: string | null;
}
```

Rules:

- name and issuer required
- expiry cannot precede issue
- no expiry when `doesNotExpire`
- safe credential URL
- description maximum 1,500
- support reorder

---

## 5.10 Training and Courses

Fields:

```ts
{
  title: string;
  provider: string;
  completionDate?: string | null;
  durationHours?: number | null;
  certificateUrl?: string | null;
  description?: string | null;
}
```

Rules:

- title and provider required
- duration 1–10,000 when provided
- safe URL
- description maximum 1,500
- keep separate from certifications

---

## 5.11 Achievements and Awards

Fields:

```ts
{
  title: string;
  issuer?: string | null;
  achievementDate?: string | null;
  description?: string | null;
  url?: string | null;
}
```

Rules:

- title required
- safe URL
- description maximum 1,500
- support reorder

---

## 5.12 Professional Links

Types:

```text
LINKEDIN
GITHUB
PORTFOLIO
PERSONAL_WEBSITE
BEHANCE
DRIBBBLE
STACK_OVERFLOW
KAGGLE
OTHER
```

Fields:

```ts
{
  type: CandidateProfessionalLinkType;
  label?: string | null;
  url: string;
}
```

Rules:

- maximum 20 links
- approved HTTP/HTTPS schemes only
- reject `javascript:` and unsafe schemes
- no duplicate unique types where inappropriate
- `OTHER` requires label
- visibility controlled by privacy settings

---

# 6. Privacy Settings

Visibility enum:

```text
PRIVATE
REGISTERED_USERS
VERIFIED_COMPANIES
PUBLIC
```

Privacy fields:

```ts
{
  profileVisibility: CandidateProfileVisibility;
  showProfilePhoto: boolean;
  showFullName: boolean;
  showHeadline: boolean;
  showSummary: boolean;
  showLocation: boolean;
  showEducation: boolean;
  showExperience: boolean;
  showProjects: boolean;
  showSkills: boolean;
  showLanguages: boolean;
  showCertifications: boolean;
  showAchievements: boolean;
  showProfessionalLinks: boolean;
  showPhoneNumber: boolean;
  showEmailAddress: boolean;
  showSalaryExpectation: boolean;
}
```

Secure defaults:

```text
profileVisibility = PRIVATE
showPhoneNumber = false
showEmailAddress = false
showSalaryExpectation = false
```

Rules:

1. Date of birth is never public.
2. Phone, email, and salary require explicit separate opt-in.
3. Hidden fields must not appear in serialized payloads.
4. Public preview and public endpoint must use the same projection service.
5. Future verified-company access must reuse this projection architecture.
6. Do not implement company access in this module.

Viewer contexts:

```text
OWNER
PUBLIC
REGISTERED_USER
VERIFIED_COMPANY
ADMIN
```

---

# 7. Public Profile

Add unique public slug:

```ts
{
  publicSlug: string;
}
```

Rules:

- lowercase URL-safe slug
- 3–80 characters
- reserved words rejected
- unique database constraint
- rate-limit slug changes
- never derive directly from email
- default may use name plus random suffix

Routes:

```text
/candidates/[slug]
/profile/privacy
/profile/public-preview
```

APIs:

```http
GET /api/v1/public/candidates/:slug
GET /api/v1/candidates/me/profile/public-preview
PUT /api/v1/candidates/me/profile/public-slug
```

Public endpoint must:

- return safe `404` for private/unavailable profile
- apply field-level privacy
- avoid account enumeration
- exclude internal IDs
- hide contact data unless explicitly allowed
- never expose date of birth
- use public-safe DTO

Preview must show the exact projected view for the selected viewer context.

---

# 8. Profile Completion

Implement backend-owned deterministic completion scoring.

Suggested weights:

```text
Basic profile: 15
Headline and summary: 10
Location: 5
Career preferences: 10
Education: 10
Experience or meaningful projects: 15
Skills: 10
Languages: 5
Certifications or training: 5
Achievements or links: 5
Profile photo: 5
Privacy/public setup: 5
```

Rules:

- score is 0–100
- frontend never submits score
- deterministic unit-tested calculation
- fresh graduates can satisfy experience section through education plus meaningful projects
- return missing-section guidance
- recalculate after every relevant write
- cached score is allowed only with reliable refresh/recalculation logic

Response:

```ts
interface CandidateProfileCompletion {
  percentage: number;
  completedSections: string[];
  missingSections: Array<{
    code: string;
    title: string;
    recommendation: string;
    route: string;
  }>;
  cvReady: boolean;
  publicProfileReady: boolean;
}
```

Endpoint:

```http
GET /api/v1/candidates/me/profile/completion
```

---

# 9. CV Readiness

Do not generate a CV.

Expose future CV Builder readiness:

```http
GET /api/v1/candidates/me/cv-readiness
```

Required readiness fields:

```text
first name
last name
headline
professional summary
country
verified account email
at least one education or experience record
at least three skills
```

Recommended fields:

```text
phone
profile photo
projects
languages
links
certifications
```

Return:

- `ready`
- blockers
- recommendations
- available sections
- last updated timestamp

---

# 10. Database Models

Adapt to existing Prisma conventions. Do not duplicate existing models.

Required logical models:

```text
CandidateProfile
CandidateCareerPreference
CandidateEducation
CandidateWorkExperience
CandidateProject
CandidateSkill
CandidateLanguage
CandidateCertification
CandidateTraining
CandidateAchievement
CandidateProfessionalLink
CandidateProfilePrivacy
```

All child models should include:

```text
id
candidateProfileId
sortOrder where relevant
createdAt
updatedAt
```

Suggested CandidateProfile foundation:

```prisma
model CandidateProfile {
  id                  String    @id @default(uuid()) @db.Uuid
  userId              String    @unique @db.Uuid
  firstName           String    @db.VarChar(80)
  lastName            String    @db.VarChar(80)
  displayName         String?   @db.VarChar(120)
  publicSlug          String    @unique @db.VarChar(80)
  headline            String?   @db.VarChar(160)
  professionalSummary String?   @db.Text
  dateOfBirth         DateTime? @db.Date
  gender              CandidateGender?
  phoneNumber         String?   @db.VarChar(30)
  profilePhotoFileId  String?   @db.Uuid
  countryId           String?   @db.Uuid
  stateOrDivision     String?   @db.VarChar(120)
  city                String?   @db.VarChar(120)
  postalCode          String?   @db.VarChar(30)
  timezone            String?   @db.VarChar(100)
  willingToRelocate   Boolean   @default(false)
  completionScore     Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

Add indexes for:

- owner lookup
- public slug
- child ownership
- sort order
- future search fields
- privacy lookup

Never return raw Prisma models directly.

---

# 11. Migration Safety

1. Create descriptive migration(s).
2. Do not edit applied migrations.
3. Do not run `prisma migrate reset`.
4. Do not use destructive `db push`.
5. Generate Prisma Client.
6. Validate schema.
7. Test clean migration order.
8. Preserve existing Candidate data.
9. Add safe defaults/backfills.
10. Document migration results.

---

# 12. Shared Contracts

Create shared enums, schemas, and types for all sections.

Required exports include:

```text
CandidateProfile
CandidateBasicProfileInput
CandidateLocationInput
CandidateCareerPreferenceInput
CandidateEducationInput
CandidateWorkExperienceInput
CandidateProjectInput
CandidateSkillInput
CandidateLanguageInput
CandidateCertificationInput
CandidateTrainingInput
CandidateAchievementInput
CandidateProfessionalLinkInput
CandidateProfilePrivacyInput
CandidatePublicProfile
CandidateProfileCompletion
CandidateCvReadiness
```

Do not duplicate enums separately in API and web.

---

# 13. Validation Standards

- trim input strings
- reject control characters
- sanitize multiline plain text
- reject unsafe HTML
- validate URL schemes
- validate ISO dates
- validate date ranges
- validate IANA timezone
- validate ISO currency
- preserve decimal values as strings
- reject duplicate array items
- enforce section limits
- reject unknown fields according to repository policy
- never expose database error details

---

# 14. Backend Architecture

Suggested:

```text
apps/api/src/modules/candidates/profile/
├── controllers/
├── services/
├── repositories/
├── dto/
├── validators/
├── completion/
├── privacy/
├── public-profile/
└── tests/
```

Create central services:

```text
CandidateProfileOwnershipService
CandidateProfileProjectionService
CandidateProfileCompletionService
CandidateCvReadinessService
```

Reuse existing file, catalog, auth, and audit modules.

---

# 15. API Inventory

## Aggregate

```http
GET /api/v1/candidates/me/profile
```

## Basic

```http
GET /api/v1/candidates/me/profile/basic
PUT /api/v1/candidates/me/profile/basic
```

## Location

```http
GET /api/v1/candidates/me/profile/location
PUT /api/v1/candidates/me/profile/location
```

## Career preferences

```http
GET /api/v1/candidates/me/profile/career-preferences
PUT /api/v1/candidates/me/profile/career-preferences
```

## Education

```http
GET    /api/v1/candidates/me/profile/education
POST   /api/v1/candidates/me/profile/education
PUT    /api/v1/candidates/me/profile/education/:educationId
DELETE /api/v1/candidates/me/profile/education/:educationId
PUT    /api/v1/candidates/me/profile/education/reorder
```

## Experience

```http
GET    /api/v1/candidates/me/profile/experience
POST   /api/v1/candidates/me/profile/experience
PUT    /api/v1/candidates/me/profile/experience/:experienceId
DELETE /api/v1/candidates/me/profile/experience/:experienceId
PUT    /api/v1/candidates/me/profile/experience/reorder
```

## Projects

```http
GET    /api/v1/candidates/me/profile/projects
POST   /api/v1/candidates/me/profile/projects
PUT    /api/v1/candidates/me/profile/projects/:projectId
DELETE /api/v1/candidates/me/profile/projects/:projectId
PUT    /api/v1/candidates/me/profile/projects/reorder
```

## Skills and languages

```http
GET /api/v1/candidates/me/profile/skills
PUT /api/v1/candidates/me/profile/skills
GET /api/v1/candidates/me/profile/languages
PUT /api/v1/candidates/me/profile/languages
```

## Certifications

```http
GET    /api/v1/candidates/me/profile/certifications
POST   /api/v1/candidates/me/profile/certifications
PUT    /api/v1/candidates/me/profile/certifications/:certificationId
DELETE /api/v1/candidates/me/profile/certifications/:certificationId
PUT    /api/v1/candidates/me/profile/certifications/reorder
```

## Training

```http
GET    /api/v1/candidates/me/profile/training
POST   /api/v1/candidates/me/profile/training
PUT    /api/v1/candidates/me/profile/training/:trainingId
DELETE /api/v1/candidates/me/profile/training/:trainingId
PUT    /api/v1/candidates/me/profile/training/reorder
```

## Achievements

```http
GET    /api/v1/candidates/me/profile/achievements
POST   /api/v1/candidates/me/profile/achievements
PUT    /api/v1/candidates/me/profile/achievements/:achievementId
DELETE /api/v1/candidates/me/profile/achievements/:achievementId
PUT    /api/v1/candidates/me/profile/achievements/reorder
```

## Links

```http
GET /api/v1/candidates/me/profile/links
PUT /api/v1/candidates/me/profile/links
```

## Privacy and public profile

```http
GET /api/v1/candidates/me/profile/privacy
PUT /api/v1/candidates/me/profile/privacy
PUT /api/v1/candidates/me/profile/public-slug
GET /api/v1/candidates/me/profile/public-preview
GET /api/v1/public/candidates/:slug
```

## Completion and CV readiness

```http
GET /api/v1/candidates/me/profile/completion
GET /api/v1/candidates/me/cv-readiness
```

## Profile photo

Use existing secure file architecture:

```http
POST   /api/v1/candidates/me/profile/photo
DELETE /api/v1/candidates/me/profile/photo
```

---

# 16. Controlled Error Codes

```text
CANDIDATE_ROLE_REQUIRED
CANDIDATE_PROFILE_NOT_FOUND
CANDIDATE_PROFILE_VALIDATION_FAILED
CANDIDATE_PROFILE_ACCESS_DENIED
CANDIDATE_PROFILE_ACCOUNT_UNAVAILABLE
CANDIDATE_PROFILE_SLUG_INVALID
CANDIDATE_PROFILE_SLUG_UNAVAILABLE
CANDIDATE_PROFILE_RECORD_NOT_FOUND
CANDIDATE_PROFILE_DATE_RANGE_INVALID
CANDIDATE_PROFILE_SKILL_DUPLICATE
CANDIDATE_PROFILE_LANGUAGE_DUPLICATE
CANDIDATE_PROFILE_LIMIT_EXCEEDED
CANDIDATE_PROFILE_PRIVACY_INVALID
CANDIDATE_PROFILE_PHOTO_INVALID
CANDIDATE_PROFILE_PHOTO_TOO_LARGE
CANDIDATE_PROFILE_RATE_LIMITED
```

Use the repository’s standard error envelope.

---

# 17. Privacy Projection Service

`CandidateProfileProjectionService` must:

1. load the profile and related sections
2. identify viewer context
3. apply top-level visibility
4. apply field-level settings
5. always remove date of birth outside owner/admin internal contexts
6. remove phone/email/salary unless explicitly allowed
7. remove internal account and storage fields
8. return stable public DTO
9. serve both public endpoint and owner preview
10. support future verified-company projection without implementing company access now

Do not duplicate privacy logic in controllers.

---

# 18. Completion Engine

`CandidateProfileCompletionService` must:

- calculate deterministic score
- report completed and missing sections
- provide route-based recommendations
- calculate CV readiness
- calculate public-profile readiness
- refresh cached score after profile writes when caching is used
- never trust frontend score
- have full unit tests

---

# 19. Audit Events

Required event families:

```text
candidate.profile.created
candidate.profile.basic_updated
candidate.profile.location_updated
candidate.profile.career_preferences_updated
candidate.profile.education_added
candidate.profile.education_updated
candidate.profile.education_removed
candidate.profile.experience_added
candidate.profile.experience_updated
candidate.profile.experience_removed
candidate.profile.project_added
candidate.profile.project_updated
candidate.profile.project_removed
candidate.profile.skills_updated
candidate.profile.languages_updated
candidate.profile.certification_added
candidate.profile.certification_updated
candidate.profile.certification_removed
candidate.profile.training_added
candidate.profile.training_updated
candidate.profile.training_removed
candidate.profile.achievement_added
candidate.profile.achievement_updated
candidate.profile.achievement_removed
candidate.profile.links_updated
candidate.profile.privacy_updated
candidate.profile.slug_updated
candidate.profile.photo_updated
candidate.profile.photo_removed
candidate.profile.public_preview_viewed
candidate.profile.public_viewed
candidate.profile.completion_viewed
```

Safe metadata only:

```text
candidateProfileId
section
recordId
changedFieldNames
recordCount
completionPercentage
profileVisibility
viewerContext
```

Never audit profile content, phone, email, date of birth, salary, descriptions, private URLs, tokens, or cookies.

---

# 20. Rate Limits

Recommended:

```text
profile reads: 120/minute/user
basic/location/preferences updates: 30/hour/user
section writes: 60/hour/user
skills/languages/links replace: 30/hour/user
privacy updates: 20/hour/user
slug changes: 5/day/user
photo changes: 10/day/user
public reads: 120/minute/IP
```

Use existing distributed rate limiter.

---

# 21. Frontend Routes

Implement or complete:

```text
/profile
/profile/basic
/profile/location
/profile/career-preferences
/profile/education
/profile/experience
/profile/projects
/profile/skills
/profile/languages
/profile/certifications
/profile/training
/profile/achievements
/profile/links
/profile/privacy
/profile/public-preview
/candidates/[slug]
```

Use existing route groups and design system.

---

# 22. Profile Dashboard

`/profile` must show:

- profile photo
- display name
- headline
- completion percentage
- CV readiness
- public-profile readiness
- missing-section recommendations
- links to every section
- privacy status
- public profile URL
- last updated time

Do not add job, booking, payment, or Expert widgets.

---

# 23. Frontend Requirements

- shared validation
- save/cancel states
- duplicate-submit protection
- loading/success/error states
- exact decimal salary strings
- date-only values without timezone corruption
- query invalidation after writes
- no sensitive profile persistence in local storage
- no profile payload logging to analytics
- accessible CRUD and reorder controls

---

# 24. Frontend States

Support:

```text
auth loading
profile loading
first-time setup
loaded
saving
saved
validation error
record not found
access denied
account unavailable
section empty
add/edit/delete/reorder
photo upload/error
privacy saving
slug unavailable
completion loading
CV ready/not ready
public preview loading
public profile unavailable
session expired
API unavailable
unexpected error
```

---

# 25. Accessibility

- semantic headings
- linked labels
- fieldsets
- accessible date controls
- keyboard CRUD
- focus-managed dialogs
- visible focus
- text status in addition to color
- accessible completion progress
- validation summary
- keyboard reorder alternative
- accessible image upload
- described privacy toggles
- viewer-context label in preview
- save/loading announcements

---

# 26. API Client

Create typed client methods for every endpoint.

Rules:

- never send user/candidate ID
- centralized auth refresh
- preserve decimal strings
- do not log payloads
- do not persist sensitive data
- invalidate queries after writes
- do not automatically retry destructive writes

---

# 27. Transactions and Concurrency

1. Profile creation is idempotent.
2. One profile per user.
3. Child updates include owner scope in database query.
4. Skills/languages/links replace-all is transactional.
5. Reordering is transactional.
6. Slug uniqueness is database-enforced.
7. Completion refresh cannot leave stale invalid data.
8. Photo replacement cleans orphaned files.
9. Cross-user child mutation is impossible.
10. Privacy update and public projection cannot expose partially updated state.

---

# 28. Security Verification

Explicitly verify:

- IDOR prevention
- mass assignment prevention
- conservative privacy defaults
- no phone/email/salary/date-of-birth leakage
- no raw storage key
- safe URL protocols
- no XSS
- cross-user child-record denial
- privacy-safe public 404
- no sensitive logs/audit
- no sensitive browser storage
- owner pages use private/no-store behavior
- public endpoint rate limiting
- account-status enforcement

---

# 29. Tests

## Shared validation

Test all:

- names
- summaries
- dates
- URLs
- timezone
- money
- duplicate arrays
- section limits
- privacy
- slug
- unknown fields

## Services

Test:

- profile idempotency
- owner access
- role/account enforcement
- child ownership
- replace-all transactions
- reorder
- photo replacement
- audit safety

## Every section

Test:

- create
- list
- update
- delete
- validation
- order
- limit
- cross-user access

## Privacy

Test:

- private default
- public profile
- registered-user projection
- verified-company projection contract
- contact/salary/date-of-birth hiding
- field toggles
- preview equality
- private profile returns safe 404
- no internal fields

## Completion

Test:

- empty score
- every weight
- total 0–100
- fresh-graduate path
- CV blockers
- public readiness
- recalculation after writes
- deterministic result

## API E2E

Test:

- unauthenticated
- wrong role
- active Candidate
- suspended/deactivated
- all CRUD
- cross-user IDOR
- public privacy
- slug uniqueness
- photo validation
- rate limiting
- safe errors
- audit privacy

## Frontend

Test:

- route protection
- dashboard
- forms
- CRUD/reorder
- photo
- privacy
- preview/public profile
- completion/CV readiness
- API/session failures
- no browser persistence
- accessibility

---

# 30. Manual Smoke Test

1. Start PostgreSQL, Redis, MinIO, API, and web.
2. Register/login as Candidate.
3. Complete basic profile.
4. Add location and career preferences.
5. Add education.
6. Add experience.
7. Add project.
8. Add skills and languages.
9. Add certification/training.
10. Add achievement/links.
11. Upload photo.
12. Confirm completion changes.
13. Confirm CV readiness.
14. Confirm private default.
15. Enable selected public fields.
16. Compare owner preview with actual public route.
17. Confirm phone/email/salary/date of birth remain hidden.
18. Attempt cross-user record mutations.
19. Test unsafe URL and invalid photo.
20. Inspect logs/audit for sensitive leakage.
21. Confirm no CV PDF, Company search, Job, Booking, or Payment functionality was added.
22. Confirm Git status.

---

# 31. Documentation

Create/update:

```text
docs/architecture/candidate-profile.md
docs/product/candidate-profile-sections.md
docs/product/candidate-profile-completion.md
docs/security/candidate-profile-privacy.md
docs/api/candidate-profile.md
docs/task/status.md
README.md
```

Document:

- architecture
- sections
- validation
- ownership
- privacy projection
- public profile
- completion
- CV readiness
- file handling
- API inventory
- known limitations
- future CV Builder
- future verified-company access

Do not claim CV PDF or company access exists.

---

# 32. Expected File Areas

```text
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/<timestamp>_add_candidate_profile/
apps/api/src/modules/candidates/profile/
apps/api/src/modules/files/
apps/api/test/
apps/web/app/(authenticated)/profile/
apps/web/app/(public)/candidates/[slug]/
apps/web/src/features/candidate-profile/
packages/constants/src/candidates/
packages/types/src/candidates/
packages/validation/src/candidates/
packages/api-client/src/candidates/
docs/
```

Adapt to actual structure and avoid duplicates.

---

# 33. Implementation Order

1. inspect repository
2. verify dependencies
3. run baseline
4. shared enums/contracts/validation
5. Prisma models and migration
6. ownership service
7. basic profile
8. location
9. career preferences
10. education
11. experience
12. projects
13. skills
14. languages
15. certifications
16. training
17. achievements
18. links
19. profile photo
20. privacy projection
21. public profile
22. completion
23. CV readiness
24. API docs/client
25. frontend dashboard and forms
26. tests
27. manual smoke
28. docs
29. final verification
30. status update
31. final commit
32. stop

---

# 34. Required Commands

Use actual repository script names where different.

```bash
corepack enable
pnpm install --frozen-lockfile

pnpm infra:up
pnpm infra:status

pnpm --filter @nexthire/api prisma:format
pnpm --filter @nexthire/api prisma:validate
pnpm --filter @nexthire/api prisma:generate
pnpm --filter @nexthire/api prisma:migrate

pnpm --filter @nexthire/api lint
pnpm --filter @nexthire/api typecheck
pnpm --filter @nexthire/api test
pnpm --filter @nexthire/api test:e2e
pnpm --filter @nexthire/api build

pnpm --filter @nexthire/web lint
pnpm --filter @nexthire/web typecheck
pnpm --filter @nexthire/web test
pnpm --filter @nexthire/web test:e2e
pnpm --filter @nexthire/web build

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

git status --short
git diff --check
```

Also run actual checks for:

- file signature and private storage
- privacy projection
- IDOR
- slug uniqueness
- decimal salary
- timezone
- unsafe URLs/XSS
- completion determinism
- accessibility

Before commit:

```bash
git status --short
git diff --stat
git diff --check
git diff --cached --check
```

After commit:

```bash
git rev-parse --short HEAD
git log -1 --pretty=%B
git status --short
```

Never run destructive database commands.

---

# 35. Git Commit

Create exactly one final commit after the complete module and all checks pass:

```text
feat(candidate): implement complete candidate profile module [NH-MODULE-CANDIDATE-PROFILE]
```

No commit when blocked or when a mandatory check fails. Do not amend, rebase, squash, push, or tag.

---

# 36. Acceptance Criteria

## Domain

- [ ] one profile per Candidate
- [ ] all sections implemented
- [ ] safe migrations/indexes
- [ ] public slug unique
- [ ] ownership enforced
- [ ] existing data preserved

## Backend

- [ ] complete APIs
- [ ] shared validation
- [ ] IDOR blocked
- [ ] completion engine
- [ ] CV readiness
- [ ] central privacy projection
- [ ] safe public profile
- [ ] audit/rate limiting
- [ ] Swagger/docs

## Privacy

- [ ] conservative defaults
- [ ] phone/email/salary hidden by default
- [ ] date of birth never public
- [ ] no hidden-field leakage
- [ ] secure photo
- [ ] unsafe URLs rejected
- [ ] no sensitive logs/browser storage

## Frontend

- [ ] profile dashboard
- [ ] every section form
- [ ] CRUD/reorder
- [ ] photo
- [ ] privacy
- [ ] preview/public profile
- [ ] completion guidance
- [ ] CV readiness
- [ ] loading/error states
- [ ] accessibility

## Tests and Docs

- [ ] unit
- [ ] integration
- [ ] API E2E
- [ ] frontend
- [ ] privacy/IDOR regression
- [ ] manual smoke
- [ ] documentation
- [ ] known limitations

## Git

- [ ] all checks pass
- [ ] only module files staged
- [ ] exactly one commit
- [ ] correct message
- [ ] hash reported
- [ ] no commit if blocked

---

# 37. Completion Report

Return:

```markdown
# Candidate Profile Module Completion Report

## Status

COMPLETED | BLOCKED

## Repository Findings

- Existing Candidate code:
- Reused modules:
- Missing dependencies:
- Initial Git state:

## Database

- Models:
- Migration:
- Indexes/backfill:
- Result:

## Shared Packages

- Enums:
- Types:
- Validation:
- API client:

## Backend

- Basic:
- Location:
- Career preferences:
- Education:
- Experience:
- Projects:
- Skills:
- Languages:
- Certifications:
- Training:
- Achievements:
- Links:
- Photo:
- Privacy/public profile:
- Completion:
- CV readiness:
- Audit/rate limiting:

## Frontend

- Dashboard:
- Section forms:
- CRUD/reorder:
- Privacy:
- Preview/public:
- Completion/CV:
- Accessibility:

## Security

- Ownership/IDOR:
- Privacy leakage:
- File security:
- URL/XSS:
- Logs/audit:
- Browser storage:

## Tests

- Unit:
- Integration:
- API E2E:
- Frontend:
- Privacy:
- Accessibility:
- Manual smoke:

## Commands

- Prisma:
- API:
- Web:
- Root:
- Security:
- Diff:

## Files Added

- path

## Files Modified

- path

## Git Commit

- Created:
- Hash:
- Message:
- Working tree:

## Blockers

- None | details

## Deferred Modules

- CV Builder/PDF
- Company Candidate Search
- Candidate Messaging
- Jobs
- Expert Booking
- AI Profile Assistance
```

---

# 38. Definition of Done

The module is complete when an authenticated active Candidate can build, update, organize, secure, preview, and publish a complete professional profile; every section works end-to-end; privacy prevents hidden-field leakage; completion and CV readiness are accurate; all tests and checks pass; documentation is current; and one clean module-specific Git commit is created.

---

**End of Module — Candidate Profile**
