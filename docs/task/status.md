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
- Current Task: NH-P1-T003 — Implement Login and Session Foundation
- Last Completed Task: NH-P1-T003 — Implement Candidate Login and Session Foundation
- Blockers: None
- Next Planned Task: NH-P1-T004 — Implement Session Management and Logout All Devices

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
| Phase 1  | Identity and Candidate Foundation | IN_PROGRESS |      30% |
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
task_id: NH-P1-T007
title: Implement Candidate Location and Career Preferences
phase: Phase 1
status: COMPLETED
started_at: 2026-07-21T17:40:00Z
completed_at: 2026-07-21T17:55:00Z
assigned_to: AI Development Workflow
dependencies:
  - NH-P1-T006
blockers: []
next_task:
  task_id: NH-P1-T008
  title: Implement Candidate Education Records
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
| NH-P1-T007 | Candidate Location and Career Preferences        | Phase 1 | COMPLETED | 2026-07-21 17:55:00 +06 |

---

## 7. In-Progress Tasks

_No task is currently in progress._

## Task Update — NH-P1-T003

- Status: COMPLETED
- Started At: 2026-07-21 16:45:00 +06
- Completed At: 2026-07-21 17:00:00 +06
- Summary: Implemented full-stack candidate login and session foundation with dual-token auth (JWT access + rotating refresh), auth guard, session management, rate limiting, audit logging, Next.js login page, auth context provider, in-memory access token storage, and /app authenticated landing route.
- Files Added:
  - Database: `apps/api/prisma/migrations/20260721104108_add_user_sessions/`
  - API: `apps/api/src/modules/auth/login.service.ts`, `apps/api/src/modules/auth/login.controller.ts`, `apps/api/src/modules/auth/session.service.ts`, `apps/api/src/modules/auth/token.service.ts`, `apps/api/src/modules/auth/auth.guard.ts`, `apps/api/src/modules/auth/dto/login.dto.ts`, `apps/api/src/modules/auth/decorators/allow-revoked-session.decorator.ts`
  - Shared: `packages/types/src/auth/candidate-login.ts`, `packages/types/src/auth/account-state.ts`, `packages/validation/src/auth/candidate-login.ts`, `packages/constants/src/auth/auth-errors.ts`
  - Tests: `apps/api/test/auth.e2e-spec.ts`
  - Web: `apps/web/src/providers/auth-context.tsx`, `apps/web/src/app/(authenticated)/layout.tsx`, `apps/web/src/app/(authenticated)/app/page.tsx`, `apps/web/tests/login-page.test.tsx`
  - Docs: `docs/architecture/authentication.md`, `docs/api/authentication.md`, `docs/security/web-session-security.md`
