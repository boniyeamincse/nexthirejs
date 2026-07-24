# Project Status

**Last Updated:** 2026-07-24
**Current Version:** api `0.0.1` / web `0.1.0` (pre-release; monorepo, no unified version tag)
**Overall Progress:** ~56% (weighted: 20/40 NH-M modules COMPLETED, 3 IN_PROGRESS, 0 UNVERIFIED, 17 NOT_STARTED — see `docs/task/status.md` ledger, reconciled 2026-07-23T10:45:00Z + NH-M09/NH-M10/NH-M12–NH-M14/NH-M16–NH-M21 work, treated as authoritative over `TODO.md`. NH-M07's COMPLETED status should be treated as unverified pending a routing sweep — see Bugs → Critical.)

This file is the single source of truth for engineering status. It synthesizes `docs/task/status.md` (verified ledger), `TODO.md` (checklist view — currently has a stale summary table, see Bugs), `docs/phase-1/known-limitations.md`, `docs/phase-2/known-limitations.md`, and a fresh scan of uncommitted working-tree changes (`git status`) not yet reflected in any doc.

**Uncommitted work in the tree right now (not in any ledger yet):** partial NH-M08 (Learning Content) scaffolding and partial NH-M37 (SuperAdmin Dashboard) scaffolding. Both are analyzed below. NH-M08's uncommitted code currently **fails `tsc --noEmit`** — see Bugs → Critical.

---

# Completed Features

- [x] Platform Foundation — Docker infra (Postgres/Redis/MinIO/Mailpit), health endpoint, Swagger, global `/api/v1` prefix, error envelope, CI workflow (NH-M01)
- [x] Registration and Email Verification — Argon2id hashing, SHA-256 tokens, BullMQ + Mailpit delivery (NH-M02)
- [x] Login, Sessions, and Password Recovery — rotating refresh tokens, session list/revoke, forgot/reset/change password (NH-M03)
- [x] TOTP MFA, Roles, and Permissions (partial scope) — enroll/confirm/disable, AES-256-GCM secret encryption, recovery codes, login challenge, trusted devices, mandatory-MFA policy + guard (NH-M04, commit `0a2d790`). Role/Permission RBAC tables intentionally deferred — see Pending Tasks.
- [x] Candidate Profile — full CRUD across 7 sections, photo upload/replace/delete with magic-byte validation, private storage (NH-M05, commit `a03dc1d`)
- [x] CV Builder and PDF Export — profile-snapshot import, async PDF export via BullMQ worker, history/download, live-preview editor UI (NH-M06, commit `e26d826`). IDOR (404→400 leak) and stored-XSS in HTML preview fixed during delivery.
- [x] Assessment and Exam Simulation — authoring, attempts, scoring, results, analytics, leaderboards, retakes, certificates (NH-M07, NH-P2-T001→T009). **⚠ Flagged 2026-07-23: 7 of this module's controllers share the exact double-`v1` routing bug found and fixed in NH-M10 (see Bugs → Critical), not yet independently verified for this module — treat as unverified until swept.**
- [x] Expert Expertise, Services, and Pricing — catalog, service CRUD/lifecycle, fixed-duration slots, decimal pricing, frontend pages (NH-M11). **⚠ Updated 2026-07-23: the frontend integration was actually broken in production this whole time** — `api-client.ts` called `experts/me/expertise` and `experts/me/services`, neither of which matches the real controllers (`expert/expertise`, `expert/services`); found while wiring NH-M12's slot preview UI, fixed (frontend-only), live-verified via curl.
- [x] Candidate Dashboard — `/dashboard` aggregates profile-completion across 9 candidate data sources end-to-end (NH-M09); backend e2e 11/11 green; frontend suite was stale against a prior redesign (8/11 false-failing) and had an a11y regression (progress meters/row links missing accessible names) — rewrote suite (10/10 green) and fixed the a11y gaps. Assessments-card and Skill-Coverage-radar remain honest, labeled placeholders, out of this module's scope.
- [x] Expert Profile and Verification — profile/application/documents/readiness/admin-review backend + `become-an-expert` and admin review UI (NH-M10). The prior "16/16 E2E" was a false signal from a test bootstrap that didn't mirror `main.ts`; the real app had a double-`v1` 404 on `expert-application`/`expert-application-admin`/`expert-profile` controllers (entire candidate application flow + entire admin review API unreachable) plus a frontend layout bug that blocked applicants from ever reaching `/expert/profile`. Both fixed and verified live in-browser; e2e rewritten to test real paths (16/16 green); added 22 new frontend tests (previously zero) for the apply flow and admin approve/reject/request-changes. **Update: a second, independent severe bug found while building NH-M13** — `getDetail()`/`approve()`/`reject()`/`requestChanges()` all returned the wrong response shape (status/etc nested under `.application`, `profile`/`documents` missing on decision responses), which would crash the review page on `<StatusBadge status={detail.status}>` the moment a real application loaded or any decision was taken; separately, `POST .../start-review` didn't exist in the backend at all (plain 404) so reviewers could never move an application into UNDER_REVIEW. Fixed: unified all four methods behind one `buildReviewDetail()` helper returning the flat shape the frontend always expected, added the missing endpoint, sourced `applicant.displayName` from `CandidateProfile.fullName`. 18 backend unit tests now cover this (was 12), e2e 21/21 (was 17 before NH-M12, now includes M12+M13 routes too).
- [x] Expert Availability and Slot Engine — `ExpertSlotService` computes concrete bookable slots from weekly windows + overrides (NH-M12); added `luxon` for DST-safe IANA-timezone conversion (new dependency), new `GET expert/availability/slots/preview` endpoint, "Preview Slots" panel on `/expert/availability`. Deliberately scoped to raw availability only — no Booking-table conflict exclusion, since `Booking` belongs to the separate `trainers` domain, not `ExpertProfile` (deferred to the flagged trainers/experts reconciliation). 11 unit tests cover real 2026 DST transition dates (spring-forward correctly yields fewer real slots, fall-back correctly yields one extra). Found and fixed the same path-drift bug class as NH-M10 but wider: NH-M11's frontend (expertise/services) and the public expertise-areas catalog were also calling the wrong backend paths — fixed and live-verified. Also found and fixed: the availability page's `load()` caught each of its three initial fetches individually and always resolved to defaults, so its error banner and 401-redirect were dead code; reworked so a 401 logs out and a genuine failure shows a retryable banner instead of silently rendering blank. 8 frontend tests (was 0).
- [x] Expert Discovery and Public Profile — real public directory built from scratch (NH-M13): `/find-expert` was 100% hardcoded mock data before this (search/filters didn't even work), `/find-expert/:id` didn't exist, `trainers.controller.ts` had zero `@Public()` routes. Chose to build on `ExpertProfile` (the NH-M10–M12 pipeline), not legacy `TrainerProfile`, per explicit decision — see Pending Tasks for the now-narrower trainers/experts reconciliation still owed. Added `isPublic`/`publicSlug` to `ExpertProfile` (migration), a collision-safe slug generator, an `expert`-role-gated visibility toggle, and a new public `expert/public` module (search/list + slug detail) that projects only what the expert published — no fabricated ratings/reviews, since no rating data source exists for this domain yet. Rewired `/find-expert` + built `/find-expert/[slug]` + added the toggle to `/expert/profile`. 11 backend unit + 3 e2e + 21 frontend tests, all new. **Found and fixed a second severe pre-existing bug in NH-M10's admin review API along the way** (see that entry above) while sourcing a real applicant display name for this feature.
- [x] Expert Booking and Scheduling — real reservation system built from scratch (NH-M14), on `ExpertProfile`/`ExpertService`/`ExpertSlotService` (not legacy `trainers`/`Booking`, same domain-fork decision as NH-M13, now made explicitly for M14 too). New `ExpertBooking` model + migration with a raw-SQL partial unique index on `(expertUserId, slotStartUtc)` (scoped to HELD/CONFIRMED) as the race-safe reservation guard. `ExpertSlotService.previewSlots` (NH-M12) now excludes slots overlapping an active booking — closes the conflict-exclusion gap explicitly deferred since NH-M12/M13. New `candidates/me/bookings` (create/list/get/confirm/cancel) and `expert/bookings` (list/get/update — meeting link, complete, cancel) controllers, plus a public `expert/public/:slug/services/:serviceId/slots` endpoint so candidates can browse real availability pre-login. Reservation/expiration: booking created HELD with a 15-minute hold; a delayed BullMQ job expires it if the candidate never confirms — `confirm()` stands in for the payment step NH-M29 hasn't built yet (documented as such). Frontend: booking panel on `/find-expert/[slug]`, new `/bookings` candidate page, new `/expert/bookings` page. 23 new backend unit tests + 3 slot-exclusion tests + 6 new e2e smoke tests (28/28 total, was 21) + 20 new frontend tests, all new.
- [x] Feedback, Evaluation, Ratings, and Reviews — built on `ExpertBooking` (NH-M16, same domain-fork as M13/M14). Two new models: `ExpertSessionEvaluation` (expert's private feedback on the candidate's session performance) and `ExpertReview` (candidate's public rating/review of the expert — the aggregate-rating data source M13 explicitly deferred). One per COMPLETED booking each direction, eligibility enforced via booking ownership + status. `isHidden`/`hiddenReason` on `ExpertReview` are the spec's "moderation hooks"; a `manage/experts/reviews` admin controller (hide/unhide) covers them — a full moderation center is still NH-M32's scope. Wired real `rating: {average, count}` into `expert/public` list/detail (closing M13's placeholder) plus a new public `expert/public/:slug/reviews` endpoint. New endpoints for candidate (view evaluation, submit/view review) and expert (submit/view evaluation, view review, list own reviews + aggregate). Frontend: feedback panels on `/bookings` and `/expert/bookings`, new `/expert/reviews` page, rating + reviews shown on `/find-expert` and `/find-expert/[slug]`. 24 new backend unit tests + 4 rating tests + 11 new e2e smoke tests (39/39 total, was 28) + 10 new frontend tests, all new.
- [x] Expert Earnings, Wallet, and Payout — new `ExpertWalletAccount` keyed to `userId` (NH-M17, same domain-fork as M13/M14/M16, not legacy `WalletAccount`/`TrainerProfile`). New models `ExpertWalletAccount`/`ExpertWalletLedger`/`ExpertPayoutAccount`/`ExpertPayoutRequest` reusing the existing generic `WalletStatus`/`TransactionType`/`PayoutStatus` enums. Balances stay real at `0.00` — deliberately nothing auto-credits them yet, since no payment-capture domain exists to source real earnings from (auto-crediting from booking completion would repeat the exact "fabricated revenue" pattern already flagged for `AdminDashboardService`). The debit/ledger mechanism itself is real and tested: `processPayoutRequest` debits the wallet + writes a `PAYOUT_OUT` ledger row on completion, just unreachable at nonzero balances until NH-M29 lands. Security improvement over the legacy wallet: payout account numbers are now masked in every API response (`maskTail`), never returned in full after creation. New expert endpoints (wallet init/get, payout-accounts, payout-requests) and admin endpoints (list/process payout requests, verify payout account — the KYC gate blocking requests until verified). Frontend: new `/expert/wallet` page (added to nav) — balance summary, masked payout-account list + form, payout-request form gated on having a verified account. 18 new backend unit tests + 9 new e2e smoke tests (48/48 total, was 39) + 7 new frontend tests, all new.
- [x] Expert Dashboard and Reports — the capstone of the M10–M18 expert-marketplace arc (NH-M18). Pure aggregation over models already built in M10-M17, no new Prisma models. New `GET expert/dashboard` reuses `ExpertReviewService`/`ExpertWalletService` via DI (not duplicated queries) alongside direct booking/service/availability counts, all in one `Promise.all`: upcoming-bookings count + next-5 list, completed-sessions count, active-services count, rating aggregate, wallet summary (or null), 3 most recent reviews (owner's view), and whether availability is configured. New `/expert/dashboard` page (added as the first expert nav item) — stat tiles, upcoming-sessions list, wallet/reviews summary cards linking out, and an inline prompt to `/expert/availability` when unconfigured. 2 new backend unit tests + 1 new e2e smoke test (49/49 total, was 48) + 5 new frontend tests, all new.
- [x] Company Profile and Verification — first module of the Company/Recruiter phase, built from scratch (NH-M19). New `Company`/`CompanyVerificationApplication`/`CompanyVerificationDocument` models (one company per owner — team/multi-member is NH-M20's scope), mirroring the NH-M10 expert-application architecture: same `DRAFT→SUBMITTED→UNDER_REVIEW→CHANGES_REQUESTED/APPROVED/REJECTED/WITHDRAWN` state machine, signed-URL private document storage with magic-byte verification, readiness gating (profile + business-registration doc + MFA) before submission. Scope adjustments vs. experts: admin-role-gated review instead of a dedicated reviewer role, no `MfaRequiredGuard` on review (matches M16/M17 precedent), one consolidated onboarding page instead of a multi-page wizard. `company` role granted transactionally only on admin approval, same role-on-approval pattern as experts. Frontend: `/become-a-company` (profile + documents + readiness + submit/withdraw), `/manage/companies/applications` (admin queue), `/manage/companies/applications/[applicationId]` (admin detail with inline approve/reject/request-changes). 48 new backend unit tests + 17 new e2e smoke tests + 15 new frontend tests, all new. Found (not fixed, out of scope) a pre-existing M10-era response-shape bug in `getMyExpertProfile` and, separately, a repo-wide pre-existing e2e-harness break affecting all 34 e2e spec files — both documented in Bugs and `docs/task/status.md`.
- [x] Company Team and Permissions (NH-M20) — new `CompanyMember` (OWNER/ADMIN/RECRUITER/VIEWER) and `CompanyInvitation` (PENDING/ACCEPTED/DECLINED/REVOKED/EXPIRED) models. `Company.upsert` now transactionally creates the owner's OWNER-role `CompanyMember` row alongside the Company itself, the seed point for all membership. Invitations target existing NextHire accounts by email only — no invite-to-signup flow, no email delivery (invitee sees pending invites via `GET companies/invitations/me`, matched by their own authenticated email; a deliberate scope limit, not a bug). No bearer-token accept link — authorization is unguessable-UUID + email-match, simpler than an initial token-hash design that was simplified away mid-build via a corrective migration before anything used it. Permissions: OWNER manages everyone; ADMIN can invite/manage RECRUITER/VIEWER only (not other ADMINs or OWNER); OWNER can never be changed/removed/invited-into (ownership transfer out of scope); any non-OWNER member can remove themselves (leave). Scope decision: M19's owner-only profile/application endpoints were deliberately NOT retrofitted to be membership-aware here — that would require reworking whose MFA counts for readiness when a non-owner ADMIN acts, risking already-tested M19 code for a module that's supposed to stay bounded; deferred as a documented follow-up. Frontend: `/company/team` (roster, role changes, remove/leave, invite form + invitation list for managers), `/company/invitations` (accept/decline invites addressed to me), a "Manage team →" link on `/become-a-company`. 28 new backend unit tests + 10 new e2e smoke tests (hit the same pre-existing e2e-harness break documented under M19, not a new regression) + 11 new frontend tests, all new.
- [x] Company Candidate Search (NH-M21) — reuses NH-M09's privacy infrastructure instead of duplicating it: added a `'COMPANY_VERIFIED'` viewer context (2-line additive change) to the existing `CandidatePrivacyDecisionService`, and a new `getProfileForVerifiedCompany()` method on the existing `CandidateProfilePreviewService` mirroring its public-directory method but with real audit attribution. `PublicCandidateProfile` never exposed email/phone in the first place — verified during research, so wiring companies into it carried zero contact-leak risk. New `CandidateSearchRepository`/`CandidateSearchService` (candidates module) do a privacy-filtered search (`overallDiscoverability=PLATFORM_DISCOVERABLE`, `basicProfile≠HIDDEN`) with per-card section gating reusing the same decision service, not reimplemented. New `CompanyVerifiedAccessService` requires company membership **and** an APPROVED verification application (no denormalized "verified" flag exists on `Company` — checked via a count query through `CompanyVerificationApplication`). CV authorization scoped down deliberately: `Cv.visibility` (`PUBLIC`/`UNLISTED`/`PRIVATE`) has existed since NH-M06 with a working selector in `CvEditor` but zero consumers — companies now see metadata for a candidate's `PUBLIC` CVs (title/template/completion%), but full content/PDF viewing was not built (would mean extending the owner-gated async export pipeline with a second auth branch — deferred, same call as the M19→M20 boundary). New endpoints: `GET companies/me/candidates` (search), `GET companies/me/candidates/:candidateId` (profile + public CVs). Frontend: `/company/candidates` (search + skill filter + cards — caught and fixed a real bug in its own test before commit: typing in the search box was auto-refetching on every keystroke because live input state fed the data-loading callback's dependency array directly; fixed by splitting input-vs-applied-query state), `/company/candidates/[candidateId]` (privacy-projected profile + public CVs), a link added to `/company/team`. 7 new backend unit tests + 2 new e2e smoke tests (same pre-existing harness break, not a regression) + 9 new frontend tests, all new.

Only modules verified end-to-end are listed here. Partially-delivered modules (even if a majority of their scope is done) are kept in **In Progress** below until the full module is verified.

---

# In Progress

- [ ] NH-M30 Secure File and Media Management (~50%) — per-feature secure storage exists (expert docs, certificates, MinIO); no unified upload/presign module or reusable frontend uploader
- [ ] NH-M32 Verification and Moderation Center (~35%) — expert application review queue + admin UI exist (piggybacks on M10); no unified center, no company queue, no moderation
- [ ] NH-M33 Catalog and Content Management (~40%) — assessment category management + expertise-area catalog exist; no unified admin catalog UI (countries/languages/skills/currencies/templates)
- [ ] NH-M35 Audit, Security Events, and Support (~35%) — audit foundation + events exist across features; no admin search/detail UI, no security-event dashboard
- [ ] NH-M08 Learning Content and Progress (~25%, **uncommitted, currently broken**) — see Current Task; DB schema + candidate catalog + course authoring/category/module management exist, but module is not registered in `app.module.ts` and one imported service file doesn't exist (`tsc` fails)
- [ ] NH-M37 SuperAdmin Dashboard and Reports (~60%, **uncommitted, unverified**) — dashboard stats/growth/revenue/activity/alerts endpoints + `/admin` and `/admin/reports` pages exist; reports are mocked random data, no caching, no PDF export, no admin/superadmin role seeded so nobody can actually reach it today

---

# Pending Tasks

## NH-M04 remainder (RBAC)

- [ ] Permission model (id, name, resource, action, description)
- [ ] RolePermission model
- [ ] Encrypted recovery-codes-as-jsonb / trusted-devices-as-jsonb (implemented differently, as a hashed table + dedicated table instead — functionally equivalent, documented in `docs/security/mfa.md`)
- [ ] Seed remaining roles: SUPER_ADMIN, ADMIN, COMPANY_ADMIN, COMPANY_RECRUITER, COMPANY_INTERVIEWER, COMPANY_VIEWER, SUPPORT_AGENT, FINANCE_ADMIN, CONTENT_MODERATOR
- [ ] Seed full permission list (user/role/candidate/expert/company/job/application/booking/payment/payout/finance domains)

## Learning (NH-M08)

- [ ] Register `LearningModule` in `app.module.ts` (currently missing entirely)
- [ ] Restore/create `course-publication.service.ts` (`CoursePublicationService`, `CourseReadinessService`) — imported but absent, breaks the build
- [ ] Enrollment controller/service (schema + repo groundwork exists via `CourseEnrollment`, no API)
- [ ] Lesson progress controller/service (`LessonProgress` model exists, unused)
- [ ] Seed `course_manager` role
- [ ] Candidate-facing course catalog + lesson-player frontend (none exists)
- [ ] Tests (zero test files currently exist for this module)

## Expert/Trainer Marketplace (NH-M12–M18) — fully complete as of 2026-07-24

- [x] ~~Slot computation/preview engine, DST-safe generation~~ — done 2026-07-23, see Completed Features (M12)
- [x] ~~Reconcile `trainers` vs `experts` domain duplication~~ — done. M13/M14/M16/M17 all built new `ExpertProfile`-scoped models instead of touching legacy `trainers`; `trainers`/`Booking`/`Evaluation`/`WalletAccount` remain untouched dead weight, reconciliation itself (deleting/migrating off the legacy domain) is not scheduled work.
- [x] ~~Public expert profile slug/projection/search verification~~ — done 2026-07-23, see Completed Features (M13)
- [x] ~~Booking frontend + slot-engine integration + reservation/expiration logic~~ — done 2026-07-23, see Completed Features (M14). Booking-conflict exclusion is now wired into the M12 slot engine as part of this.
- [x] ~~Evaluation/review frontend~~ — done 2026-07-23, see Completed Features (M16)
- [x] ~~Wallet/payout frontend~~ — done 2026-07-24, see Completed Features (M17). Commission logic intentionally not applied anywhere yet — no real payment capture exists to source real earnings from (NH-M29); wiring it in now would fabricate revenue.
- [x] ~~Expert Dashboard and Reports~~ — done 2026-07-24, see Completed Features (M18)

## Company/Recruiter (NH-M19–M26) — profile/verification/team/candidate-search done, rest not started

- [x] ~~Company profile and verification~~ — done 2026-07-24, see Completed Features (M19).
- [x] ~~Company team and permissions~~ — done 2026-07-24, see Completed Features (M20). M19's profile/application endpoints remain owner-only — non-owner members can't yet view/edit them (documented follow-up, not built).
- [x] ~~Company candidate search~~ — done 2026-07-24, see Completed Features (M21). CV content/PDF viewing for companies not built (metadata-only) — documented follow-up.
- [ ] Shortlists/pipeline, contact/consent
- [ ] Job posting + public job board, applications/ATS
- [ ] Company dashboard and analytics

## Communication & Growth (NH-M15, M23, M27–M29) — nothing started

- [ ] Interview and coaching session lifecycle
- [ ] Candidate contact/email/SMS/consent
- [ ] Messaging and realtime (no Socket.IO/conversation code)
- [ ] Notifications and preferences
- [ ] Payments, refunds, commission (expert wallet ledger exists from M17, ready to be credited from real payment capture; no provider/intent/webhook abstraction yet)

## Platform/Admin (NH-M31, M34, M36–M39)

- [ ] Admin user/role management module (M31 — distinct from the new dashboard-only AdminModule)
- [ ] Finance operations (M34)
- [ ] Settings and feature flags (M36)
- [ ] SuperAdmin dashboard remainder — see Current Task
- [ ] End-to-end integration pass (M38)
- [ ] Security/performance/accessibility release gate (M39)

## Infrastructure / Production Readiness

- [ ] DNS, SSL, load balancer, CDN for production domain
- [ ] Managed Postgres/Redis/object storage, real email + SMS providers, video provider, payment gateway
- [ ] Monitoring (Grafana/DataDog/NewRelic), error tracking (Sentry), centralized logging

---

# Bugs

## Critical

- **`tsc --noEmit` fails right now**: `apps/api/src/modules/learning/management/controllers/course-management.controller.ts:5` imports `CoursePublicationService`/`CourseReadinessService` from `../services/course-publication.service`, which does not exist anywhere in the repo (`TS2307: Cannot find module`). Any build (`pnpm --filter api build`) will fail while this file is present in its current form.
- **Learning module is entirely unreachable**: no `LearningModule` exists to wrap the 6 learning controllers/services, and nothing imports them into `app.module.ts` (only `AdminModule` was added there). All `/v1/courses*` and `/v1/manage/courses*` routes are dead code even once the missing file above is fixed.
- **Unfixed IDOR / resource-existence leak (404-vs-400 pattern), 10 call sites across 4 modules**: `NotFoundException` followed by a separate `BadRequestException('Unauthorized')` when the resource exists but belongs to another user lets an attacker distinguish "doesn't exist" from "exists, not yours" — enumerating other users' private resource IDs.
  - `apps/api/src/modules/projects/project.service.ts` — 5 occurrences (lines ~113, 150, 206, 241, 276, 315)
  - `apps/api/src/modules/trainers/booking.service.ts` — 2 occurrences (~102, 191)
  - `apps/api/src/modules/trainers/evaluation.service.ts` — 1 occurrence (~105)
  - `apps/api/src/modules/trainers/trainer.service.ts` — 1 occurrence (~109)
  - `apps/api/src/modules/skills/skill.service.ts` — 2 occurrences (~118, 154)
  - Same bug class already found and fixed in the CV module during NH-M06; never swept project-wide. Fix: collapse to a single `NotFoundException` when `resource.userId !== userId`.
- **Double-`v1` route prefix (404 in production) — found and fixed in the 3 experts controllers during NH-M10, same anti-pattern unfixed in 10 more controllers.** `main.ts` does `setGlobalPrefix('api')` + `enableVersioning({ type: URI, defaultVersion: '1' })`, so every controller already gets `/api/v1/...` automatically. Any controller whose `@Controller(...)` path _also_ hardcodes a literal `v1/` segment registers at `/api/v1/v1/...` instead — a 404 for every real frontend call, since `api-client.ts` always calls `/api/v1/...`. Fixed in NH-M10: `expert-application.controller.ts`, `expert-application-admin.controller.ts`, `expert-profile.controller.ts` (confirmed live: real path 404'd, doubled path worked). **Still present, unfixed, in:**
  - `apps/api/src/modules/assessments/management/controllers/assessment-assignment.controller.ts:7`
  - `apps/api/src/modules/assessments/management/controllers/assessment-management.controller.ts:8`
  - `apps/api/src/modules/assessments/management/controllers/assessment-question-management.controller.ts:10`
  - `apps/api/src/modules/assessments/management/controllers/assessment-section.controller.ts:7`
  - `apps/api/src/modules/assessments/management/controllers/assessment-category-management.controller.ts:10`
  - `apps/api/src/modules/assessments/certificates/controllers/certificate.controller.ts:12` (`/candidates/me/certificates` — candidate-facing, not just admin)
  - `apps/api/src/modules/assessments/certificates/controllers/certificate-verification.controller.ts:8` (public-facing certificate verification)
  - `apps/api/src/modules/learning/management/controllers/course-module-management.controller.ts:7`
  - `apps/api/src/modules/learning/management/controllers/course-category-management.controller.ts:10`
  - `apps/api/src/modules/learning/management/controllers/course-management.controller.ts:8`
  - The assessments hits are the serious ones: **NH-M07 is marked COMPLETED in the ledger, but if these routes are actually called this way in production, assessment authoring/management and candidate certificates are broken the same way the experts module was.** Not yet verified live (out of scope for NH-M10) — treat NH-M07's COMPLETED status as unverified until someone checks whether the frontend actually hits these exact controllers, or reruns their e2e suite with a bootstrap that mirrors `main.ts` (many existing suites, like `experts.e2e-spec.ts` before this fix, silently omit `setGlobalPrefix`/`enableVersioning` and so can't catch this class of bug at all). The learning-module hits are currently moot since that module isn't wired into `app.module.ts` yet (see above).

## High

- `AdminDashboardService.getStats()`/`getRevenue()` fabricate revenue as `completedBookings * 50` ("Mock average price of $50 per booking") — not real payment data. Will display fabricated figures to any admin if shipped.
- `AdminDashboardService.getReport(type, ...)` returns `Math.random()`-generated rows for every report `type` regardless of what's requested — there is no real growth/finance/performance report implementation, contrary to the NH-M37 spec's four distinct report types.
- No `admin`, `superadmin`, or `course_manager` role exists in any seed script — the new `AdminModule` (`@RequireRoles('admin','superadmin','administrator')`) and the learning management controllers (`@RequireRoles('course_manager')`) are unreachable by any real account today.
- `trainers` module duplicates the `experts` domain (`/trainers/services`, `/trainers/bookings`, `/trainers/wallet`) — flagged since the NH-M00 audit, still unreconciled; risk of divergent business logic between the two.

## Medium

- **Entire backend e2e suite (all 34 spec files) fails to load** under `npx jest --config test/jest-e2e.json`: `SyntaxError: Cannot use 'import.meta' outside a module`, thrown from the generated Prisma client (`src/generated/prisma/client.ts`). Found during NH-M19. Root cause: a `moduleNameMapper` entry redirecting the generated client to a hand-written stub (`src/__mocks__/prisma-client.mock.ts`, still present but orphaned) was deleted in `04bf084` (`NH-P1-T007`), 61 commits before NH-M14 even started — this predates the whole M14–M19 arc, not caused by any of those modules. A real Postgres is reachable at the configured `DATABASE_URL` (`localhost:5434`), so these specs are meant to run against a live DB — restoring the old stub mapping was tried and made things worse (327 new failures, since the stub has no model delegates like `.userRole.deleteMany()` that many specs call directly). Real fix is a Jest ESM migration (`extensionsToTreatAsEsm` + `NODE_OPTIONS=--experimental-vm-modules` + `ts-jest` ESM preset) — not attempted, flagged as its own follow-up. Backend unit tests/typecheck/builds are unaffected.
- `getMyExpertProfile` in `apps/web/src/lib/api-client.ts` — pre-existing (M10-era) response-shape bug found during NH-M19: the backend always returns `{profile: X|null}`, but this function has dead 404-handling code and returns the raw JSON body directly typed as `ExpertProfileResult`, without unwrapping `.profile`. The equivalent NH-M19 function (`getMyCompanyProfile`) was written correctly (does unwrap). Not fixed — out of scope for M19.
- `TODO.md`'s own "PROJECT STATUS SUMMARY" table (bottom of file) contradicts both its per-module sections and `docs/task/status.md`: it lists M05/M06 as IN_PROGRESS and implies M09 needs confirming next, when the ledger and commit history (`a03dc1d`, `e26d826`) show M05/M06 COMPLETED and M09 as UNVERIFIED. Needs a doc-sync pass.
- Stale test expectations (not product regressions): 9 unit specs (registration/email-verification vs. later phone-verification+onboarding changes), 1 validation spec (currency rejects EUR/GBP), 1 auth E2E (`/auth/me` expects `ACTIVE`, onboarding now returns `PROFILE_SETUP`).
- `apps/api/src/modules/auth/phone-verification.service.ts:110` — `// TODO: Integrate SMS service to send OTP` — phone OTP delivery is a stub; cannot work outside dev.
- Admin dashboard `getGrowth()`/`getRevenue()` each run 30 sequential `await`ed Prisma queries in a for-loop (one per day) instead of a single grouped query — see Performance.

## Low

- New learning controllers use `@Query() query: any` / `@Req() req: any` in several places, bypassing the validation-pipe/DTO pattern used elsewhere in the codebase.

---

# Security Issues

- **IDOR resource-existence leak** — see Bugs → Critical, 10 unfixed call sites across `projects`, `skills`, `trainers` (booking, evaluation, trainer profile).
- **Unreachable-but-present admin surface** — `AdminModule` and learning-management endpoints are gated on roles nobody can hold yet; low risk today, but must be paired with role-seeding _and_ a review of who can be granted `admin`/`superadmin` before going live — don't let role-seeding land without an access-review step.
- **Mocked financial data behind an admin-labeled endpoint** — `totalRevenue`/`revenue` trend are fabricated, not derived from the `payment`/`payout` domain (which doesn't exist yet, NH-M29/M34). Shipping this as-is to a real SuperAdmin would misrepresent platform revenue.
- **SMS OTP not implemented** — phone verification cannot deliver real codes in production (stub only).
- Carried over from `docs/phase-1/known-limitations.md` (still open, no phase since has closed them):
  - HTTPS/HSTS/CSP/security headers not yet enforced at the infra layer.
  - Global rate limit is a single shared counter (100/min), not per-user/per-IP.
  - Expired sessions are never pruned (no periodic job).
  - Verification/reset tokens delivered via URL query params; production URL-logging exposure unverified.
  - Secrets are in `.env`, not a secrets manager; no DB backup/point-in-time recovery configured.

---

# Performance Improvements

- Replace the 30-iteration sequential-`await` day-loops in `AdminDashboardService.getGrowth()`/`getRevenue()` with a single grouped query (`groupBy` + date truncation) — currently 60 round-trips per dashboard load across the two endpoints.
- Add caching to admin dashboard/report endpoints — explicitly required by the NH-M37 spec, not implemented (no TTL/cache layer on any `admin-dashboard.service.ts` method).
- No caching on `GET expert/availability/slots/preview` (NH-M12) — recomputes from scratch every call; fine at current scale, revisit once real booking traffic exists.
- Database indexing: new learning models (`Course`, `CourseModule`, `Lesson`, `CourseEnrollment`, `LessonProgress`) already have reasonable indexes in the migration; no action needed there, but verify existing high-traffic tables (`Booking`, `AssessmentAttempt`) under real load once M38 integration pass starts.

---

# DevOps Tasks

- CI (`.github/workflows/ci.yml`) exists but per `known-limitations.md` still needs a proper baseline-test + secrets-validation gate (NH-P0-T009/T010 were PLANNED, not implemented as of Phase 1).
- No production Docker/Kubernetes manifests reviewed in this pass — infra dir exists (`infrastructure/`) but out of scope for this audit; revisit before NH-M39 release gate.
- Health checks: `/health` endpoint exists (NH-M01); confirm it covers Redis/queue/storage dependencies, not just DB.
- Logging/monitoring/backups: all still open, see Security Issues and TODO.md Infrastructure checklist (DNS, SSL, CDN, managed Postgres/Redis/object storage, Sentry, ELK/Datadog — none configured).

---

# Database Tasks

- New models `CourseCategory`, `Course`, `CourseModule`, `Lesson`, `CourseEnrollment`, `LessonProgress` (+ 6 enums) added via migration `20260723083417_add_learning_content_foundation` — schema is sound (proper indexes, unique constraints, cascade rules) but `CourseEnrollment`/`LessonProgress` have **no service/controller using them yet** — dead schema until enrollment/progress API is built.
- RBAC tables still incomplete: `Permission` and `RolePermission` models not created (NH-M04 deferred scope) — blocks fine-grained authorization beyond role-code checks.
- No admin/superadmin/course_manager rows in any seed script (see Bugs → High).

---

# API Tasks

| Endpoint                                                                                              | Status                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /v1/courses`                                                                                     | Broken (unreachable — module not registered)                                         |
| `GET /v1/courses/:courseIdOrSlug`                                                                     | Broken (unreachable)                                                                 |
| `GET/POST/PUT /v1/manage/courses`, `/:id/publish`, `/:id/archive`, `/:id/republish`, `/:id/readiness` | Broken (compile error + unreachable + no `course_manager` role exists)               |
| `GET/POST/PUT/POST /v1/manage/courses/categories*`                                                    | Broken (unreachable)                                                                 |
| `POST/PUT/DELETE /v1/manage/courses/:courseId/modules*`                                               | Broken (unreachable)                                                                 |
| Enrollment / lesson-progress endpoints                                                                | Pending (not built at all)                                                           |
| `GET /admin/dashboard/stats`                                                                          | Done (functional; revenue field is mocked)                                           |
| `GET /admin/dashboard/growth`                                                                         | Done (functional; N+1-style, see Performance)                                        |
| `GET /admin/dashboard/revenue`                                                                        | Done (functional; entirely mocked data)                                              |
| `GET /admin/dashboard/activity`                                                                       | Done                                                                                 |
| `GET /admin/dashboard/alerts`                                                                         | Done (single hardcoded alert condition)                                              |
| `GET /admin/reports/:type`                                                                            | Broken/Mock (ignores `type` semantics beyond echoing it back, returns random rows)   |
| `GET /admin/reports/general`, `/growth`, `/finance`, `/performance` (spec'd as distinct endpoints)    | Pending (spec calls for 4 distinct endpoints; only one generic `:type` route exists) |

---

# Frontend Tasks

**`/admin` dashboard**
Status: In Progress (~70%)
Missing: activity heatmap, country-breakdown chart (both explicitly in the NH-M37 spec)

**`/admin/reports`**
Status: In Progress (~70%)
Missing: PDF export (CSV export exists), distinct report-type data (all types currently show the same mocked shape)

**Candidate learning/course catalog UI**
Status: Not started — no frontend exists for NH-M08 at all

**`/profile` page**
Status: Done (uncommitted small fix) — added missing `Experience` and `Education` quick-links alongside existing Skills/Languages/Certifications/Achievements/CV links

**Expert booking frontend** (M14)
Status: Done 2026-07-23 — `/find-expert/[slug]` booking panel, `/bookings` (candidate), `/expert/bookings` (expert)

**Evaluation/review frontend** (M16)
Status: Done 2026-07-23 — feedback panels on `/bookings` and `/expert/bookings`, new `/expert/reviews`, rating shown on `/find-expert` + `/find-expert/[slug]`

**Wallet frontend** (M17)
Status: Done 2026-07-24 — new `/expert/wallet` page (balance, masked payout accounts, payout requests)

**Expert dashboard** (M18)
Status: Done 2026-07-24 — new `/expert/dashboard` page (stat tiles, upcoming sessions, wallet + reviews summaries)

---

# Backend Tasks

- Learning: wire `LearningModule`, restore missing publication/readiness service file, add enrollment + lesson-progress services (see Pending Tasks → Learning)
- Admin: replace mocked revenue/report data with real queries once payment/payout domain exists (blocked on NH-M29/M34)
- Expert marketplace (M10–M18, fully complete): slot computation engine (M12) with booking-conflict exclusion (M14); evaluation/review + moderation hooks (M16); wallet/payout ledger (M17, balances real-zero pending NH-M29 payment capture); dashboard aggregation (M18)
- RBAC: `Permission`/`RolePermission` models + seed (M04 remainder)

---

# AI Tasks

- No AI features implemented or scheduled in the current 40-module roadmap (`claude_ai_brain.md`). Candidates for future consideration once core marketplace (Phases 3–6) lands: résumé/CV analysis, ATS scoring, interview coaching assist, expert/job recommendation engine.

---

# Testing Tasks

- **Unit tests**: 9 stale specs (registration/email-verification vs. onboarding changes), 1 stale validation spec (currency) — fix expectations, not product bugs.
- **E2E tests**: 1 stale assertion (`/auth/me` ACTIVE vs PROFILE_SETUP); suites must be run per-suite (`pnpm --filter @nexthire/api test:e2e -- --testPathPattern <suite>`) — parallel runs race on shared Postgres.
- **Zero test coverage**: new `learning` module (0 spec files) and new `admin` module (0 spec files) — confirmed via repo scan.
- **Frontend test gaps** (from `docs/phase-2/known-limitations.md`): assessment attempt workspace, certificate download/verification, leaderboard, manager assessment builder all under-covered.
- Coverage %: not measured in this pass (no coverage report run) — recommend adding a coverage gate before NH-M39.

---

# Documentation

- `TODO.md` bottom summary table is stale relative to its own module sections and `docs/task/status.md` — needs a sync pass (see Bugs → Medium).
- No API docs (Swagger tags exist per-controller) covering the learning module's actual reachability status — Swagger will show routes that 404 in practice until the module is registered.
- `docs/security/mfa.md` and `docs/api/mfa.md` already correctly document the as-built MFA deviation from the original sketch — good pattern to repeat for NH-M08 once it lands (document the real shape, not the pre-written sketch).

---

# Refactoring

- Collapse the 404→400 IDOR pattern into a single `NotFoundException` helper (or shared ownership-check utility) and apply across `projects`, `skills`, `trainers/booking`, `trainers/evaluation`, `trainers/trainer` — 10 call sites, one shared fix.
- Reconcile `trainers` vs `experts` domain overlap before building further on either (booking/services/wallet exist in both conceptually).
- Replace `any`-typed request/query params in the new learning controllers with typed DTOs (`CreateCourseInput`, etc. already exist in `@nexthire/types` — just not consistently used at the controller boundary).

---

# Technical Debt

- Learning module scaffolding was committed to the working tree ahead of being wired up or made to compile — needs a decision: finish it now (small lift: create the missing service, register the module, seed the role) or shelve it cleanly until NH-M08 is actually next in the queue.
- `trainers`/`experts` duplication (repeated flag since NH-M00) — M13/M14/M16/M17 all landed on new `ExpertProfile`-scoped models instead; the legacy `trainers` domain (`Booking`/`Evaluation`/`WalletAccount`) is now fully unused dead weight, not blocking anything further.
- Pre-existing lint debt (per `docs/phase-1/known-limitations.md`): ~20 API ESLint errors (audit/storage services, unused vars, `any` types), ~15 web lint errors (unescaped entities, `any`, setState-in-effect).

---

# Next Priority

1. Fix the `tsc` compile break: create/restore `course-publication.service.ts` or remove the dangling import — unblocks builds immediately.
2. Decide fate of NH-M08 uncommitted work: finish wiring (`LearningModule` + `app.module.ts` + `course_manager` seed) or shelve — don't leave dead, non-compiling code in the tree.
3. Fix the 10-call-site IDOR leak across `projects`, `skills`, `trainers` (booking/evaluation/trainer) — same fix pattern already proven in NH-M06.
4. Sync `TODO.md`'s bottom summary table with `docs/task/status.md` and actual commit history.
5. Seed `admin`/`superadmin` roles (and decide grant process) before treating NH-M37 as reachable/testable.
6. Replace mocked revenue/report data in `AdminDashboardService` with real queries or clearly label as placeholder pending NH-M29/M34.
7. Fix N+1-style day-loop queries in `getGrowth()`/`getRevenue()`.
8. Write unit/E2E tests for the learning module before it ships.
9. Write unit/E2E tests for the admin module before it ships.
10. ~~Complete NH-M09 verification pass~~ — done 2026-07-23, see Completed Features.
11. ~~Complete NH-M10 final verification pass~~ — done 2026-07-23, see Completed Features. Surfaced a critical follow-on: sweep the same double-`v1` routing bug across NH-M07's 7 controllers (now top of this list in practice — do this before trusting any assessments-module route).
12. ~~Build the NH-M12 slot computation/preview engine~~ — done 2026-07-23, see Completed Features. Also fixed the same path-drift bug in NH-M11's frontend (expertise/services/expertise-areas) found along the way.
13. ~~Reconcile `trainers` vs `experts` domain duplication~~ — resolved by NH-M14/NH-M16/NH-M17's domain-fork decisions (`ExpertBooking`/`ExpertSessionEvaluation`/`ExpertReview`/`ExpertWalletAccount`, all on `ExpertProfile`, none touching `trainers`); the legacy domain is now fully unused dead weight.
14. Fix 9 stale unit specs + 1 stale validation spec + 1 stale E2E assertion.
15. ~~Ship NH-M13 public expert discovery/search~~ — done 2026-07-23, see Completed Features.
16. ~~Build NH-M14 booking frontend + slot-engine integration~~ — done 2026-07-23, see Completed Features. Booking-conflict exclusion now wired into the M12 slot engine.
17. ~~Build NH-M16 evaluation/review frontend~~ — done 2026-07-23, see Completed Features. Real aggregate ratings now wired into `/find-expert` and `/find-expert/[slug]` (closes M13's placeholder), plus admin moderation hooks (`manage/experts/reviews` hide/unhide).
18. ~~Build NH-M17 wallet/payout frontend~~ — done 2026-07-24, see Completed Features.
19. ~~Build NH-M18 expert dashboard and reports~~ — done 2026-07-24, see Completed Features. Expert-marketplace arc (M10–M18) now fully complete end-to-end on the `ExpertProfile` domain; legacy `trainers` is fully unused dead weight.
20. Complete RBAC remainder: `Permission`/`RolePermission` models + full seed (NH-M04 remainder).
21. ~~Begin NH-M19 (Company Profile)~~ — done 2026-07-24, see Completed Features. First module of the Company/Recruiter phase; found (not fixed) a pre-existing `getMyExpertProfile` shape bug and a repo-wide pre-existing e2e-harness break — both in Bugs → Medium.
22. Fix the repo-wide e2e-harness break (Bugs → Medium) via a Jest ESM migration — blocks all 34 e2e spec files, not just future ones.
23. ~~Begin NH-M20 (Company Team and Permissions)~~ — done 2026-07-24, see Completed Features. Left a documented follow-up: M19's profile/application endpoints are still owner-only, not membership-aware.
24. ~~Begin NH-M21 (Company Candidate Search)~~ — done 2026-07-24, see Completed Features. CV content/PDF viewing for companies deferred (metadata-only), same boundary style as M19→M20.
25. Begin NH-M22 (Shortlists and Talent Pipeline) — next module of the Company/Recruiter phase.

---

# Current Task

**Fix the NH-M08 (Learning Content) build break and decide whether to complete or shelve the uncommitted scaffolding.**

Concretely, in order:

1. Add the missing `apps/api/src/modules/learning/management/services/course-publication.service.ts` exporting `CoursePublicationService` and `CourseReadinessService` (referenced by `course-management.controller.ts` but absent — this is the actual `tsc` failure).
2. Create `apps/api/src/modules/learning/learning.module.ts` wiring all 6 existing controllers/services/repositories, and add `LearningModule` to `app.module.ts` (alongside the already-added `AdminModule`).
3. Add `course_manager` to the role seed so the management endpoints are reachable by at least one real account.
4. Re-run `tsc --noEmit` to confirm a clean build, then write a minimal E2E smoke test for the candidate catalog route.

When this is verified end-to-end, move NH-M08 to Completed Features (or, if scope is intentionally partial, keep it in In Progress with an honest %) and advance to the next highest-priority item in **Next Priority**.

---

# Project Health

Architecture: ⭐⭐⭐⭐☆
Security: 60% (strong patterns in newer modules — MFA, magic-byte validation, private storage — undermined by the unfixed IDOR class and unreachable-but-present admin surface)
Performance: 65% (no major hot-path issues found; new admin dashboard has an easy-to-fix N+1 pattern)
Testing: 55% (strong E2E coverage on completed modules; zero coverage on both uncommitted new modules)
Documentation: 70% (unusually thorough per-module docs and known-limitations tracking; let down by one stale summary table)
Production Ready: 30% (core candidate-side product is solid; expert marketplace half-built; company/recruiter side, payments, messaging, and the release-gate module haven't started)

---

# Notes

- `docs/task/status.md` is the authoritative ledger; `TODO.md` is the human-facing checklist and should be treated as secondary whenever the two disagree (see Bugs → Medium for the current disagreement).
- The project follows a strict one-module-per-execution workflow with conventional commits tagged `[NH-M<ID>]` — the uncommitted learning/admin work in the tree breaks that convention (partial, uncommitted, spans two modules at once) and should be split into two clean commits once each is finished.
- Recurring engineering gotchas worth remembering for whoever picks up the Next Priority list: the 404-vs-400 IDOR pattern keeps recurring across modules written before NH-M06's fix — grep for it in any module touched next; BullMQ async jobs need the shared `QueueModule` import, not a local `BullModule.registerQueue`; Jest + `vi.mock('next/navigation', ...)` needs a hoisted stable `router` object or `useCallback` deps trigger infinite re-render loops under test only.
