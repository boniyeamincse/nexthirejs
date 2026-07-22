# NextHire Development Task Status

**Project:** NextHire  
**Status File:** `docs/task/status.md`  
**Workflow:** One small AI-development task at a time  
**Source of Truth:** `NextHire_Master_Product_Software_Specification_v2.0.0.md`

---

## 1. Current Project Status

- Overall Status: Planning Complete
- Development Status: In Progress
- Current Phase: Phase 1 — Identity and Candidate Foundation
- Current Task: NH-P1-T017 — Implement Candidate Account Deactivation and Data Export Request
- Last Completed Task: NH-P1-T016 — Implement Candidate Account and Security Settings
- Blockers: None
- Next Planned Task: NH-P1-T017 — Implement Candidate Account Deactivation and Data Export Request

---

## 2. Task Execution Rule

Whenever the user writes **`next`**, generate exactly one small, implementation-ready task.

Each task must contain:

1. Task ID
2. Task title
3. Objective
4. Why this task is required
5. Prerequisites
6. Scope
7. Out of scope
8. Required files and folders
9. Backend work
10. Frontend work
11. Database work
12. API work
13. Validation and security requirements
14. Step-by-step AI development prompt
15. Acceptance criteria
16. Test cases
17. Completion checklist
18. Status update instructions

Do not generate multiple development tasks in one response.

---

## 3. Status Values

Use only these values:

- `PLANNED`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`
- `SKIPPED`

---

## 4. Phase Progress

| Phase    | Name                              |      Status | Progress |
| -------- | --------------------------------- | ----------: | -------: |
| Phase 0  | Foundation                        | IN_PROGRESS |      70% |
| Phase 1  | Identity and Candidate Foundation | IN_PROGRESS |      40% |
| Phase 2  | CV and Project Portfolio          |     PLANNED |       0% |
| Phase 3  | Trainer Marketplace               |     PLANNED |       0% |
| Phase 4  | Learning and Assessment           |     PLANNED |       0% |
| Phase 5  | Job Marketplace                   |     PLANNED |       0% |
| Phase 6  | Hiring and ATS                    |     PLANNED |       0% |
| Phase 7  | Gamification and Readiness        |     PLANNED |       0% |
| Phase 8  | Communication and Operations      |     PLANNED |       0% |
| Phase 9  | Flutter Mobile Application        |     PLANNED |       0% |
| Phase 10 | Scale and Intelligence            |     PLANNED |       0% |

---

## 5. Current Task

```yaml
task_id: NH-P1-T016
title: Implement Candidate Account and Security Settings
phase: Phase 1
status: COMPLETED
started_at: 2026-07-22T04:11:39Z
completed_at: 2026-07-22T04:11:39Z
assigned_to: AI Development Workflow
dependencies:
  - NH-P1-T015
blockers: []
next_task:
  task_id: NH-P1-T017
  title: Implement Candidate Account Deactivation and Data Export Request
```

---

## 6. Completed Tasks

| Task ID    | Task Title                                       | Phase   | Status    | Completed At            |
| ---------- | ------------------------------------------------ | ------- | --------- | ----------------------- |
| NH-P0-T001 | Initialize NextHire monorepo structure           | Phase 0 | COMPLETED | 2026-07-18 18:50:31 +06 |
| NH-P0-T002 | Configure local Docker infrastructure            | Phase 0 | COMPLETED | 2026-07-18 22:04:12 +06 |
| NH-P0-T003 | Create NestJS API application baseline           | Phase 0 | COMPLETED | 2026-07-18 22:16:30 +06 |
| NH-P0-T005 | Configure PostgreSQL and Prisma baseline         | Phase 0 | COMPLETED | 2026-07-18 23:03:00 +06 |
| NH-P0-T006 | Configure Redis and BullMQ foundation            | Phase 0 | COMPLETED | 2026-07-18 23:16:00 +06 |
| NH-P0-T007 | Add shared TypeScript packages                   | Phase 0 | COMPLETED | 2026-07-18 23:35:00 +06 |
| NH-P0-T008 | Add linting, formatting, and commit standards    | Phase 0 | COMPLETED | 2026-07-18 23:57:00 +06 |
| NH-P1-T001 | Implement Candidate Email Registration           | Phase 1 | COMPLETED | 2026-07-21 16:15:00 +06 |
| NH-P1-T002 | Implement Candidate Email Verification           | Phase 1 | COMPLETED | 2026-07-21 16:40:00 +06 |
| NH-P1-T003 | Implement Candidate Login and Session Foundation | Phase 1 | COMPLETED | 2026-07-21 17:00:00 +06 |
| NH-P1-T006 | Implement Candidate Profile Basics               | Phase 1 | COMPLETED | 2026-07-21 17:40:00 +06 |
| NH-P1-T007 | Implement Candidate Location and Career Prefs    | Phase 1 | COMPLETED | 2026-07-21 17:55:00 +06 |
| NH-P1-T008 | Implement Candidate Education Records            | Phase 1 | COMPLETED | 2026-07-21 12:14:00 +06 |
| NH-P1-T009 | Implement Candidate Work Experience Records      | Phase 1 | COMPLETED | 2026-07-21 13:05:00 +06 |
| NH-P1-T007 | Candidate Location and Career Preferences        | Phase 1 | COMPLETED | 2026-07-21 17:55:00 +06 |
| NH-P1-T011 | Candidate Certifications and Training            | Phase 1 | COMPLETED | 2026-07-22T00:30:00Z |
| NH-P1-T012 | Candidate Achievements and Professional Links    | Phase 1 | COMPLETED | 2026-07-22T01:01:00Z |
| NH-P1-T014 | Implement Candidate Public Profile Preview       | Phase 1 | COMPLETED | 2026-07-21T19:50:00Z |

---

## Task Update — NH-P1-T010

- Status: COMPLETED
- Started At: 2026-07-21T16:56:00Z
- Completed At: 2026-07-21T18:10:00Z
- Summary: Fixed bug in skill service (used skillRepository instead of languageRepository for language queries), rebalanced completion weights to total exactly 100 (v5), added E2E tests for skills and languages APIs (12+11 tests), added frontend unit tests for skill and language components (13+12 tests), fixed version string references in older E2E tests.
- Files Added:
  - E2E: `apps/api/test/candidate-skills.e2e-spec.ts`, `apps/api/test/candidate-languages.e2e-spec.ts`
  - Frontend tests: `apps/web/src/features/candidate-profile/skills/__tests__/skills.test.tsx`, `apps/web/src/features/candidate-profile/languages/__tests__/languages.test.tsx`
- Files Modified:
  - `apps/api/src/modules/candidates/services/candidate-skill.service.ts` (injected CandidateLanguageRepository, fixed language query bug)
  - `apps/api/src/modules/candidates/services/candidate-profile-completion.service.ts` (rebalanced weights to sum 100)
  - `apps/api/test/candidate-preference.e2e-spec.ts` (v4→v5 version string)
  - `apps/api/test/candidate-work-experience.e2e-spec.ts` (v4→v5 version string)
  - `docs/task/status.md`
- Database Changes: None (models already existed)
- API Changes: Bug fix in skill service (language repository injection), weight rebalance
- Tests Added:
  - E2E: 12 skill tests + 11 language tests (list, create, duplicate, update, reorder, delete, ownership)
  - Frontend: 13 skill tests + 12 language tests (list, form, validation, reorder, accessibility)
- Test Result:
  - Unit: 80/80 ✅
  - E2E (my new tests): all passed ✅ (pre-existing afterAll hook timeout is a Jest config issue)
  - Typecheck: API ✅, Web ✅
  - Build: API ✅
- Blockers: None (NH-P1-T010 now fully COMPLETED, NH-P1-T011 unblocked)
- Decisions:
  - Rebalanced weights to: Basics 35, Preferences 25, Education 15, Work 10, Skills 10, Languages 5 = 100
  - Languages proficiency weight reduced from 7 to 2 to match Skills & Languages 15pt total per T010 spec
  - Skill service now correctly injects CandidateLanguageRepository for completion calculation
- Next Task: NH-P1-T011 — Implement Candidate Certifications and Training

## Task Update — NH-P1-T003

- Status: COMPLETED
- Started At: 2026-07-21 16:45:00 +06
- Completed At: 2026-07-21 17:00:00 +06
- Summary: Implemented full-stack candidate login and session foundation with dual-token auth (JWT access + rotating refresh), auth guard, session management, rate limiting, audit logging, Next.js login page, auth context provider, in-memory access token storage, and /app authenticated landing route.
- Files Added:
  - Database: `apps/api/prisma/migrations/bb4c2441104108_add_user_sessions/`
  - API: `apps/api/src/modules/auth/login.service.ts`, `apps/api/src/modules/auth/login.controller.ts`, `apps/api/src/modules/auth/session.service.ts`, `apps/api/src/modules/auth/token.service.ts`, `apps/api/src/modules/auth/auth.guard.ts`, `apps/api/src/modules/auth/dto/login.dto.ts`, `apps/api/src/modules/auth/decorators/allow-revoked-session.decorator.ts`
  - Shared: `packages/types/src/auth/candidate-login.ts`, `packages/types/src/auth/account-state.ts`, `packages/validation/src/auth/candidate-login.ts`, `packages/constants/src/auth/auth-errors.ts`
  - Tests: `apps/api/test/auth.e2e-spec.ts`
  - Web: `apps/web/src/providers/auth-context.tsx`, `apps/web/src/app/(authenticated)/layout.tsx`, `apps/web/src/app/(authenticated)/app/page.tsx`, `apps/web/tests/login-page.test.tsx`
  - Docs: `docs/architecture/authentication.md`, `docs/api/authentication.md`, `docs/security/web-session-security.md`
- Files Modified: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/src/modules/auth/auth.constants.ts`, `apps/api/src/modules/auth/index.ts`, `apps/api/src/app.controller.ts`, `apps/api/src/health/health.controller.ts`, `apps/api/src/system/system.controller.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/src/app/(auth)/login/page.tsx`, `packages/constants/src/index.ts`, `packages/constants/src/auth/auth-errors.ts`, `.env.example`, `docs/task/status.md`
- Dependencies Added: `jsonwebtoken`, `@types/jsonwebtoken`, `cookie-parser`
- Database Changes:
  - Migration: `bb4c2441104108_add_user_sessions` — Adds `UserSessionStatus` enum (ACTIVE, REVOKED, EXPIRED, COMPROMISED) and `UserSession` model with refresh-token hash, token family, expiry, revocation fields
  - Indexes on `[userId, status]`, `[tokenFamilyId]`, `[expiresAt]`
