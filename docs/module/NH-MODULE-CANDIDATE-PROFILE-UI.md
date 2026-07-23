# NextHire Module — Candidate Profile UI

**Module ID:** `NH-MODULE-CANDIDATE-PROFILE-UI`  
**Target Agent:** Claude  
**Scope:** `apps/web`, Candidate API client, shared frontend types/validation  
**Required Commit:** `feat(candidate-ui): build candidate profile interface [NH-MODULE-CANDIDATE-PROFILE-UI]`

---

## 1. Instruction

Implement only the Candidate Profile frontend UI.

First:

1. Inspect the repository, `README.md`, and `docs/task/status.md`.
2. Inspect the Next.js route structure, auth guard, design system, form library, validation, query/cache layer, API client, toast/dialog components, and tests.
3. Inspect existing Candidate Profile UI and reuse it.
4. Inspect Swagger and confirm the real backend paths.
5. Run frontend lint, type-check, tests, E2E, and build before editing.
6. Do not invent production APIs.
7. Mark the module `BLOCKED` when an essential backend API is unavailable.

Do not implement CV Builder, Assessments, Jobs, Expert, Company, Payment, or backend domain models here.

---

## 2. Existing APIs

### Profile

Swagger currently shows:

```http
GET /api/v1/v1/candidates/me/profile
PUT /api/v1/v1/candidates/me/profile
```

Expected normalized route:

```http
GET /api/v1/candidates/me/profile
PUT /api/v1/candidates/me/profile
```

Inspect whether the duplicate `v1` comes from the global prefix, controller prefix, or Swagger configuration.

Requirements:

- use one centralized API-client path;
- do not hardcode route strings in components;
- do not create two permanent routes without a compatibility requirement;
- a minimal route-prefix correction is allowed only when required and must include API tests.

### Preferences

```http
GET /api/v1/candidates/me/preferences
PUT /api/v1/candidates/me/preferences
```

### Education

```http
GET    /api/v1/candidates/me/education
POST   /api/v1/candidates/me/education
PUT    /api/v1/candidates/me/education/reorder
PUT    /api/v1/candidates/me/education/{id}
DELETE /api/v1/candidates/me/education/{id}
```

### Experience

```http
GET    /api/v1/candidates/me/experience
POST   /api/v1/candidates/me/experience
PUT    /api/v1/candidates/me/experience/reorder
PUT    /api/v1/candidates/me/experience/{id}
DELETE /api/v1/candidates/me/experience/{id}
```

Do not display unsupported Projects, Skills, Languages, Certifications, Privacy, Photo, or Public Profile sections unless their real APIs already exist.

---

## 3. Routes

Use the existing authenticated route group.

Recommended:

```text
/profile
/profile/edit
/profile/preferences
/profile/education
/profile/experience
```

Required:

- login required;
- Candidate role required;
- safe unauthorized state;
- centralized session-expiry handling;
- private/no-store behavior for user-owned pages where applicable.

---

## 4. Shared Profile Layout

Build a reusable Candidate Profile shell.

Desktop:

```text
Header
Profile summary
Section navigation
Main content
Completion/status panel
```

Mobile:

```text
Compact header
Completion summary
Mobile section navigation
Single-column content
```

Navigation:

```text
Overview
Basic Information
Preferences
Education
Work Experience
```

Use existing design-system components and branding. Do not introduce a new global UI system.

---

## 5. Overview Page

Route:

```text
/profile
```

Show:

- Candidate name;
- professional headline when available;
- location when available;
- authenticated account email;
- current profile setup percentage;
- Basic Information status;
- Preferences status;
- Education record count/status;
- Work Experience record count/status;
- last updated time;
- quick actions.

Do not label this as full platform profile completion when only current APIs are available.

### Temporary UI completion

Use a backend completion endpoint when one exists. Otherwise calculate display-only:

```text
Basic profile: 30%
Preferences: 20%
Education: 25%
Experience: 25%
```

Rules:

- never persist or send the score;
- keep calculation in one tested utility;
- label it “Current profile setup”;
- experience is optional guidance for fresh graduates.

---

## 6. Basic Profile Form

Route:

```text
/profile/edit
```

Inspect the actual DTO before rendering fields.

Possible fields include:

```text
first name
last name
display name
headline
professional summary
phone
country/location
date of birth
gender
```

Only render supported fields.

Requirements:

- load real data;
- use shared validation;
- trim inputs;
- character counters for long text;
- safe date-only handling;
- field errors and form error summary;
- save/cancel;
- duplicate-submit prevention;
- saving/saved feedback;
- unsaved-change protection;
- invalidate profile/overview query after save;
- no profile values in console, analytics, local storage, or session storage.

