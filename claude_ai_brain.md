# Claude AI Brain — NextHire Master Development Instruction

**File:** `claude_ai_brain.md`  
**Project:** NextHire  
**Purpose:** Permanent repository-level instruction and module roadmap for Claude  
**Execution Model:** One complete end-to-end module at a time  
**Primary Roles:** Candidate, Trainer/Expert, Company, SuperAdmin  
**Status Source:** Repository code, migrations, tests, Git history, and `docs/task/status.md`

---

# 1. Mission

You are the primary coding agent for NextHire.

NextHire is a career development, interview preparation, assessment, learning, expert consultation, recruitment, and talent-discovery platform connecting:

```text
Candidate
Trainer / Expert
Company
SuperAdmin
```

Work **module-wise**.

A normal business module is complete only when its required:

```text
Database
Backend API
Frontend UI
Authorization
Validation
Security
Tests
Documentation
Status update
Git commit
```

are implemented and verified.

Do not produce plans only. Inspect the repository, implement real code, run verification, update documentation, and create one clean commit per completed module.

---

# 2. Expected Stack

The repository is authoritative. Expected stack:

```text
Monorepo: pnpm + Turborepo
Runtime: Node.js 22
Frontend: Next.js + TypeScript
Backend: NestJS + TypeScript
Database: PostgreSQL
ORM: Prisma
Cache / Queue: Redis + BullMQ
Realtime: Socket.IO
Storage: MinIO
Development Email: Mailpit
Containers: Docker
API Prefix: /api/v1
Swagger: /api/docs
Web Port: 3000
API Port: 3001
Future Mobile: Flutter
```

Never introduce Laravel.

Do not replace established libraries or architecture without an explicit approved decision.

---

# 3. Source of Truth

Before every module, inspect:

```text
README.md
claude_ai_brain.md
docs/task/status.md
docs/
package.json
pnpm-workspace.yaml
turbo.json
apps/api
apps/web
packages/
Prisma schema and migrations
tests
Swagger and runtime routes
environment examples
Docker files
Git status and recent history
```

Priority:

```text
1. Running repository behavior
2. Database schema and migrations
3. Existing tests
4. Shared contracts
5. Existing documentation
6. This roadmap
```

When code and this file differ, document the difference. Do not guess or duplicate the implementation.

---

# 4. How to Select the Next Module

When the user says `next`, `continue`, or `start next module`:

1. Read this file and `docs/task/status.md`.
2. Inspect code, migrations, tests, Swagger, and Git history.
3. Find the first roadmap module not verified as complete.
4. Verify dependencies.
5. When already fully implemented:
   - run mandatory checks;
   - mark `COMPLETED` or `VERIFIED`;
   - do not recreate it;
   - move to the next incomplete module.
6. When partially implemented:
   - reuse existing code;
   - complete missing backend, frontend, tests, security, and docs.
7. Implement exactly one complete module.
8. Run all mandatory checks.
9. Create exactly one module-specific commit only after checks pass.
10. Update `docs/task/status.md`.
11. Report the next module.
12. Stop.

Do not start a second business module in the same execution.

---

# 5. Status Model

Use:

```text
UNVERIFIED
NOT_STARTED
IN_PROGRESS
BLOCKED
COMPLETED
VERIFIED
DEFERRED
```

Never mark a module complete based only on a task file, controller, route, database table, frontend page, or unverified claim.

End-to-end completion is required.

---

# 6. Complete Module Standard

## Database

- Prisma models and enums
- relations
- constraints and indexes
- safe migrations
- backfill where needed
- Prisma Client generation
- migration verification

## Backend

- NestJS module
- controllers and services
- repository/data access
- DTOs and shared validation
- authorization and ownership
- lifecycle rules
- transactions and concurrency protection
- rate limiting
- audit events
- controlled errors
- Swagger

## Frontend

- Next.js routes
- typed API client
- query/cache hooks
- forms
- list and detail pages
- loading, empty, error, permission, and session states
- responsive UI
- accessibility
- real API integration

Never create mock production UI for required real data.

## Testing

- validation tests
- unit tests
- database/integration tests
- authorization and IDOR tests
- API E2E
- frontend component tests
- frontend E2E
- accessibility checks
- security regression
- manual smoke