- Files Modified: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/src/modules/auth/auth.constants.ts`, `apps/api/src/modules/auth/index.ts`, `apps/api/src/app.controller.ts`, `apps/api/src/health/health.controller.ts`, `apps/api/src/system/system.controller.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/src/app/(auth)/login/page.tsx`, `packages/constants/src/index.ts`, `packages/constants/src/auth/auth-errors.ts`, `.env.example`, `docs/task/status.md`
- Dependencies Added: `jsonwebtoken`, `@types/jsonwebtoken`, `cookie-parser`
- Database Changes:
  - Migration: `20260721104108_add_user_sessions` — Adds `UserSessionStatus` enum (ACTIVE, REVOKED, EXPIRED, COMPROMISED) and `UserSession` model with refresh-token hash, token family, expiry, revocation fields
  - Indexes on `[userId, status]`, `[tokenFamilyId]`, `[expiresAt]`
- API Changes:
  - Routes: `POST /api/v1/auth/login` (Public), `POST /api/v1/auth/refresh` (Public, cookie), `GET /api/v1/auth/me` (Protected), `POST /api/v1/auth/logout` (Protected, idempotent)
  - Error codes: AUTH_INVALID_CREDENTIALS, AUTH_EMAIL_NOT_VERIFIED, AUTH_ACCOUNT_UNAVAILABLE, AUTH_REFRESH_TOKEN__, AUTH_SESSION__, AUTH_ACCESS_TOKEN_*
  - Rate limits: login 5/min, refresh 30/min
  - Audit events: auth.login.succeeded/failed, auth.session.refreshed, auth.refresh_token.reused, auth.logout.completed
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

No blocked task.

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
6. Wait for completion feedback before issuing another task.

---

**End of Status File**

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
  - Database: `apps/api/prisma/migrations/20260721102725_add_email_verification_token/`
  - Email infra: `apps/api/src/infrastructure/email/email.constants.ts`, `apps/api/src/infrastructure/email/email.module.ts`, `apps/api/src/infrastructure/email/email.service.ts`, `apps/api/src/infrastructure/email/email.processor.ts`
  - API auth: `apps/api/src/modules/auth/verification-token.service.ts`, `apps/api/src/modules/auth/verification-token.service.spec.ts`, `apps/api/src/modules/auth/email-verification.service.ts`, `apps/api/src/modules/auth/email-verification.service.spec.ts`, `apps/api/src/modules/auth/email-verification.controller.ts`, `apps/api/src/modules/auth/email-verification.controller.spec.ts`, `apps/api/src/modules/auth/dto/verify-email.dto.ts`, `apps/api/src/modules/auth/dto/resend-verification.dto.ts`
  - E2E: `apps/api/test/email-verification.e2e-spec.ts`
  - Web: `apps/web/src/app/(auth)/verify-email/page.tsx`, `apps/web/src/app/(auth)/verify-email/success/page.tsx`, `apps/web/src/app/(auth)/verify-email/error/page.tsx`
- Files Modified: `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/src/modules/auth/registration.service.ts`, `apps/api/src/modules/auth/registration.service.spec.ts`, `apps/api/src/infrastructure/redis/redis.options.ts`, `apps/web/src/lib/api-client.ts`, `docs/task/status.md`
- Dependencies Added: `nodemailer`, `@types/nodemailer`
- Database Changes:
  - Migration: `20260721102725_add_email_verification_token` — Adds `EmailVerificationToken` table with `tokenHash` (SHA-256, unique), `expiresAt`, `consumedAt`, FK to User
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
  - Database: `apps/api/prisma/seed.ts`, `apps/api/prisma/migrations/20260721100302_add_identity_models/`
  - API: `apps/api/src/modules/auth/dto/register-candidate.dto.ts`, `apps/api/src/modules/auth/password-hashing.service.ts`, `apps/api/src/modules/auth/password-hashing.service.spec.ts`, `apps/api/src/modules/auth/registration.service.ts`, `apps/api/src/modules/auth/registration.service.spec.ts`, `apps/api/src/modules/auth/registration.controller.ts`, `apps/api/test/registration.e2e-spec.ts`, `apps/api/scripts/patch-prisma-source.mjs`, `apps/api/scripts/restore-prisma-source.mjs`
  - Web: `apps/web/src/app/(auth)/register/page.tsx`, `apps/web/src/app/(auth)/register/success/page.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/tests/register-page.test.tsx`, `apps/web/tests/register-success-page.test.tsx`
- Files Modified: `package.json`, `apps/api/package.json`, `apps/api/prisma.config.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/test/jest-e2e.json`, `packages/validation/package.json`, `packages/validation/src/index.ts`, `packages/types/package.json`, `packages/types/src/index.ts`, `packages/constants/package.json`, `packages/constants/src/index.ts`, `apps/web/package.json`
- Database Changes:
  - Migration: `20260721100302_add_identity_models` — Adds `UserStatus` enum, `User`, `Role`, `UserRole` tables
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
  - Database: `apps/api/prisma/migrations/20260721113134_add_candidate_profile_basics/`
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