Group supported fields under:

```text
Personal Information
Professional Information
Contact Information
```

---

## 7. Preferences Form

Route:

```text
/profile/preferences
```

Inspect actual DTO.

Potential supported fields:

```text
desired job titles
career level
employment type
work mode
expected salary
currency
notice period
available date
open to opportunities
willing to relocate
```

Requirements:

- render only backend-supported fields;
- accessible multi-selects;
- preserve decimal salary as a string;
- validate salary min/max;
- support `BDT` when available;
- date-only handling;
- salary privacy explanation;
- saving/saved/error states;
- invalidate relevant queries.

---

## 8. Education UI

Route:

```text
/profile/education
```

List page:

- title and add button;
- useful empty state;
- education cards;
- institution;
- degree/field;
- level;
- date range;
- current-study badge;
- location;
- edit/delete/reorder actions.

Create/edit form must use actual DTO. Likely fields:

```text
institution
degree
field of study
education level
start date
end date
currently studying
grade
description
country
city
```

Requirements:

- current study removes/disables end date;
- start/end validation;
- create/update integration;
- focus-managed modal/drawer or existing form route;
- invalidate education and overview;
- keep dialog open on failure;
- restore focus after close.

Delete:

- explicit accessible confirmation;
- show safe record label;
- prevent duplicate click;
- handle 404/conflict;
- refresh canonical data.

Reorder:

- Move up/down/top/bottom controls;
- keyboard operation mandatory;
- drag-and-drop optional;
- optimistic update only with rollback;
- refresh canonical order after save.

---

## 9. Work Experience UI

Route:

```text
/profile/experience
```

List page:

- add action;
- fresh-graduate-friendly empty state;
- company;
- job title;
- employment type;
- work mode;
- location;
- date range;
- current-role badge;
- edit/delete/reorder.

Likely form fields:

```text
company name
job title
employment type
work mode
location
start date
end date
current role
description
responsibilities
achievements
```

Requirements:

- current role removes/disables end date;
- valid date range;
- dynamic responsibilities;
- dynamic achievements;
- limits from shared schema;
- remove blank items;
- safe text inputs;
- create/update integration;
- unsaved-change protection;
- canonical query refresh.

Use the same delete/reorder accessibility and concurrency rules as Education.

---

## 10. Reusable Components

Create only when useful:

```text
CandidateProfileShell
ProfileSectionNav
ProfileCompletionCard
ProfileSectionStatusCard
ProfilePageHeader
ProfileEmptyState
ProfileRecordCard
ProfileDeleteDialog
ProfileReorderControls
FormErrorSummary
UnsavedChangesGuard
SaveStatus
DateRangeDisplay
```

Reuse existing Button, Input, Select, Textarea, Dialog, Drawer, Card, Badge, Skeleton, Toast, Alert, Progress, and Tabs.

---

## 11. API Client

Create or complete:

```ts
getMyCandidateProfile();
updateMyCandidateProfile(input);

getMyCandidatePreferences();
updateMyCandidatePreferences(input);

listMyCandidateEducation();
createMyCandidateEducation(input);
updateMyCandidateEducation(id, input);
deleteMyCandidateEducation(id);
reorderMyCandidateEducation(input);

listMyCandidateExperience();
createMyCandidateExperience(input);
updateMyCandidateExperience(id, input);
deleteMyCandidateExperience(id);
reorderMyCandidateExperience(input);
```

Rules:

- no user/candidate IDs in requests;
- centralized auth/refresh;
- typed contracts;
- normalized errors;
- no payload logging;
- no automatic retries for writes;
- GET retry only according to repository convention.

---

## 12. Query and Cache

Use the current query library.

Suggested keys:

```text
candidate-profile
candidate-preferences
candidate-education
candidate-experience
```

Requirements:

- deduplicate requests;
- invalidate overview after writes;
- invalidate section query after section writes;
- no private cache persistence;
- clear private cache on logout;
- avoid refetch loops;
- preserve form input during safe background refresh.

---

## 13. Forms and Errors

Use the current form library and shared schemas.

Requirements:

1. Client validation is UX only; backend remains authoritative.
2. Map API field errors.
3. Show error summary.
4. Prevent duplicate submit.
5. Handle network/timeout state.
6. Never log form data.
7. Exact date and decimal handling.

Error mapping:

```text
401 → session-expired/login flow
403 → access denied/account unavailable
404 → record removed; refresh
409 → stale/conflict; reload
400/422 → validation
429 → rate-limit message
5xx → safe generic retry message
network → connection message
```