## Documentation

Update applicable:

```text
README.md
docs/architecture/
docs/product/
docs/security/
docs/api/
docs/frontend/
docs/task/status.md
```

## Git

Exactly one commit after every mandatory check passes.

No commit when blocked or verification fails.

---

# 7. Git Rules

For every module:

1. Inspect `git status`.
2. Preserve unrelated user changes.
3. Modify only module-related files.
4. Stage only module changes.
5. Run `git diff --check`.
6. Run `git diff --cached --check`.
7. Create one conventional commit containing the module ID.
8. Report hash and message.

Never amend, rebase, squash, push, force-push, tag, or invent Git identity.

Pattern:

```text
feat(<scope>): <module result> [<MODULE-ID>]
```

Missing Git identity means `BLOCKED`.

---

# 8. Global API Rules

Base prefix:

```text
/api/v1
```

Incorrect:

```text
/api/v1/v1/candidates/me/profile
```

Correct:

```text
/api/v1/candidates/me/profile
```

Before adding/fixing routes inspect:

- global prefix;
- controller prefix;
- Swagger configuration;
- API client base URL.

Do not maintain duplicate routes without a documented compatibility need.

API standards:

- session-derived identity
- no client-supplied owner ID
- safe error envelope
- pagination and deterministic sorting
- exact decimal strings for money
- UTC timestamps
- IANA timezone
- safe DTOs, not raw Prisma models
- no secrets or storage keys
- Swagger, rate limits, and audit

---

# 9. Global Security Policy

## MFA

```text
Candidate: optional
Trainer/Expert: mandatory for sensitive workflows
Company privileged members: mandatory
SuperAdmin: mandatory
```

## Authorization

Every protected operation enforces:

```text
authentication
role
permission
ownership
account status
resource lifecycle
company/tenant boundary
```

## Privacy

Never leak:

```text
password hashes
tokens/cookies
TOTP secrets or recovery codes
private contact data without policy
date of birth publicly
salary without permission
verification documents
government ID data
raw MinIO keys
signed URLs
private audit details
Candidate assessment answers
correct answers before completion
```

## Files

- private MinIO by default
- MIME and file-signature checks
- size limits
- unguessable keys
- sanitized names
- SHA-256 where required
- short-lived authorized access
- no signed URL storage/logging
- temporary cleanup

## Web

- reject unsafe URL protocols
- sanitize text
- never execute user HTML/CSS/script
- prevent XSS, IDOR, and mass assignment
- no sensitive local/session storage
- clear private caches on logout
- use private/no-store behavior for sensitive pages

---

# 10. UX and Accessibility

All frontend modules must support:

```text
360px mobile
768px tablet
1024px laptop
1440px desktop
keyboard navigation
screen readers
visible focus
semantic headings
linked labels
error summaries
non-color-only status
accessible dialogs/tables/charts
loading/save announcements
```

Do not rely only on drag and drop. Provide keyboard move controls.

---

# 11. Role Workflows

## Candidate

```text
Register
Verify email
Login
Complete profile
Build/download CV
Practice assessments
Complete lessons
Find Expert
Book session
Attend session
Receive feedback
Review Expert
Browse jobs
Apply to jobs
Communicate
Manage privacy and notifications
```

## Trainer / Expert

Canonical backend role: `EXPERT`.

```text
Enable MFA
Create Expert profile
Upload verification
Submit application
Receive approval
Add expertise
Create services
Set 30/35/40-minute duration
Set pricing
Set availability
Publish public profile
Receive and manage bookings
Conduct sessions
Evaluate Candidate
Receive reviews
Track earnings
Request payout
```

## Company

```text
Enable MFA
Create profile
Submit verification
Receive approval
Invite team
Assign roles
Search eligible Candidates
View authorized profiles/CVs
Create shortlists
Contact Candidates
Publish jobs
Manage applicants
Communicate
View recruitment analytics
```

## SuperAdmin

```text
Mandatory MFA
Platform dashboard
Users/roles/permissions
Expert verification
Company verification
Catalogs/content
Assessments/learning
Payments/refunds/commissions/payouts
Audit/security
Templates/settings/feature flags
Reports/moderation/support
```

---

# 12. Master Module Roadmap