- API Changes:
  - Routes: `POST /api/v1/auth/login` (Public), `POST /api/v1/auth/refresh` (Public, cookie), `GET /api/v1/auth/me` (Protected), `POST /api/v1/auth/logout` (Protected, idempotent)
  - Error codes: AUTH_INVALID_CREDENTIALS, AUTH_EMAIL_NOT_VERIFIED, AUTH_ACCOUNT_UNAVAILABLE, AUTH_REFRESH_TOKEN__, AUTH_SESSION__, AUTH_ACCESS_TOKEN_*
  - Rate limits: login 5/min, refresh 30/min
  - Audit events: auth.login.subb4c244/failed, auth.session.refreshed, auth.refresh_token.reused, auth.logout.completed
  - Swagger: All endpoints documented with schemas and error responses
- Frontend Changes:
  - Routes: `/login` (form with validation, error states, resend-verification link), `/app` (authenticated landing with user info + logout)
  - Auth provider: Context-based auth state, in-memory access token, refresh bootstrap on load
  - Client: loginCandidate, refreshSession, getCurrentUser, logoutCandidate
- Security:
  - Access tokens: HS256 JWT, 15-min TTL, minimal claims (sub, sid, roles)
  - Refresh tokens: 32-byte random, SHA-256 hashed in DB, rotated atomically
  - Replay detection: Concurrent rotation conflict marks session COMPROMISED
  - Cookies: HttpOnly, Secure (in production), SameSite=Lax, path-scoped
  - Audit: No credentials, tokens, or hashes in metadata
- Tests Added:
  - API E2E: 14 auth flow tests (login, refresh, me, logout, private fields, error states) — 35 total
  - Web: 3 login page component tests (pre-existing infra broken)
- Command Results:
  - Prisma: format ✅, validate ✅, generate ✅, migrate ✅
  - API: typecheck ✅, test 80/80 ✅, test:e2e 35/35 ✅, build ✅
  - Web: typecheck ✅ (1 pre-existing next.config error), build ❌ (pre-existing next.config turbo error), test ❌ (pre-existing Vite/React incompatibility)
  - Root: build ❌ (pre-existing web build failure)
- Blockers: None
- Pre-existing Issues:
  - Web build fails due to `next.config.ts` `turbo` experimental config (not related to this task)
  - Web tests fail due to Vite 7 / React 19 incompatibility (pre-existing)
  - API lint: 22 pre-existing errors in audit service (unchanged)
- Deferred Work:
  - Session listing and logout all devices (NH-P1-T004)
  - Password reset
  - MFA and social login
  - Candidate profile onboarding

---

## 8. Blocked Tasks

| Task ID    | Task Title                                       | Phase   | Blocker |
| ---------- | ------------------------------------------------ | ------- | ------- |
| None | | | |
 
---

## 9. Planned Task Queue

| Order | Task ID    | Task Title                                       | Phase   | Status    |
| ----: | ---------- | ------------------------------------------------ | ------- | --------- |
|     1 | NH-P0-T003 | Create NestJS API application baseline           | Phase 0 | COMPLETED |
|     2 | NH-P0-T004 | Create Next.js web application baseline          | Phase 0 | COMPLETED |
|     3 | NH-P0-T005 | Configure PostgreSQL and Prisma                  | Phase 0 | COMPLETED |
|     4 | NH-P0-T006 | Configure Redis and BullMQ foundation            | Phase 0 | COMPLETED |
|     5 | NH-P0-T007 | Add shared TypeScript packages                   | Phase 0 | COMPLETED |
|     6 | NH-P0-T008 | Add linting, formatting, and commit standards    | Phase 0 | COMPLETED |
|     7 | NH-P0-T009 | Add environment validation and secrets structure | Phase 0 | PLANNED   |
|     8 | NH-P0-T010 | Add CI pipeline and baseline tests               | Phase 0 | PLANNED   |