Never display raw stack traces or database messages.

---

## 14. Responsive Design

Test:

```text
360px
768px
1024px
1440px
```

Requirements:

- no horizontal overflow;
- mobile single-column forms;
- desktop two-column grouping where useful;
- readable cards;
- touch-friendly actions;
- usable mobile navigation;
- dialogs fit small screens;
- sticky actions never cover fields;
- long text wraps safely.

Visual direction:

```text
professional
clean
career-focused
high-trust
minimal clutter
```

Use the existing color, spacing, icons, and typography.

---

## 15. Required UI States

```text
auth loading
Candidate role required
profile loading
profile load failed
first-time profile
profile loaded
saving
saved
validation error
preferences loading/saving
education loading/empty/adding/editing/deleting/reordering
experience loading/empty/adding/editing/deleting/reordering
record not found
access denied
account unavailable
session expired
API unavailable
unexpected error
```

Every state must be visible and actionable.

---

## 16. Accessibility

Requirements:

- semantic heading hierarchy;
- linked labels;
- text indication of required fields;
- field-linked error summary;
- visible focus;
- keyboard-accessible actions;
- focus-managed dialogs and restoration;
- descriptive reorder labels;
- polite loading/save announcements;
- textual progress percentage;
- no color-only status;
- large touch targets;
- accessible dynamic-list buttons;
- clear date format;
- no drag-only interaction;
- screen-reader-friendly empty states.

---

## 17. Privacy and Security

Explicitly verify:

- no user/candidate IDs constructed in UI;
- no sensitive local/session storage;
- no profile payload in console or analytics;
- safe rendering of summary/description;
- no raw HTML injection;
- safe URL rendering;
- no backend error leakage;
- auth pages remain private;
- query cache cleared on logout;
- safe autocomplete attributes;
- date of birth, phone, and salary are not unnecessarily displayed in overview.

---

## 18. Tests

### API client

- correct actual routes;
- duplicate `/v1/v1` resolution;
- payloads;
- error normalization;
- no identity fields;
- auth integration.

### Overview

- loading;
- data;
- section status;
- completion;
- first-time state;
- error;
- navigation.

### Basic profile

- initial values;
- validation;
- save;
- server errors;
- duplicate prevention;
- unsaved warning;
- date-only behavior.

### Preferences

- load;
- backend-supported fields;
- decimal values;
- save/error;
- accessibility.

### Education

- list/empty;
- create/edit/delete;
- reorder;
- current-study;
- date validation;
- 404/conflict;
- keyboard controls.

### Experience

- list/empty;
- create/edit/delete;
- reorder;
- current-role;
- responsibilities/achievements;
- fresh-graduate empty state;
- keyboard controls.

### E2E

1. login;
2. open overview;
3. edit profile;
4. save preferences;
5. create/edit/reorder/delete Education;
6. create/edit/reorder/delete Experience;
7. reload and confirm persistence;
8. session-expiry handling;
9. API failure;
10. confirm no sensitive browser storage.

Run accessibility checks supported by the repository.

---

## 19. Manual Smoke Test

1. Start API and web.
2. Login as active Candidate.
3. Open `/profile`.
4. Verify real API data.
5. Edit and reload basic profile.
6. Edit preferences.
7. Add two Education records.
8. Reorder, edit, and delete Education.
9. Add two Experience records.
10. Reorder, edit, and delete Experience.
11. Verify current study/current role date behavior.
12. Test fresh-Candidate empty states.
13. Test mobile layout.
14. Test keyboard-only flow.
15. Test invalid forms.
16. Test expired session.
17. Confirm no profile data in storage/console.
18. Confirm unsupported sections are absent.
19. Confirm production build.
20. Confirm Git status.

---

## 20. Documentation

Create/update:

```text
docs/frontend/candidate-profile-ui.md
docs/api/candidate-profile.md
docs/task/status.md
README.md
```

Document:

- routes;
- components;
- API mapping;
- duplicate `v1` finding/correction;
- validation;
- cache invalidation;
- temporary completion behavior;
- supported sections;
- accessibility;
- missing backend sections;
- future extension points.

Do not claim missing UI sections are complete.

---

## 21. Expected Files

Adapt to actual structure:

```text
apps/web/app/(authenticated)/profile/
apps/web/src/features/candidate-profile/
apps/web/src/components/
packages/api-client/src/candidates/
packages/types/src/candidates/
packages/validation/src/candidates/
docs/frontend/candidate-profile-ui.md
docs/task/status.md
```

A required minimal route fix may also touch Candidate API controller/tests.

---

## 22. Implementation Order