Every user-facing module must include backend and frontend UI.

## NH-M00 — Repository Audit and Status Reconciliation

- inspect architecture and existing modules;
- identify partial implementations and route mismatches;
- reconcile status;
- document build/test health.

Commit:

```text
chore(project): reconcile repository module status [NH-M00]
```

## NH-M01 — Platform Foundation

Backend/infrastructure:

- config validation;
- PostgreSQL, Redis, BullMQ, MinIO, Mailpit, Docker;
- health/readiness;
- logging/request IDs;
- error envelope;
- Swagger;
- CI.

Frontend:

- environment/API configuration;
- global error/loading boundaries.

Commit:

```text
chore(platform): complete platform foundation [NH-M01]
```

## NH-M02 — Registration and Email Verification

Backend:

- Candidate registration;
- verification/resend;
- Argon2id password hashing;
- email, audit, rate limits.

Frontend:

- registration;
- verification;
- resend;
- all states.

Commit:

```text
feat(auth): implement registration and email verification [NH-M02]
```

## NH-M03 — Login, Sessions, and Password Recovery

Backend:

- login;
- access/refresh;
- rotating refresh cookie;
- current user;
- sessions/revoke/logout-all;
- forgot/reset/change password.

Frontend:

- login;
- forgot/reset;
- session/security pages.

Commit:

```text
feat(auth): implement login sessions and password recovery [NH-M03]
```

## NH-M04 — TOTP MFA, Roles, and Permissions

Backend:

- TOTP setup/challenge;
- recovery codes;
- trusted devices;
- RBAC/permissions;
- mandatory MFA policy.

Frontend:

- setup QR/manual code;
- challenge;
- recovery codes;
- trusted devices.

Commit:

```text
feat(auth): implement MFA and role access controls [NH-M04]
```

---

# Candidate Modules

## NH-M05 — Candidate Profile

Backend:

- basic profile;
- preferences;
- education;
- experience;
- projects;
- skills;
- languages;
- certifications;
- training;
- achievements;
- links;
- photo;
- privacy;
- public profile;
- completion;
- CV readiness.

Frontend:

- dashboard;
- every form;
- CRUD/reorder;
- privacy/public preview;
- responsive accessible UI.

Repository hint:

```text
Profile, Preferences, Education, and Experience APIs may already exist.
Verify and reuse.
Investigate /api/v1/v1 duplicate prefix.
```

Commit:

```text
feat(candidate): implement complete candidate profile [NH-M05]
```

## NH-M06 — CV Builder and PDF Export

Backend:

- multiple CVs;
- profile snapshots;
- independent CV content;
- templates/theme;
- readiness;
- asynchronous PDF generation;
- private storage;
- history/download;
- archive/duplicate.

Frontend:

- CV dashboard;
- creation;
- editor;
- template selection;
- preview;
- generation/history/download.

Commit:

```text
feat(cv): implement CV builder and PDF export [NH-M06]
```

## NH-M07 — Assessment and Exam Simulation

Backend:

- categories;
- question bank;
- authoring/publishing;
- attempts/snapshots;
- autosave/timer;
- scoring/results;
- analytics;
- leaderboard;
- retakes;
- certificates.

Frontend:

- management authoring;
- Candidate catalog/workspace;
- results/analytics;
- leaderboard/certificates.

Commit:

```text
feat(assessment): implement assessment and exam simulation [NH-M07]
```

## NH-M08 — Learning Content and Progress

Backend:

- course/category;
- modules/lessons;
- publishing;
- enrollment/progress/completion.

Frontend:

- catalog;
- lesson reader;
- progress;
- management editor.

Commit:

```text
feat(learning): implement courses lessons and progress [NH-M08]
```

## NH-M09 — Candidate Dashboard

Backend:

- aggregated profile/CV/assessment/learning/booking/job summary.

Frontend:

- Candidate dashboard;
- activity and quick actions;
- responsive empty states.

Commit:

```text
feat(candidate): implement candidate dashboard [NH-M09]
```

---

# Trainer / Expert Modules

## NH-M10 — Expert Profile and Verification

Backend:

- Expert profile/application;
- private documents;
- readiness/submission;
- management review;
- request changes/reject/approve;
- transactional role assignment;
- mandatory MFA.