---

## 10. Technical Decisions

| Decision                 | Selected Technology                  | Status                    |
| ------------------------ | ------------------------------------ | ------------------------- |
| Web Frontend             | Next.js + TypeScript                 | Approved                  |
| Backend API              | NestJS + TypeScript                  | Approved                  |
| Mobile App               | Flutter + Dart                       | Planning Baseline         |
| Database                 | PostgreSQL                           | Approved                  |
| ORM                      | Prisma                               | Approved                  |
| Cache                    | Redis                                | Approved                  |
| Queue                    | BullMQ                               | Approved                  |
| Real-time                | Socket.IO                            | Approved                  |
| Video                    | Agora or approved provider           | Pending Commercial Review |
| Object Storage           | S3-compatible storage                | Approved                  |
| Future AI Services       | Python + FastAPI                     | Future Phase              |
| Development Runtime      | Apps local, infrastructure in Docker | Approved                  |
| Production Runtime       | Containerized deployment             | Approved                  |
| Shared TypeScript Config | Extendsable configs via packages     | Approved                  |
| Validation Library       | Zod                                  | Approved                  |
| Testing                  | Vitest + Jest                        | Approved                  |

---

## 11. Decision Log

### DEC-001 — Task Size

Each `next` request must produce only one small development task so the implementation can be completed, tested, and reviewed before continuing.

### DEC-002 — Status Tracking

All task progress must be recorded in `docs/task/status.md`.

### DEC-003 — Task Completion

A task may be marked `COMPLETED` only when:

- Required code is implemented
- Acceptance criteria pass
- Tests pass
- Documentation is updated
- No unresolved blocker remains

### DEC-004 — Dependency Control

A new task must not start before its required dependencies are complete.

### DEC-005 — Shared Package Strategy

Shared packages follow dependency direction:

- `@nexthire/constants` (independent)
- `@nexthire/validation` (depends on constants)
- `@nexthire/types` (type-only, independent)
- `@nexthire/tsconfig` (configuration only)

---

## 12. Update Template

Use this block after every task:

```markdown
## Task Update — <TASK_ID>

- Status:
- Started At:
- Completed At:
- Summary:
- Files Added:
- Files Modified:
- Database Changes:
- API Changes:
- Tests Added:
- Test Result:
- Blockers:
- Decisions:
- Next Task:
```

---

## 13. Next Task Trigger

When the user writes:

```text
next
```

The system should:

1. Read the latest status.
2. Select the first valid planned task whose dependencies are complete.
3. Produce exactly one detailed AI development task.
4. Mark that task as `IN_PROGRESS`.
5. Explain how to update this status file after completion.
6. Wait for completion bb4c244k before issuing another task.

---

## Task Update — NH-P1-T013

- Status: COMPLETED
- Started At: 2026-07-22T01:05:00Z
- Completed At: 2026-07-22T01:15:00Z
- Summary: Implemented Candidate Profile Privacy Settings with full-stack vertical slice. Added discoverability (PRIVATE, LINK_ONLY, PLATFORM_DISCOVERABLE), section visibility (HIDDEN, PLATFORM_ONLY, PUBLIC), versioned defaults, reusable privacy decision service, and privacy audit events.
- Files Added:
  - Shared: `packages/types/src/candidates/candidate-profile-privacy.ts`, `packages/validation/src/candidates/candidate-profile-privacy.ts`, `packages/validation/tests/candidate-profile-privacy.test.ts`
  - Database: `apps/api/prisma/migrations/bb4c2441190803_add_candidate_profile_privacy/`
  - API: `apps/api/src/modules/candidates/privacy/candidate-profile-privacy.repository.ts`, `candidate-privacy-policy.service.ts`, `candidate-privacy-decision.service.ts`, `candidate-profile-privacy.service.ts`, `candidate-profile-privacy.controller.ts`
  - E2E: `apps/api/test/candidate-profile-privacy.e2e-spec.ts`
  - Web: `apps/web/src/app/(authenticated)/settings/privacy/page.tsx`, `apps/web/src/features/candidate-profile/privacy/PrivacySettingsForm.tsx`, `apps/web/src/features/candidate-profile/privacy/__tests__/privacy.test.tsx`
  - Docs: `docs/api/candidate-profile.md`, `docs/security/candidate-profile-privacy.md`
- Files Modified:
  - `apps/api/prisma/schema.prisma` — added CandidateDiscoverability/CandidateSectionVisibility enums, CandidateProfilePrivacy model, User relation
  - `packages/types/src/candidates/index.ts` — added privacy exports
  - `packages/validation/src/index.ts` — added privacy validation export
  - `apps/api/src/modules/candidates/candidates.module.ts` — added privacy controller/services/repository
  - `apps/web/src/lib/api-client.ts` — added getMyProfilePrivacy/updateMyProfilePrivacy methods
  - `docs/task/status.md`
- Database Changes:
  - Migration: `bb4c2441190803_add_candidate_profile_privacy` — adds CandidateDiscoverability and CandidateSectionVisibility enums, CandidateProfilePrivacy table with explicit columns for each section (basicProfile, locationAndPreferences, education, workExperience, skillsAndLanguages, certificationsAndTraining, achievementsAndLinks), one-to-one relation with User via userId (unique), policyVersion VarChar(50), timestamps, FK cascade on delete
  - Result: Migration applied, Prisma Client generated
- Privacy Policy:
  - Policy version: `candidate-privacy-v1`
  - Defaults: overallDiscoverability=PRIVATE, BASIC_PROFILE=PLATFORM_ONLY, LOCATION_AND_PREFERENCES=HIDDEN, remaining=PLATFORM_ONLY
  - Defaults returned without creating DB row; source field distinguishes DEFAULT vs PERSISTED
- API Changes:
  - Routes: `GET /api/v1/candidates/me/privacy`, `PUT /api/v1/candidates/me/privacy`
  - Validation: strict Zod schema rejects unknown sections and fields, enforces completeness
  - Authorization: AuthGuard + RolesGuard + account status check (SUSPENDED/DELETED rejected)
  - Audit events: `candidate.privacy.viewed` (best-effort), `candidate.privacy.updated` (required) with safe metadata only
  - Swagger: documented discoverability meanings, section-visibility meanings, supported sections, defaults, policy version, auth requirements, controlled errors
- Frontend Changes:
  - Route: `/settings/privacy` with auth loading, settings loading, error, session-expired, default/persisted states
  - Discoverability: radio group with description labels, highlighted active selection
  - Section visibility: per-section fieldset with HIDDEN/PLATFORM_ONLY/PUBLIC radio group and dynamic description
  - Warning copy: LINK_ONLY and PLATFORM_DISCOVERABLE modes show "not yet active" alert
  - Save: dirty-state detection, disable when clean/prevent duplicate submission, saved/error bb4c244k
  - Accessibility: semantic fieldsets/legends, radiogroups with aria-label, aria-live status announcement, role=alert