1. Inspect repository and Swagger.
2. Confirm actual routes.
3. Run baseline.
4. Complete typed API client.
5. Create query hooks.
6. Build profile shell.
7. Build overview.
8. Build basic form.
9. Build preferences.
10. Build Education CRUD/reorder.
11. Build Experience CRUD/reorder.
12. Add responsive states.
13. Add error handling.
14. Add accessibility.
15. Add tests.
16. Run E2E/manual smoke.
17. Update docs/status.
18. Run final checks.
19. Stage only module files.
20. Create one commit.
21. Stop.

---

## 23. Verification Commands

Use actual scripts where different.

```bash
corepack enable
pnpm install --frozen-lockfile

pnpm --filter @nexthire/web lint
pnpm --filter @nexthire/web typecheck
pnpm --filter @nexthire/web test
pnpm --filter @nexthire/web test:e2e
pnpm --filter @nexthire/web build

pnpm lint
pnpm typecheck
pnpm test
pnpm build

git status --short
git diff --check
```

When the API route is corrected:

```bash
pnpm --filter @nexthire/api lint
pnpm --filter @nexthire/api typecheck
pnpm --filter @nexthire/api test
pnpm --filter @nexthire/api test:e2e
pnpm --filter @nexthire/api build
```

Also run responsive, accessibility, browser console, session, API-error, storage-privacy, and real API smoke checks.

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

---

## 24. Git Commit

Create exactly one commit only after all checks pass:

```text
feat(candidate-ui): build candidate profile interface [NH-MODULE-CANDIDATE-PROFILE-UI]
```

No unrelated changes. No commit when blocked or checks fail. Do not amend, rebase, squash, push, or tag.

---

## 25. Acceptance Criteria

### Integration

- [ ] Actual Profile API path confirmed.
- [ ] Duplicate `v1` handled centrally or corrected safely.
- [ ] Profile integrated.
- [ ] Preferences integrated.
- [ ] Education CRUD/reorder integrated.
- [ ] Experience CRUD/reorder integrated.
- [ ] No unsupported APIs invented.

### UI

- [ ] Overview.
- [ ] Basic edit.
- [ ] Preferences.
- [ ] Education CRUD/reorder.
- [ ] Experience CRUD/reorder.
- [ ] Responsive layout.
- [ ] All loading/empty/error states.
- [ ] Session/permission handling.
- [ ] Save feedback.

### Accessibility and privacy

- [ ] Keyboard operation.
- [ ] Labels/error summary.
- [ ] Dialog focus.
- [ ] Accessible reorder.
- [ ] No color-only status.
- [ ] No sensitive persistence/logging.
- [ ] Safe rendering.

### Quality and Git

- [ ] API-client tests.
- [ ] Component/form tests.
- [ ] CRUD/reorder tests.
- [ ] E2E.
- [ ] Accessibility checks.
- [ ] Responsive smoke.
- [ ] Lint/type-check/tests/build.
- [ ] Documentation.
- [ ] Exactly one correct commit.
- [ ] Hash reported.
- [ ] No commit when blocked.

---

## 26. Completion Report

Return:

```markdown
# Candidate Profile UI Completion Report

## Status

COMPLETED | BLOCKED

## Repository Findings

- Existing UI:
- Design system:
- Form/query stack:
- Actual API routes:
- Duplicate-v1 finding:
- Initial Git state:

## API Integration

- Profile:
- Preferences:
- Education:
- Experience:
- Route correction:

## UI

- Layout:
- Overview:
- Basic:
- Preferences:
- Education:
- Experience:
- Responsive states:

## Accessibility

- Keyboard:
- Labels/errors:
- Dialog focus:
- Reorder:
- Announcements:
- Checks:

## Privacy and Security

- Browser storage:
- Console/analytics:
- Safe rendering:
- Session:
- Identity fields:

## Tests

- API client:
- Components:
- Forms:
- Education:
- Experience:
- E2E:
- Accessibility:
- Manual smoke:

## Commands

- Web:
- API if changed:
- Root:
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

## Deferred UI

- Projects
- Skills
- Languages
- Certifications
- Training
- Achievements
- Professional links
- Profile photo
- Privacy/public profile
```

---

## 27. Definition of Done

The Candidate Profile UI is complete when an authenticated Candidate can use a responsive and accessible interface to view and update the existing Profile, Preferences, Education, and Work Experience APIs; CRUD and reorder workflows use real backend data; loading, validation, permission, session, and failure states are handled; no sensitive data is persisted or logged; tests/builds pass; documentation is updated; and one clean module-specific Git commit is created.

---

**End of Module — Candidate Profile UI**