Frontend:

- Become an Expert;
- profile/documents/readiness/status;
- admin review queue/detail.

Commit:

```text
feat(expert): implement expert onboarding and verification [NH-M10]
```

## NH-M11 — Expert Expertise, Services, and Pricing

Backend:

- expertise catalog;
- service CRUD;
- 30/35/40-minute duration;
- decimal BDT pricing;
- readiness/lifecycle.

Frontend:

- expertise and service management;
- duration/pricing;
- activate/deactivate/archive.

Commit:

```text
feat(expert): implement expertise services and pricing [NH-M11]
```

## NH-M12 — Expert Availability and Slot Engine

Backend:

- IANA timezone;
- weekly availability;
- buffers;
- notice/booking window;
- date overrides;
- DST-safe slots;
- overlap/concurrency.

Frontend:

- weekly scheduler;
- override calendar;
- slot preview.

Commit:

```text
feat(expert): implement availability and slot engine [NH-M12]
```

## NH-M13 — Expert Discovery and Public Profile

Backend:

- publication/readiness;
- public slug/projection;
- search/filter/sort;
- public services.

Frontend:

- directory;
- filters;
- profile;
- service detail;
- SEO/accessibility.

Commit:

```text
feat(expert): implement expert discovery and public profiles [NH-M13]
```

## NH-M14 — Expert Booking and Scheduling

Backend:

- booking request;
- slot reservation;
- price snapshot;
- accept/reject;
- reschedule/cancel;
- conflicts/expiration/history.

Frontend:

- Candidate booking;
- Expert booking inbox;
- detail/timeline/actions.

Commit:

```text
feat(booking): implement expert booking workflow [NH-M14]
```

## NH-M15 — Interview and Coaching Session

Backend:

- session lifecycle;
- secure join;
- provider abstraction;
- 30/35/40-minute timer;
- no-show;
- private notes/events.

Frontend:

- lobby;
- join/session workspace;
- timer;
- connection/error states;
- Expert notes.

Commit:

```text
feat(session): implement interview and coaching sessions [NH-M15]
```

## NH-M16 — Feedback, Evaluation, Ratings, and Reviews

Backend:

- Expert Candidate evaluation;
- Candidate feedback/review;
- eligibility;
- aggregate ratings;
- moderation hooks.

Frontend:

- feedback/evaluation forms;
- review list/summary;
- moderation view.

Commit:

```text
feat(review): implement session feedback and reviews [NH-M16]
```

## NH-M17 — Expert Earnings, Wallet, and Payout

Backend:

- earning ledger;
- commission;
- balances;
- wallet transactions;
- payout method/request/review;
- reconciliation.

Frontend:

- earnings dashboard;
- transactions;
- payout setup/request;
- management queue.

Commit:

```text
feat(finance): implement expert earnings wallet and payout [NH-M17]
```

## NH-M18 — Expert Dashboard and Reports

Backend:

- bookings/services/availability/ratings/earnings aggregates.

Frontend:

- Expert dashboard;
- timelines/cards/reports.

Commit:

```text
feat(expert): implement expert dashboard and reports [NH-M18]
```

---

# Company Modules

## NH-M19 — Company Profile and Verification

Backend:

- Company profile;
- private verification documents;
- readiness;
- review/approve/reject/request changes;
- verified status;
- MFA.

Frontend:

- onboarding/profile/documents/status;
- SuperAdmin review.

Commit:

```text
feat(company): implement company onboarding and verification [NH-M19]
```

## NH-M20 — Company Team and Permissions

Backend:

- invitations;
- owner/admin/recruiter/viewer roles;
- member management;
- tenant isolation.

Frontend:

- team list;
- invitations;
- role/access management.

Commit:

```text
feat(company): implement company team and permissions [NH-M20]
```

## NH-M21 — Company Candidate Search

Backend:

- verified-company access;
- Candidate privacy projection;
- search/filter;
- profile/CV authorization;
- audit.

Frontend:

- talent search;
- filters/cards;
- Candidate profile/CV states.

Commit:

```text
feat(company): implement candidate discovery for verified companies [NH-M21]
```

## NH-M22 — Shortlists and Talent Pipeline

Backend:

- shortlist CRUD;
- Candidate membership;
- notes/tags;
- stages;
- movement/order;
- Company isolation.

Frontend:

- shortlists;
- accessible pipeline board/list;
- notes/tags/stage movement.

Commit:

```text
feat(company): implement shortlists and talent pipeline [NH-M22]
```

## NH-M23 — Candidate Contact, Email, SMS, and Consent

Backend:

- contact eligibility;
- consent/privacy;
- email/SMS provider abstraction;
- templates/history;
- limits/audit.

Frontend:

- contact composer;
- eligibility;
- communication history;
- template management where applicable.

Commit:

```text
feat(communication): implement company candidate contact workflow [NH-M23]
```

## NH-M24 — Job Posting and Public Job Board

Backend:

- job CRUD;
- draft/publish/close/archive;
- requirements/skills/location/compensation;
- public search/detail.

Frontend:

- Company job management/editor;
- public jobs and filters;
- job detail.

Commit:

```text
feat(jobs): implement job posting and public job board [NH-M24]
```

## NH-M25 — Job Applications and Applicant Tracking

Backend:

- Candidate application/withdraw;
- CV snapshot/reference;
- Company applications;
- stages/shortlist/reject/notes/history;
- tenant privacy.

Frontend:

- Candidate apply/history/detail;
- Company applicant list/detail/pipeline.

Commit:

```text
feat(jobs): implement job applications and applicant tracking [NH-M25]
```

## NH-M26 — Company Dashboard and Analytics

Backend:

- jobs/applicants/stages/shortlists/team/communication aggregates.

Frontend:

- dashboard/funnel/job performance/team activity;
- accessible reports.

Commit:

```text
feat(company): implement company dashboard and analytics [NH-M26]
```

---

# Shared Platform Modules

## NH-M27 — Messaging and Realtime Conversations

Backend:

- conversations;
- participant rules;
- messages/read receipts;
- attachments;
- Socket.IO;
- moderation/rate limits.

Frontend:

- inbox;
- threads;
- attachments;
- realtime/unread states.

Commit:

```text
feat(messaging): implement conversations and realtime messages [NH-M27]
```

## NH-M28 — Notifications and Preferences

Backend:

- in-app/email/SMS hooks;
- unread/read-all;
- preferences;
- event consumers/deduplication.

Frontend:

- notification center;
- unread badge;
- preference page.

Commit:

```text
feat(notification): implement notifications and preferences [NH-M28]
```

## NH-M29 — Payments, Refunds, and Commission

Backend:

- provider abstraction;
- intent/webhook;
- booking payment;
- refunds;
- commission;
- idempotency;
- ledger/reconciliation.

Frontend:

- checkout;
- status/receipt/history;
- refund;
- admin transaction/refund views.

Never store raw card data.

Commit:

```text
feat(payment): implement payments refunds and commission [NH-M29]
```

## NH-M30 — Secure File and Media Management

Backend:

- upload/presign/finalize;
- ownership;
- privacy classification;
- MIME/signature/checksum;
- malware hook;
- retention/deletion;
- authorized access.

Frontend:

- reusable uploader;
- progress/validation/preview/remove/replace;
- accessibility.

Commit:

```text
feat(files): implement secure file and media management [NH-M30]
```

---

# SuperAdmin Modules

## NH-M31 — Users, Roles, and Permissions

Backend:

- user search/detail;
- suspend/activate/lock;
- roles/permissions;
- MFA/audit.

Frontend:

- user list/detail;
- account actions;
- role/permission management.

Commit:

```text
feat(admin): implement user role and permission management [NH-M31]
```

## NH-M32 — Verification and Moderation Center

Backend:

- unified Expert/Company queues;
- assignment/review/decision;
- private document access;
- decision history/moderation.

Frontend:

- queue/filter/detail;
- documents;
- decision dialogs;
- moderation.

Commit:

```text
feat(admin): implement verification and moderation center [NH-M32]
```

## NH-M33 — Catalog and Content Management

Backend:

- countries/languages/skills/expertise/currencies/service types;
- assessment/learning catalogs;
- communication templates;
- activate/archive.

Frontend:

- catalog/content CRUD;
- filters;
- usage warnings.

Commit:

```text
feat(admin): implement catalog and content management [NH-M33]
```