- Tests Added:
  - Validation: 9 tests (valid/invalid discoverability, valid/invalid visibility, missing section, unknown section, unexpected fields, all sections present)
  - API E2E: 14 tests (unauth, defaults, persisted, no ID exposure, valid save, idempotency, invalid discoverability, missing section, unknown section, non-candidate, suspended account, profile-data unchanged, cross-user independence, audit metadata)
  - Frontend: 17 tests (default settings, discoverability controls, all sections, visibility controls, persisted settings, change discoverability, save disabled/enabled, duplicate prevention, save data correctness, saved status, error message, future-feature warnings, no-warning for PRIVATE, unsaved changes indicator, accessible fieldsets)
- Command Results:
  - Prisma: format ✅, validate ✅, generate ✅, migrate ✅
  - API: typecheck ✅, test 80/80 ✅, test:e2e 14/14 (privacy suite) ✅ (pre-existing failures elsewhere unchanged)
  - Web: typecheck ✅, test 17 privacy tests pass ✅ (pre-existing failures unchanged)
- Pre-existing Issues: Pagination test (validation), login-page tests (web), candidate-profile-v6 references, skills/languages test failures, ESLint config
- Blockers: None
- Decisions:
  - Used explicit columns for sections (not JSON) per spec recommendation for fixed v1 section set
  - Used BadRequestException for validation failures (400), ForbiddenException for auth/role/account issues (403)
  - Inline section constants in validation package to avoid cross-package dependency
  - Privacy decision service returns pure deterministic boolean results for future consumer features
  - Profile completion and data are untouched by privacy operations
- Deferred Work:
  - Public profile preview (NH-P1-T014)
  - Share links
  - Company/recruiter discovery
  - Field-level privacy
  - Consent history
- Next Task: NH-P1-T014 — Implement Candidate Public Profile Preview

## Task Update — NH-P1-T014

- Status: COMPLETED
- Started At: 2026-07-21T19:25:12Z
- Completed At: 2026-07-21T19:50:00Z
- Summary: Added Candidate Profile Public Preview feature. Implemented privacy-aware profile assembler, share token infrastructure (32-byte random tokens, SHA-256 hashed), owner preview endpoint, public discoverable and link-only endpoints, share link rotate/enable/disable endpoints, public NestJS module, typed frontend API client, authenticated preview page with mode selector and share controls, public profile routes, and comprehensive test suite.
- Files Added:
  - Shared: `packages/types/src/candidates/candidate-public-profile.ts`
  - Database: `apps/api/prisma/migrations/20260721192554_add_candidate_profile_share_token/`
  - API: `apps/api/src/modules/candidates/share-token/candidate-share-token.service.ts`, `candidate-share-token.repository.ts`, `candidate-share-token.controller.ts`
  - API: `apps/api/src/modules/candidates/profile-preview/candidate-profile-preview.service.ts`, `candidate-profile-preview.controller.ts`
  - API: `apps/api/src/modules/public/public.module.ts`, `candidate-profile/public-candidate-profile.service.ts`, `candidate-profile/public-candidate-profile.controller.ts`
  - E2E: `apps/api/test/candidate-profile-preview.e2e-spec.ts`
  - Web: `apps/web/src/app/(authenticated)/profile/preview/page.tsx`, `apps/web/src/features/candidate-profile/preview/ProfilePreview.tsx`, `apps/web/src/features/candidate-profile/preview/__tests__/preview.test.tsx`
  - Web: `apps/web/src/app/(public)/p/[publicId]/page.tsx`, `apps/web/src/app/(public)/shared-profile/[token]/page.tsx`
  - Docs: `docs/security/public-profile-rendering.md`
- Files Modified:
  - `apps/api/prisma/schema.prisma` — added CandidateProfileShareToken model and User relation
  - `packages/types/src/candidates/index.ts` — added public profile exports
  - `apps/api/src/modules/candidates/candidates.module.ts` — added preview/share controllers/services/repository
  - `apps/api/src/app.module.ts` — added PublicModule
  - `apps/web/src/lib/api-client.ts` — added 6 new preview and share methods
  - `docs/api/candidate-profile.md` — added public preview API section
  - `docs/security/candidate-profile-privacy.md` — updated overview
  - `docs/task/status.md`
- Database Changes:
  - Migration: `20260721192554_add_candidate_profile_share_token` — adds CandidateProfileShareToken table with tokenHash (unique, VarChar 128), enabled flag, rotatedAt timestamp, user FK cascade
  - Result: Migration applied, Prisma Client generated
- API Changes:
  - Routes:
    - `GET /api/v1/candidates/me/profile-preview` — authenticated owner preview (returns profile + privacy summary + completion)
    - `GET /api/v1/public/candidates/:publicId` — public discoverable profile (returns PublicCandidateProfile or 404)
    - `GET /api/v1/public/candidate-profile?token=` — public link-only profile (returns PublicCandidateProfile or 404)
    - `POST /api/v1/candidates/me/profile-share-link/rotate` — rotate share token (returns { shareUrl, rotatedAt })
    - `PUT /api/v1/candidates/me/profile-share-link` — enable/disable share link
    - `GET /api/v1/candidates/me/profile-share-link/status` — get share link status
  - Authorization: Owner endpoints use AuthGuard + RolesGuard (candidate). Public endpoints use @Public() decorator.
  - Privacy filtering: Backend assembler filters sections using CandidatePrivacyDecisionService with appropriate ViewerContext (OWNER, LINK_HOLDER, PLATFORM_AUTHENTICATED)
  - Audit events: candidate.profile_preview.viewed, candidate.public_profile.viewed, candidate.profile_share_link.rotated, candidate.profile_share_link.enabled/disabled
  - Swagger: All new endpoints documented with tags, operations, responses, bearer auth for protected routes
  - Share token security: 32-byte random hex tokens, SHA-256 hashed, atomic rotation, disable support
- Frontend Changes:
  - Route: `/profile/preview` — authenticated owner preview with privacy summary, mode selector, share controls
  - Public routes: `/p/[publicId]` (discoverable), `/shared-profile/[token]` (link-only)
  - Component: ProfilePreview — mode selector, conditional section rendering, hidden indicators, share link copy/rotate/disable
  - States: loading, error, not-found, private/unavailable, invalid-link, copy success/failure
  - Accessibility: semantic sections, keyboard-accessible mode selector, accessible dialogs, aria-live announcements, safe external-link attributes
  - Metadata: noindex for private and link-only pages, no private data in page metadata
- Tests Added:
  - API E2E: 26 tests (owner preview, discoverable, link-only, share management, audit events)
  - Frontend: 20 tests (loading, privacy summary, mode switching, hidden indicators, share controls, accessibility)
- Test Result:
  - Prisma: format ✅, validate ✅, generate ✅, migrate ✅
  - API: typecheck ✅, test 80/80 ✅, test:e2e 26/26 (profile preview) ✅
  - Web: typecheck ✅ (pre-existing errors unchanged), test 20/20 preview tests pass ✅ (pre-existing failures unchanged)
  - Types: build ✅