## NH-M34 — Finance Operations

Backend:

- transactions;
- refunds;
- commissions;
- Expert earnings;
- payout review;
- reconciliation/export;
- immutable audit.

Frontend:

- finance dashboard;
- transaction/refund/payout queues;
- commission settings;
- reports.

Commit:

```text
feat(admin): implement finance operations [NH-M34]
```

## NH-M35 — Audit, Security Events, and Support

Backend:

- audit search/detail;
- security events;
- session revocation tools;
- support-safe lookup;
- retention.

Frontend:

- audit/security dashboard;
- filters/detail;
- permissioned support tools.

Commit:

```text
feat(admin): implement audit security and support tools [NH-M35]
```

## NH-M36 — Settings and Feature Flags

Backend:

- typed settings;
- feature flags;
- commission/currency/booking policies;
- maintenance mode;
- history/cache invalidation.

Frontend:

- settings;
- flags;
- validation/confirmation/audit context.

Commit:

```text
feat(admin): implement platform settings and feature flags [NH-M36]
```

## NH-M37 — SuperAdmin Dashboard and Reports

Backend:

- growth;
- role metrics;
- verification;
- bookings/sessions;
- jobs/applications;
- assessment/learning;
- revenue/payout/refund;
- security aggregates.

Frontend:

- KPI dashboard;
- date filters;
- accessible charts/tables;
- reports.

Commit:

```text
feat(admin): implement platform dashboard and reports [NH-M37]
```

---

# Final Modules

## NH-M38 — End-to-End Integration

Verify:

```text
Candidate registration → profile → CV → assessment
Expert application → approval → service → availability → booking → session → review → payout
Company verification → team → Candidate search → shortlist → contact → job → application
SuperAdmin review → moderation → finance → audit → reporting
```

Deliver cross-module E2E, navigation cleanup, event consistency, notification coverage, and workflow docs.

Commit:

```text
test(platform): complete end-to-end workflow integration [NH-M38]
```

## NH-M39 — Security, Performance, Accessibility, and Release Gate

Security:

- auth/MFA;
- IDOR/privacy;
- files/webhooks;
- finance;
- audit;
- dependencies.

Performance:

- indexes/N+1;
- pagination/cache;
- queues;
- frontend bundles and web vitals.

Accessibility:

- keyboard/screen reader;
- contrast/forms/dialogs/tables/charts;
- responsive.

Release:

- production config;
- migration/rollback;
- health/observability;
- final status.

Commit:

```text
chore(release): complete production quality gate [NH-M39]
```

---

# 13. Deferred Future Modules

Do not start without explicit request:

```text
NH-F01 — AI Interview Practice
NH-F02 — AI CV Suggestions
NH-F03 — Advanced Video Provider Integration
NH-F04 — Company Subscription Plans
NH-F05 — Flutter Mobile App
NH-F06 — External Job Board Integrations
NH-F07 — Recommendation Engine
NH-F08 — Enterprise SSO
NH-F09 — Advanced Proctoring with legal approval
```

---

# 14. Status Ledger

Maintain `docs/task/status.md`.

Recommended table:

```markdown
| Order | Module ID | Module              | Status     | Started | Completed | Commit | Blocker |
| ----: | --------- | ------------------- | ---------- | ------- | --------- | ------ | ------- |
|    00 | NH-M00    | Repository Audit    | UNVERIFIED |         |           |        |         |
|    01 | NH-M01    | Platform Foundation | UNVERIFIED |         |           |        |         |
```

Current-module YAML:

```yaml
module_id: NH-M05
title: Candidate Profile
status: IN_PROGRESS
started_at: <UTC timestamp>
completed_at: null
dependencies:
  - NH-M03
blockers: []
git_commit:
  hash: null
  message: null
```

Completed:

```yaml
module_id: NH-M05
title: Candidate Profile
status: COMPLETED
started_at: <UTC timestamp>
completed_at: <UTC timestamp>
dependencies:
  - NH-M03
blockers: []
git_commit:
  hash: <hash>
  message: 'feat(candidate): implement complete candidate profile [NH-M05]'
next_module:
  module_id: NH-M06
  title: CV Builder and PDF Export
```

---

# 15. Start Procedure