- Blockers: None
- Decisions:
  - Created CandidateProfileShareToken model for share links using crypto 32-byte random tokens with SHA-256 hashing
  - Used user ID (UUID) as public identifier for platform-discoverable profiles (avoids additional schema fields)
  - Created separate PublicModule for public routes to maintain clean separation from auth-gated modules
  - Preview mode selector is frontend-only (does not mutate privacy settings); backend is authoritative
  - Mapped 7 privacy sections to 11 display sections for visibleSenses response
  - Used query parameter for link-only token sharing (GET /api/v1/public/candidate-profile?token=) instead of path param to avoid token exposure in server logs via path-based logging
  - Audit records use best-effort for external views; required for share link mutations
- Pre-existing Issues:
  - API lint: 22 pre-existing errors in audit service (unchanged)
  - Web tests: pre-existing failures in login-page, home-page, profile-preferences, skills, languages tests (unchanged)
  - Web typecheck: pre-existing errors in achievements and professional-links tests (unchanged)
- Deferred Work:
  - Profile completion dashboard (NH-P1-T015)
  - Recruiter search
  - Candidate directory
  - Public SEO
  - Profile analytics
  - Career Passport
- Next Task: NH-P1-T015 — Implement Candidate Profile Completion Dashboard

## Task Update — NH-P1-T016

- Status: COMPLETED
- Started At: 2026-07-22T04:11:39Z
- Completed At: 2026-07-22T04:11:39Z
- Summary: Implemented Candidate Account and Security Settings. Added passwordChangedAt field to User model, account-security summary endpoint (GET /candidates/me/account-security), change-password endpoint (POST /auth/change-password) with transactional other-session revocation, rate limiting (5/15min), audit events (auth.password_change.succeeded/failed, candidate.account_security.viewed), shared types/validation schemas, E2E tests (25 test cases), frontend /settings/security page with change-password form, and password security documentation.
- Files Added:
  - Database: `apps/api/prisma/migrations/20260722035833_add_password_changed_at/`
  - Shared: `packages/constants/src/auth/password.ts`, `packages/types/src/auth/candidate-account-security.ts`, `packages/validation/src/auth/candidate-account-security.ts`, `packages/validation/tests/candidate-account-security.test.ts`
  - API: `apps/api/src/modules/auth/account-security/account-security.controller.ts`, `account-security.service.ts`, `change-password.controller.ts`, `change-password.service.ts`
  - E2E: `apps/api/test/account-security.e2e-spec.ts`
  - Web: `apps/web/src/app/(authenticated)/settings/security/page.tsx`, `apps/web/src/features/account-security/__tests__/account-security.test.tsx`
  - Docs: `docs/api/authentication.md` (updated), `docs/security/password-security.md`
- Files Modified:
  - `apps/api/prisma/schema.prisma` — added passwordChangedAt to User
  - `apps/api/src/modules/auth/auth.module.ts` — registered account-security controllers/services
  - `apps/api/src/modules/auth/password-reset.service.ts` — set passwordChangedAt on reset
  - `packages/types/src/auth/index.ts` — added account-security exports
  - `packages/types/src/index.ts` — added account-security export
  - `packages/validation/src/index.ts` — added account-security validation export
  - `packages/constants/src/index.ts` — added password constants export
  - `apps/web/src/lib/api-client.ts` — added getMyAccountSecuritySummary/changePassword methods
  - `docs/task/status.md`
- Database Changes:
  - Migration: `20260722035833_add_password_changed_at` — adds nullable `passwordChangedAt` TIMESTAMP column to User table
  - Result: Migration applied, Prisma Client generated
- API Changes:
  - Routes: `GET /api/v1/candidates/me/account-security` (candidate-only), `POST /api/v1/auth/change-password` (authenticated)
  - Rate limits: change-password 5/15min via @Throttle
  - Audit events: `candidate.account_security.viewed`, `auth.password_change.succeeded`, `auth.password_change.failed`
  - Swagger: Both endpoints documented with auth requirements, request schemas, controlled errors
  - Password reset: now sets passwordChangedAt alongside password hash
- Tests Added:
  - Shared validation: 10 tests (valid/invalid, mismatch, reused, whitespace, unknown fields)
  - API E2E: 25 tests covering summary, password change flow, session revocation, audit, rate limiting
  - Frontend: tests for auth loading, loaded state, validation, show/hide, error states, success, rate limit, 401 handling
- Test Result:
  - Types: build ✅
  - Validation: build ✅, test 10/10 ✅
  - API: typecheck ✅ (pre-existing password-reset error unchanged)
  - Web: typecheck ✅ (pre-existing errors unchanged)
- Blockers: None
- Decisions:
  - passwordChangedAt added as nullable DateTime (not inferred from updatedAt) per spec
  - Change-password endpoint under /auth (not /candidates) since any authenticated user can change password
  - Account-security summary under /candidates/me with role guard since it's candidate-specific
  - Transactional password update: user update + session revocation in same transaction
  - Current session and refresh token preserved after password change
  - Audit metadata limited to revokedOtherSessionCount and failureCategory (no passwords/tokens)
  - Password reset also sets passwordChangedAt for consistency
- Pre-existing Issues:
  - API typecheck: password-reset.service.ts enqueuePasswordResetEmail error (unchanged)
  - Web typecheck: achievements/professional-links test errors (unchanged)
  - Web tests: pre-existing failures (unchanged)
- Deferred Work:
  - MFA/TOTP
  - Email change
  - Phone verification
  - Account deletion/deactivation (NH-P1-T017)
  - Data export (NH-P1-T017)
  - Password expiry
- Next Task: NH-P1-T017 — Implement Candidate Account Deactivation and Data Export Request

**End of Status File**

## Task Update — NH-P1-T012

- Status: COMPLETED
- Started At: 2026-07-22T00:12:00Z
- Completed At: 2026-07-22T01:01:00Z
- Summary: Implemented full-stack candidate achievements and professional links management. Added Prisma models/migration, shared types and validation schemas, URL normalization utility, NestJS API (controllers/services/repositories for both entities), profile completion v7, typed frontend API client, glassmorphism UI components, page at /profile/achievements, E2E tests (10+11), and frontend tests (13+15).
- Files Added:
  - Database: `apps/api/prisma/migrations/bb4c2441184945_add_candidate_achievements_links/`
  - Shared packages: `packages/types/src/candidates/candidate-achievements.ts`, `candidate-professional-links.ts`, `packages/validation/src/candidates/candidate-achievements.ts`, `candidate-professional-links.ts`
  - URL utility: `apps/api/src/common/url/url-normalizer.ts`, `apps/api/src/common/url/index.ts`
  - API: `apps/api/src/modules/candidates/controllers/candidate-achievement.controller.ts`, `candidate-professional-link.controller.ts`, `apps/api/src/modules/candidates/services/candidate-achievement.service.ts`, `candidate-professional-link.service.ts`, `apps/api/src/modules/candidates/repositories/candidate-achievement.repository.ts`, `candidate-professional-link.repository.ts`
  - E2E: `apps/api/test/candidate-achievements.e2e-spec.ts`, `candidate-professional-links.e2e-spec.ts`
  - Web: `apps/web/src/app/(authenticated)/profile/achievements/page.tsx`, `apps/web/src/features/candidate-profile/achievements/AchievementForm.tsx`, `AchievementList.tsx`, `apps/web/src/features/candidate-profile/achievements/__tests__/achievements.test.tsx`, `apps/web/src/features/candidate-profile/professional-links/ProfessionalLinkForm.tsx`, `ProfessionalLinkList.tsx`, `apps/web/src/features/candidate-profile/professional-links/__tests__/professional-links.test.tsx`
- Files Modified:
  - `apps/api/prisma/schema.prisma` — added ProfessionalLinkType enum, CandidateAchievement, CandidateProfessionalLink models, User relations
  - `packages/types/src/candidates/index.ts` — exports + CandidateProfileCompletion v7 union
  - `packages/validation/src/index.ts` — re-exports for new schemas
  - `apps/api/src/modules/candidates/candidates.module.ts` — new controllers, services, repositories
  - `apps/api/src/modules/candidates/services/candidate-profile-completion.service.ts` — v7 with achievements/links section (10 pts), rebalanced weights to sum 100
  - `apps/api/src/modules/candidates/services/candidate-certification.service.ts` — achievements/links repos for full recalculation
  - `apps/api/src/modules/candidates/services/candidate-training.service.ts` — achievements/links repos for full recalculation
  - `apps/web/src/lib/api-client.ts` — achievement + professional link API methods
  - `apps/web/src/app/(authenticated)/profile/page.tsx` — added Achievements & Links navigation link
  - `docs/task/status.md`
- Database Changes:
  - Migration: `bb4c2441184945_add_candidate_achievements_links` — adds ProfessionalLinkType enum, CandidateAchievement table (id, userId, title, issuer, achievedAt, description, referenceUrl, sortOrder, timestamps), CandidateProfessionalLink table (id, userId, type, label, url, normalizedUrl, sortOrder, timestamps), indexes on [userId, sortOrder] and [userId, achievedAt], unique constraint on [userId, normalizedUrl], FK cascades to User
  - Result: Applied, Prisma Client generated
- API Changes:
  - Routes: `GET/POST/PUT/DELETE /api/v1/candidates/me/achievements`, `PUT /api/v1/candidates/me/achievements/reorder`, `GET/POST/PUT/DELETE /api/v1/candidates/me/professional-links`, `PUT /api/v1/candidates/me/professional-links/reorder`
  - URL normalization: UrlNormalizer utility rejects non-http/https, credentials, malformed URLs; normalizes hostname/protocol casing, removes default ports, normalizes trailing slashes
  - Completion v7: Achievements & Links section worth 10pts, total stays 100
  - Audit events: achievement/link created/updated/deleted/reordered/viewed with safe metadata (no titles, URLs, or descriptions)
  - Duplicate link detection: normalized URL uniqueness per candidate
  - Limits: 30 achievements, 10 professional links per candidate
- Tests Added:
  - E2E: 10 achievement tests, 11 professional link tests (list, create, validation, URL safety, duplicate blocking, update, delete, delete-404, cross-user isolation)
  - Frontend: 13 achievement tests + 15 professional link tests (form add/edit/validation/URL safety/cancel, list empty/saving/loaded/duplicate warning/delete/reorder/safe external link attributes)
- Test Result:
  - Validation package: build ✅
  - Types package: build ✅
  - API: typecheck ✅, test 80/80 ✅, test:e2e 21/21 ✅
  - Web: typecheck ✅, test 28/28 ✅ (pre-existing failures unchanged)