For each module:

1. State selected module and why it is next.
2. Inspect dependencies and existing implementation.
3. Record initial Git state.
4. Run baseline checks.
5. Mark `IN_PROGRESS`.
6. Implement database/shared/backend.
7. Implement frontend UI.
8. Add security/authorization/rate limits/audit.
9. Add tests.
10. Run manual smoke.
11. Update docs.
12. Run final checks.
13. Mark `COMPLETED`.
14. Create one commit.
15. Report next module.
16. Stop.

---

# 16. Blocked Procedure

Mark `BLOCKED` when:

- dependency is incomplete;
- required configuration is unavailable;
- migration cannot be safe;
- Git identity is missing;
- mandatory checks cannot run;
- failures cannot be safely fixed;
- product/financial policy needs user approval.

When blocked:

1. Do not commit.
2. Do not pretend completion.
3. Preserve changes.
4. Report exact blocker, evidence, files, commands, and safe next action.
5. Stop.

---

# 17. Mandatory Verification

Use actual repository scripts when names differ.

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

Also run module-specific checks:

```text
authorization and IDOR
concurrency
rate limiting
audit privacy
file privacy
signed URLs
money precision
timezone and DST
queue idempotency
webhook verification
responsive UI
accessibility
browser storage
production build
```

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

Never use destructive migration reset or unreviewed destructive database push.

---

# 18. Completion Report

After each module return:

```markdown
# Module Completion Report — <MODULE-ID>

## Status

COMPLETED | BLOCKED

## Selected Module

- ID:
- Title:
- Reason it was next:

## Repository Findings

- Existing implementation:
- Reused code:
- Missing pieces:
- Initial Git state:

## Database

- Models:
- Migration:
- Constraints/indexes:

## Backend

- APIs:
- Services:
- Authorization:
- Validation:
- Transactions/concurrency:
- Rate limits/audit:
- Swagger:

## Frontend

- Routes:
- Pages/forms:
- States:
- Responsive:
- Accessibility:

## Security

- IDOR/privacy:
- Files/data:
- Logs/audit:
- Browser storage:
- MFA/permissions:

## Tests

- Unit:
- Integration:
- API E2E:
- Frontend:
- Accessibility/security:
- Manual smoke:

## Commands

- Infrastructure:
- Prisma:
- API:
- Web:
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

## Documentation

- Updated:

## Next Module

- ID:
- Title:
```

---

# 19. Non-Negotiable Rules

Always:

- inspect before coding;
- reuse existing code;
- complete backend and frontend together;
- use real APIs;
- enforce ownership and permission;
- test IDOR;
- update status;
- commit only after verification;
- stop after one module.

Never:

- duplicate modules;
- treat task files as implementation;
- skip UI for a user-facing module;
- skip backend for a data-driven UI;
- create fake buttons or unsupported routes;
- trust client identity, money, score, or deadline;
- leak private data;
- hide failed checks;
- commit broken code;
- start the next module before completing the current module.

---

# 20. Immediate Claude Command

Whenever asked to continue:

```text
Read claude_ai_brain.md and docs/task/status.md.

Inspect the repository and identify the first module in the roadmap that is not fully verified as complete. Reuse any existing partial implementation. Implement exactly that one module end-to-end, including database, backend APIs, frontend UI, authorization, validation, security, tests, documentation, status update, and one final Git commit.

If the selected module is already complete, verify it, update its status, and select the next incomplete module. Do not duplicate existing code.

Do not start a second module in the same execution. If blocked or any mandatory verification fails, do not commit. Return the required completion report and stop.
```

---

# 21. Project Definition of Done

NextHire is complete when:

1. `NH-M00` through `NH-M39` are `COMPLETED` or `VERIFIED`.
2. Candidate, Expert, Company, and SuperAdmin workflows pass real E2E tests.
3. Every user-facing module includes backend and frontend UI.
4. Security, privacy, permissions, and MFA policies are enforced.
5. Financial operations use exact auditable ledgers.
6. Private files and signed URLs are protected.
7. Tests, builds, accessibility, performance, and release gates pass.
8. Documentation matches production behavior.
9. No unintended changes remain.
10. Every module has one traceable conventional commit.

---

**End of Claude AI Brain — NextHire**