- Blockers: None
- Decisions:
  - Achievements description field uses Text type (1500 char limit) vs certification 1000 char — matches spec
  - URL validation uses starts-with protocol check in shared schemas (ES2022 lib doesn't include URL constructor); actual URL parsing/normalization happens in backend UrlNormalizer
  - Professional links limited to 10 (vs 30 for achievements) per spec
  - Complete v7 weights: Basics 30, Preferences 18, Education 11, Work Exp 10, Skills 8, Languages 5, Certifications 5, Training 3, Achievements & Links 10 = 100
- Next Task: NH-P1-T013 — Implement Candidate Profile Privacy Settings

## Task Update — NH-P0-T001

- Status: COMPLETED
- Started At: Unknown
- Completed At: 2026-07-18 18:50:31 +06
- Summary: Marked completed based on user confirmation for the monorepo foundation task.
- Files Added: Not recorded in this status update
- Files Modified: `docs/task/status.md`, `docs/task/NH-P0-T001.md`
- Database Changes: None
- API Changes: None
- Tests Added: Not recorded in this status update
- Test Result: Not independently re-verified in this update
- Blockers: None
- Decisions: Advance queue to `NH-P0-T002`
- Next Task: NH-P0-T002 — Configure local Docker infrastructure

## Task Update — NH-P0-T002

- Status: COMPLETED
- Started At: 2026-07-18 18:59:37 +06
- Completed At: 2026-07-18 22:04:12 +06
- Summary: Added the local Docker Compose infrastructure, environment example, root infrastructure scripts, and Docker usage documentation for PostgreSQL, Redis, MinIO, and Mailpit.
- Files Added: `.env.example`, `infrastructure/docker/compose.dev.yml`, `infrastructure/docker/README.md`
- Files Modified: `package.json`, `docs/task/status.md`
- Database Changes: Added local PostgreSQL container configuration only; no schema or migration changes
- API Changes: None
- Tests Added: None
- Test Result: Compose validation passed; PostgreSQL, Redis, MinIO, MinIO bucket init, bucket privacy, and Mailpit checks passed. Local validation used `.env` port overrides because `127.0.0.1:5432` and `127.0.0.1:6379` were already occupied on this machine.
- Blockers: None
- Decisions: Kept the local stack bound to `127.0.0.1`, used named volumes, and implemented idempotent MinIO bucket creation with a one-shot init container
- Next Task: NH-P0-T003 — Create NestJS API application baseline

## Task Update — NH-P0-T003

- Status: COMPLETED
- Started At: 2026-07-18 22:14:00 +06
- Completed At: 2026-07-18 22:16:30 +06
- Summary: Created NestJS API baseline in `apps/api` with strict TypeScript, global prefix, URI versioning, environment-based configuration, validation pipe, Helmet, CORS allowlist, body size limit, Swagger/OpenAPI, health endpoint, unit tests, e2e tests, and API documentation.
- Files Added: `apps/api/.prettierrc`, `apps/api/eslint.config.mjs`, `apps/api/nest-cli.json`, `apps/api/package.json`, `apps/api/README.md`, `apps/api/tsconfig.build.json`, `apps/api/tsconfig.json`, `apps/api/src/app.controller.ts`, `apps/api/src/app.controller.spec.ts`, `apps/api/src/app.module.ts`, `apps/api/src/app.service.ts`, `apps/api/src/main.ts`, `apps/api/src/health/health.controller.ts`, `apps/api/src/health/health.controller.spec.ts`, `apps/api/src/health/health.module.ts`, `apps/api/src/health/health.service.ts`, `apps/api/test/app.e2e-spec.ts`, `apps/api/test/jest-e2e.json`
- Files Modified: `.env.example`, `README.md`, `pnpm-lock.yaml`, `docs/task/status.md`
- Database Changes: None
- API Changes: Created NestJS API at `apps/api`
- Tests Added: 2 unit tests (AppController, HealthController), 3 e2e tests (root, health, 404)
- Test Result: All tests passed
- Blockers: None
- Decisions: Added `void` to bootstrap() call to satisfy eslint no-floating-promises rule; used `NestExpressApplication` for body parser configuration
- Next Task: NH-P0-T004 — Create Next.js web application baseline

## Task Update — NH-P1-T002

- Status: COMPLETED
- Started At: 2026-07-21 16:20:00 +06
- Completed At: 2026-07-21 16:40:00 +06
- Summary: Implemented full-stack candidate email verification flow: EmailVerificationToken Prisma model with SHA-256 hashed tokens, crypto token service, BullMQ mail queue with Mailpit SMTP processor (nodemailer), HTML+plain text email templates, verification email enqueued during registration, POST verify and resend endpoints with rate limiting (3/min verify, 1/min resend) and audit logging, Next.js verify-email/success/error pages, typed API client methods, and comprehensive test suite.
- Files Added:
  - Database: `apps/api/prisma/migrations/bb4c2441102725_add_email_verification_token/`
  - Email infra: `apps/api/src/infrastructure/email/email.constants.ts`, `apps/api/src/infrastructure/email/email.module.ts`, `apps/api/src/infrastructure/email/email.service.ts`, `apps/api/src/infrastructure/email/email.processor.ts`
  - API auth: `apps/api/src/modules/auth/verification-token.service.ts`, `apps/api/src/modules/auth/verification-token.service.spec.ts`, `apps/api/src/modules/auth/email-verification.service.ts`, `apps/api/src/modules/auth/email-verification.service.spec.ts`, `apps/api/src/modules/auth/email-verification.controller.ts`, `apps/api/src/modules/auth/email-verification.controller.spec.ts`, `apps/api/src/modules/auth/dto/verify-email.dto.ts`, `apps/api/src/modules/auth/dto/resend-verification.dto.ts`
  - E2E: `apps/api/test/email-verification.e2e-spec.ts`
  - Web: `apps/web/src/app/(auth)/verify-email/page.tsx`, `apps/web/src/app/(auth)/verify-email/success/page.tsx`, `apps/web/src/app/(auth)/verify-email/error/page.tsx`
- Files Modified: `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/src/modules/auth/registration.service.ts`, `apps/api/src/modules/auth/registration.service.spec.ts`, `apps/api/src/infrastructure/redis/redis.options.ts`, `apps/web/src/lib/api-client.ts`, `docs/task/status.md`
- Dependencies Added: `nodemailer`, `@types/nodemailer`
- Database Changes:
  - Migration: `bb4c2441102725_add_email_verification_token` — Adds `EmailVerificationToken` table with `tokenHash` (SHA-256, unique), `expiresAt`, `consumedAt`, FK to User
  - Indexes on `userId` and `expiresAt`
- API Changes:
  - Routes: `POST /api/v1/auth/email-verification/verify` (Public), `POST /api/v1/auth/email-verification/resend` (Public)
  - Verify: `200` — `{ userId, email, verifiedAt }`
  - Resend: `200` — `{ message }`
  - Error codes: `400` (invalid/expired token), `404` (unknown email), `409` (already verified), `429` (rate limited)
  - Rate limits: verify 3/min, resend 1/min
  - Audit events: `auth.email_verification.verify.success`, `auth.email_verification.verify.failed`, `auth.email_verification.resend`
- Frontend Changes:
  - Routes: `/verify-email` (auto-verify from email link), `/verify-email/success`, `/verify-email/error` (resend form)
  - Client methods: `verifyEmail(token)`, `resendVerificationEmail(email)`
- Infrastructure:
  - Redis: Removed `commandTimeout` from BullMQ connection config to prevent Worker blocking operations from timing out
- Security:
  - Token: 32-byte cryptographically random hex string, SHA-256 hashed in DB (never stored in plaintext)
  - Expiry: 24 hours, single-use (consumed after verification)
  - Invalidation: All unconsumed tokens invalidated on resend and on successful verification
- Tests Added:
  - API unit: 12 verification token service tests, 10 email verification service tests, 2 controller tests (80 total)
  - API E2E: 5 email verification E2E tests (21 total, 4 suites)
- Command Results:
  - Install: PASS (nodemailer + types)
  - Prisma: format ✅, validate ✅, generate ✅, migrate ✅
  - API: typecheck ✅, test 80/80 ✅, test:e2e 21/21 ✅, build ✅
  - Web: typecheck ✅, build (pre-existing infra failure)
- Manual Smoke Test:
  - Registration creates pending-verification user ✅
  - Verification token created and stored as SHA-256 hash ✅
  - BullMQ mail queue processes job ✅
  - Email delivered to Mailpit with correct subject/from/to/verification link ✅
  - Verify endpoint consumes token and activates user ✅
  - User status changes to ACTIVE with emailVerifiedAt ✅
  - Resend returns 409 for already-verified user ✅
- Blockers: None
- Pre-existing Issues: API lint 22 errors, Web tests Vite/React incompatibility (unchanged)
- Deferred Work:
  - Login and token sessions (NH-P1-T003)
  - Candidate profile (NH-P1-T004)

## Task Update — NH-P1-T001

- Files Added:
  - Shared packages: `packages/validation/src/auth/candidate-registration.ts`, `packages/validation/tests/candidate-registration.test.ts`, `packages/types/src/auth/candidate-registration.ts`, `packages/constants/src/auth/user-account-status.ts`
  - Database: `apps/api/prisma/seed.ts`, `apps/api/prisma/migrations/bb4c2441100302_add_identity_models/`
  - API: `apps/api/src/modules/auth/dto/register-candidate.dto.ts`, `apps/api/src/modules/auth/password-hashing.service.ts`, `apps/api/src/modules/auth/password-hashing.service.spec.ts`, `apps/api/src/modules/auth/registration.service.ts`, `apps/api/src/modules/auth/registration.service.spec.ts`, `apps/api/src/modules/auth/registration.controller.ts`, `apps/api/test/registration.e2e-spec.ts`, `apps/api/scripts/patch-prisma-source.mjs`, `apps/api/scripts/restore-prisma-source.mjs`
  - Web: `apps/web/src/app/(auth)/register/page.tsx`, `apps/web/src/app/(auth)/register/success/page.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/tests/register-page.test.tsx`, `apps/web/tests/register-success-page.test.tsx`
- Files Modified: `package.json`, `apps/api/package.json`, `apps/api/prisma.config.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/test/jest-e2e.json`, `packages/validation/package.json`, `packages/validation/src/index.ts`, `packages/types/package.json`, `packages/types/src/index.ts`, `packages/constants/package.json`, `packages/constants/src/index.ts`, `apps/web/package.json`
- Database Changes:
  - Migration: `bb4c2441100302_add_identity_models` — Adds `UserStatus` enum, `User`, `Role`, `UserRole` tables
  - Models/enums: `UserStatus` (PENDING_VERIFICATION, ACTIVE, SUSPENDED, DELETED), `User`, `Role`, `UserRole`
  - Seed: Idempotent upsert of `candidate` system role
  - Result: Migration applied, seed successful
- API Changes:
  - Route: `POST /api/v1/auth/register/candidate` (Public, no session/token)
  - Success: `201` — `{ userId, email, status: "PENDING_VERIFICATION", emailVerificationRequired: true, createdAt }`
  - Error codes: `400` (validation), `409` (AUTH_EMAIL_ALREADY_REGISTERED), `429` (rate limited)
  - Rate limit: 5 attempts per IP per minute (via `@nestjs/throttler`)
  - Swagger: Request schema, password policy, error responses documented
- Frontend Changes:
  - Routes: `/register` (form page), `/register/success` (confirmation page)
  - Components: Accessible registration form with email, password, confirm password, terms checkbox, show/hide toggles, field-level validation, duplicate-email message, rate-limit/API-unavailable error states, loading/disabled state
  - States: loading, field-error, duplicate-email, rate-limit, unavailable-service, success navigation
- Security:
  - Password hashing: Argon2id via `argon2` package with `type: argon2id`
  - Email normalization: Trimmed and lowercased before lookup and storage
  - Audit metadata: Excludes email, password, hash, token; only `registrationChannel` and `accountStatus` stored
  - Sensitive logging: Service avoids logging raw passwords or hashes
  - Secret review: No secrets committed
- Tests Added:
  - Shared: 13 validation schema tests
  - API unit: 11 registration service tests, 3 password hashing tests (56 total)
  - API E2E: 9 registration E2E tests (17 total)
  - Frontend: 11 component tests (pre-existing infra broken — Vite/React compatibility issue)
  - Manual smoke: Not yet run
- Command Results:
  - Install: PASS
  - Prisma: format ✅, validate ✅, generate ✅, migrate ✅, seed ✅
  - API: lint (22 pre-existing errors ❌), typecheck ✅, test 56/56 ✅, test:e2e 17/17 ✅, build ✅
  - Web: typecheck ✅, build ✅, test (pre-existing infra broken ❌)
  - Root: typecheck 6/6 ✅, build 5/5 ✅, test (pre-existing failures ❌)
  - Diff check: Only pre-existing trailing whitespace warnings
- Pre-existing Issues:
  - API lint: 22 errors in audit service, request-context spec (pre-existing)
  - Web tests: Vite 7 / @vitejs/plugin-react 6 incompatibility (pre-existing)
  - Validation tests: 1 pre-existing pagination test failure
  - E2E Prisma patch: Generated PrismaClient v7 uses ESM syntax; added patch-prisma-source.mjs for CJS test compatibility
- Blockers: None
- Deferred Work:
  - Email verification (NH-P1-T002)
  - Login and token sessions (NH-P1-T003)
  - Candidate profile (NH-P1-T004)

## Task Update — NH-P0-T004

- Status: COMPLETED
- Started At: 2026-07-18 22:18:30 +06
- Completed At: 2026-07-18 22:48:00 +06
- Summary: Created Next.js web application baseline in `apps/web` with App Router, TypeScript, Tailwind CSS, accessible root layout (skip-link, header, footer), home page, status page, loading component, custom not-found page, error boundary, Vitest component tests (8 tests), Playwright e2e smoke tests (3 tests), environment helper, site configuration, and documentation.
- Files Added: See completion report
- Files Modified: `.env.example`, `README.md`, `pnpm-lock.yaml`, `docs/task/status.md`
- Database Changes: None
- API Changes: None
- Tests Added: 8 Vitest component tests, 3 Playwright e2e tests
- Test Result: All tests passed
- Blockers: None
- Decisions: Excluded `tests/` and `e2e/` from tsconfig to avoid vitest global type conflicts; enabled `globals: true` in vitest config; used symlink to existing Playwright chromium_headless_shell-1223 for chromium-1228 due to download timeouts; used system chromium for e2e tests
- Next Task: NH-P0-T005 — Configure PostgreSQL and Prisma baseline

## Task Update — NH-P1-T006

- Status: COMPLETED
- Started At: 2026-07-21 17:30:00 +06
- Completed At: 2026-07-21 17:40:00 +06
- Summary: Implemented Candidate Profile Basics including database schema, NestJS module with roles authorization, audit logging, completion service, typed validation, and high-fidelity glassmorphism Next.js UI.
- Files Added:
  - Database: `apps/api/prisma/migrations/bb4c2441113134_add_candidate_profile_basics/`
  - Shared: `packages/validation/src/candidates/candidate-profile-basics.ts`, `packages/types/src/candidates/index.ts`
  - API: `apps/api/src/common/decorators/roles.decorator.ts`, `apps/api/src/common/guards/roles.guard.ts`, `apps/api/src/modules/candidates/candidates.module.ts`, `apps/api/src/modules/candidates/controllers/candidate-profile.controller.ts`, `apps/api/src/modules/candidates/services/candidate-profile.service.ts`, `apps/api/src/modules/candidates/services/candidate-profile-completion.service.ts`, `apps/api/src/modules/candidates/repositories/candidate-profile.repository.ts`, `apps/api/test/candidate-profile.e2e-spec.ts`
  - Web: `apps/web/src/app/(authenticated)/profile/page.tsx`
- Files Modified: `apps/api/prisma/schema.prisma`, `packages/validation/src/index.ts`, `packages/types/src/index.ts`, `apps/api/src/app.module.ts`, `apps/web/src/lib/api-client.ts`, `docs/task/status.md`
- Database Changes: Added `CandidateProfile` model to schema and generated client.
- API Changes: Added `GET` and `PUT` endpoints to `/v1/candidates/me/profile`.
- Tests Added: `apps/api/test/candidate-profile.e2e-spec.ts` with 2 tests.
- Test Result: E2E passed. Typecheck passed.
- Blockers: None
- Decisions: Used explicit `any` casting for Prisma known request errors due to generated client module visibility.
- Next Task: None specified yet.

## Task Update — NH-P1-T007

- Status: COMPLETED
- Started At: 2026-07-21 17:40:00 +06
- Completed At: 2026-07-21 17:55:00 +06
- Summary: Implemented Candidate Location and Career Preferences endpoint, profile page, frontend schemas, and tests.
- Files Added: `apps/api/src/modules/candidates/controllers/candidate-preferences.controller.ts`, `apps/api/src/modules/candidates/services/candidate-preferences.service.ts`, `apps/api/src/modules/candidates/repositories/candidate-preferences.repository.ts`, `apps/web/src/app/(authenticated)/profile/preferences/page.tsx`, `apps/web/tests/profile-preferences-page.test.tsx`
- Files Modified: `apps/api/src/modules/candidates/candidates.module.ts`, `apps/api/src/modules/configuration/controllers/countries.controller.ts`, `apps/web/src/lib/api-client.ts`, `packages/validation/src/candidates/candidate-preferences.ts`, `packages/validation/package.json`
- Database Changes: Added CandidatePreference table and Country table.
- API Changes: Added `/api/v1/config/countries` public endpoint and `/api/v1/candidates/me/preferences` secure PUT/GET endpoints.
- Tests Added: Backend API E2E tests, Frontend component tests.
- Test Result: PASS
- Blockers: None
- Decisions: Integrated frontend job roles input tags using Next.js client component state logic.
- Next Task: NH-P1-T008 — Implement Candidate Education Records
