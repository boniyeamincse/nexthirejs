# NextHire — Complete Task List

## Project: NextHire Career & Hiring Platform

**Status:** Active development — statuses below synced 2026-07-23 to the verified ledger in `docs/task/status.md`  
**Total Modules:** 40 (NH-M00 to NH-M39; original list omitted M07–M09, added 2026-07-23)  
**Estimated Phases:** 10  
**Document Version:** 1.0.0

---

# PHASE 0: FOUNDATION & INFRASTRUCTURE

## NH-M00: Repository Audit and Status Reconciliation

**Status:** COMPLETED  
**Dependencies:** None

### Tasks

- [x] Inspect repository structure
- [x] Verify empty state
- [x] Create module status tracking
- [x] Map 172 modules to NH-M01 to NH-M39
- [x] Document current state
- [x] Establish baseline for development

---

## NH-M01: Platform Foundation

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Verified 2026-07-23: infra healthy, health endpoint, Swagger, CI, error envelope, builds green (NH-M00 audit)  
**Dependencies:** None

### Infrastructure Tasks

- [x] Create monorepo structure with pnpm + Turborepo
- [x] Create Docker Compose setup
  - [x] PostgreSQL 16
  - [x] Redis 7
  - [x] MinIO
  - [x] Mailpit
- [x] Configure pnpm workspace
- [x] Create turbo.json for build pipeline
- [x] Setup environment management (.env.example, .env.development, .env.production)

### Backend Tasks

- [x] Initialize NestJS project in `apps/api`
- [x] Install dependencies
  - [x] @nestjs/core, @nestjs/common, @nestjs/platform-express
  - [x] @nestjs/config
  - [ ] @nestjs/prisma
  - [ ] @nestjs/jwt, @nestjs/passport
  - [x] @nestjs/swagger
  - [x] prisma, @prisma/client
  - [x] class-validator, class-transformer
  - [x] bcrypt/argon2
  - [ ] winston or pino for logging
  - [x] @nestjs/bull, bullmq
  - [ ] @nestjs/socket.io
  - [x] ioredis
  - [x] minio
  - [x] nodemailer
- [x] Create NestJS module structure
- [x] Setup global configuration
  - [x] Environment validation with Joi/Zod
  - [x] Configuration service
- [x] Create global error filter
- [x] Create global interceptors
  - [x] Logging interceptor
  - [ ] Transform interceptor
  - [x] Correlation ID interceptor
- [x] Setup Swagger/OpenAPI at `/api/docs`
- [x] Create health endpoints `/health`, `/readiness`
- [x] Setup database connection with Prisma
- [x] Create base Prisma schema
  - [x] User model
  - [x] Role model
  - [ ] Permission model
- [x] Create audit logging foundation
- [x] Setup rate limiting
- [x] Setup request validation

### Frontend Tasks

- [x] Initialize Next.js project in `apps/web`
- [x] Install dependencies
  - [x] next, react, react-dom
  - [x] typescript, @types/react, @types/node
  - [x] tailwindcss
  - [ ] @tanstack/react-query
  - [ ] react-hook-form
  - [x] zod
  - [ ] axios
  - [ ] @radix-ui or shadcn/ui components
  - [ ] next-i18next or i18next
- [x] Setup environment configuration
- [x] Create base layout
  - [x] Header
  - [x] Footer
  - [x] Sidebar (conditional)
- [x] Create global error boundary
- [x] Create loading states
- [x] Setup API client base configuration
- [ ] Setup React Query provider
- [ ] Setup i18n foundation (English, Bangla, Urdu, Hindi)
- [ ] Create accessible component system

### Shared Packages Tasks

- [x] Create `packages/types` for shared TypeScript types
- [x] Create `packages/validation` for Zod schemas
- [ ] Create `packages/api-client` for generated API client
- [ ] Create `packages/ui` for shared UI components
- [x] Create `packages/constants` for shared constants
- [x] Create `packages/eslint-config`
- [x] Create `packages/tsconfig`

### Testing Tasks

- [x] Setup Jest/Testing library
- [x] Create base test configuration
- [x] Create e2e test setup with Playwright/Cypress
- [ ] Create test factories

### CI/CD Tasks

- [x] Create GitHub Actions workflows
  - [x] CI: Lint, typecheck, test, build
  - [ ] CD: Deploy to staging/production
- [x] Setup husky for git hooks
  - [x] pre-commit: lint-staged
  - [x] commit-msg: commitlint
- [x] Setup commitlint with conventional commits

### Documentation Tasks

- [x] Update README.md with setup instructions
- [ ] Create docs/architecture/overview.md
- [ ] Create docs/development/setup.md
- [ ] Create docs/development/contributing.md
- [x] Update claude_ai_brain.md with progress

---

# PHASE 1: IDENTITY & AUTHENTICATION

## NH-M02: Registration and Email Verification

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Delivered as NH-P1-T001/T002 (Argon2id, hashed tokens, BullMQ/Mailpit)  
**Dependencies:** NH-M01

### Database Tasks

- [x] Create User model
  - [x] id, email, password_hash
  - [ ] first_name, last_name
  - [ ] country_code, phone_number
  - [ ] preferred_language
  - [x] email_verified_at
  - [x] phone_verified_at
  - [x] is_active
  - [x] last_login_at
  - [x] created_at, updated_at
- [x] Create VerificationToken model
  - [x] id, user_id
  - [x] token (hashed)
  - [ ] type (email, phone, password_reset)
  - [x] expires_at
  - [x] used_at
- [x] Create AuditLog model
  - [x] id, user_id
  - [x] action, resource_type, resource_id
  - [x] ip_address, user_agent
  - [x] metadata (jsonb)
  - [x] created_at
- [x] Create migrations for all models
- [x] Add indexes
  - [x] users.email (unique)
  - [ ] users.phone_number (unique)
  - [x] verification_tokens.token (unique)
  - [x] verification_tokens.user_id
  - [x] audit_logs.user_id
  - [x] audit_logs.created_at

### Backend Tasks

- [x] Create Auth module
- [x] Create Auth controller
- [x] Create Registration DTO
  - [x] email, password, confirm_password
  - [ ] first_name, last_name
  - [ ] country_code, phone_number
  - [ ] preferred_language
  - [x] agree_to_terms, privacy_consent
- [x] Create Email Verification DTO
  - [x] email, token
- [x] Create Resend Verification DTO
  - [x] email
- [x] Create Registration service
  - [x] Hash password with Argon2id
  - [x] Create user
  - [x] Generate verification token
  - [x] Send verification email
  - [x] Record audit log
- [x] Create Email service
  - [x] Send verification email
  - [x] Email template support
- [x] Create Verification service
  - [x] Verify token
  - [x] Mark email verified
  - [x] Handle expired tokens
- [x] Add rate limiting for registration/resend
- [x] Add validation
  - [x] Strong password policy
  - [x] Unique email and phone
  - [x] Valid country code
  - [x] Terms acceptance required
- [x] Add Swagger documentation
- [x] Add unit tests
- [x] Add e2e tests

### Frontend Tasks

- [x] Create Registration page `/register`
  - [x] Registration form with all fields
  - [x] Form validation with Zod
  - [ ] Password strength indicator
  - [ ] Country selector
  - [ ] Language selector
  - [x] Terms and privacy checkboxes
  - [x] Submit handler
  - [x] Loading state
  - [x] Success state
  - [x] Error states
- [x] Create Verify Email page `/verify-email`
  - [x] Token validation
  - [x] Success/error display
  - [x] Resend verification link
- [x] Create Resend Verification page `/resend-verification`
  - [x] Email input
  - [x] Submit handler
- [x] Create API client methods
  - [x] register()
  - [x] verifyEmail()
  - [x] resendVerification()
- [x] Add loading/empty/error states
- [x] Add accessibility support
- [x] Add responsive design

### Testing Tasks

- [x] Unit tests for registration service
- [x] Unit tests for verification service
- [x] Integration tests for registration flow
- [x] API e2e tests
- [x] Frontend component tests
- [ ] Frontend e2e tests (register → verify → login)

---

## NH-M03: Login, Sessions, and Password Recovery

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Delivered as NH-P1-T003/T004/T016 + password reset (rotating refresh, sessions, forgot/reset/change)  
**Dependencies:** NH-M02

### Database Tasks

- [x] Create Session model
  - [x] id, user_id
  - [x] token (hashed)
  - [x] refresh_token (hashed)
  - [x] ip_address, user_agent
  - [x] expires_at
  - [x] last_activity_at
  - [x] created_at
  - [x] revoked_at
- [x] Create PasswordResetToken model
  - [x] id, user_id
  - [x] token (hashed)
  - [x] expires_at
  - [x] used_at
- [x] Add indexes
  - [x] sessions.user_id
  - [x] sessions.token (unique)
  - [x] sessions.refresh_token (unique)
  - [x] password_reset_tokens.token (unique)

### Backend Tasks

- [x] Create Login DTO
  - [x] email/phone
  - [x] password
  - [ ] remember_me (optional)
  - [ ] device_info
- [x] Create Login Response DTO
  - [x] access_token
  - [ ] refresh_token
  - [x] expires_in
  - [x] user (user DTO)
- [x] Create Refresh Token DTO
  - [ ] refresh_token
- [x] Create Change Password DTO
  - [x] current_password
  - [x] new_password
  - [x] confirm_password
- [x] Create Forgot Password DTO
  - [x] email
- [x] Create Reset Password DTO
  - [x] token
  - [x] new_password
  - [x] confirm_password
- [x] Create Session service
  - [x] Login with email/phone
  - [x] Password verification
  - [x] Access/refresh token generation
  - [x] Session creation/update
  - [x] Refresh token rotation
  - [x] Logout
  - [x] Logout all devices
  - [x] Session revocation
- [x] Create JWT strategy
  - [x] Access token (15m - 1h expiry)
  - [x] Refresh token (7d - 30d expiry)
  - [x] Rotate refresh tokens on use
- [x] Create Password service
  - [x] Forgot password flow
  - [x] Reset password with token
  - [x] Change password (authenticated)
- [x] Create Guards
  - [x] JWT Auth Guard
  - [x] Roles Guard
- [x] Add rate limiting for login/forgot password
- [ ] Add account lock after failed attempts
- [ ] Add suspicious login detection
- [x] Add Swagger documentation
- [x] Add unit and e2e tests

### Frontend Tasks

- [x] Create Login page `/login`
  - [x] Email/phone input
  - [x] Password input with toggle visibility
  - [ ] Remember me checkbox
  - [x] Forgot password link
  - [x] Register link
  - [x] Submit handler
  - [x] Loading state
  - [x] Error handling
- [x] Create Forgot Password page `/forgot-password`
  - [x] Email input
  - [x] Submit handler
  - [x] Success state
- [x] Create Reset Password page `/reset-password`
  - [x] Token from URL
  - [x] New password field
  - [x] Confirm password field
  - [x] Submit handler
- [x] Create Auth context/provider
  - [x] Login/Logout methods
  - [x] Token management (http-only cookie or memory)
  - [x] User state
  - [x] Protected route wrapper
- [ ] Create API interceptor
  - [ ] Add auth token
  - [ ] Handle 401 responses (refresh token)
  - [ ] Handle logout on invalid refresh
- [x] Create Change Password page `/settings/security`
  - [x] Current password
  - [x] New password
  - [x] Confirm password
- [x] Add session management UI
  - [x] List active sessions
  - [x] Revoke session
  - [x] Logout all devices
- [x] Update API client methods
  - [x] login()
  - [x] refreshToken()
  - [x] logout()
  - [x] logoutAll()
  - [x] forgotPassword()
  - [x] resetPassword()
  - [x] changePassword()
- [x] Add responsive and accessible design

---

## NH-M04: TOTP MFA, Roles, and Permissions

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Commit 0a2d790 (2026-07-23). NOTE: implemented differently from the sketch below — recovery codes in a hashed table (not jsonb), trusted devices in their own table, role model already existed; RBAC permission tables deferred. See docs/security/mfa.md + docs/api/mfa.md  
**Dependencies:** NH-M03

### Database Tasks

- [x] Create MFA model
  - [x] id, user_id
  - [x] secret
  - [x] is_enabled
  - [ ] recovery_codes (encrypted jsonb)
  - [ ] trusted_devices (jsonb)
  - [x] created_at, updated_at
- [x] Create Role model
  - [ ] id, name, description
  - [x] created_at, updated_at
- [ ] Create Permission model
  - [ ] id, name, resource, action
  - [ ] description
  - [x] created_at
- [x] Create UserRole model
  - [x] id, user_id, role_id
  - [x] granted_at
  - [x] granted_by
- [ ] Create RolePermission model
  - [ ] id, role_id, permission_id
  - [x] created_at
- [x] Seed default roles
  - [ ] SUPER_ADMIN
  - [ ] ADMIN
  - [x] CANDIDATE
  - [x] EXPERT/TRAINER
  - [ ] COMPANY_ADMIN
  - [ ] COMPANY_RECRUITER
  - [ ] COMPANY_INTERVIEWER
  - [ ] COMPANY_VIEWER
  - [ ] SUPPORT_AGENT
  - [ ] FINANCE_ADMIN
  - [ ] CONTENT_MODERATOR
- [ ] Seed default permissions
  - [ ] user:create, user:read, user:update, user:delete
  - [ ] role:create, role:read, role:update, role:delete
  - [ ] candidate:read, candidate:update, candidate:delete
  - [ ] expert:create, expert:read, expert:update, expert:delete
  - [ ] expert:verify, expert:approve
  - [ ] company:create, company:read, company:update, company:delete
  - [ ] company:verify, company:approve
  - [ ] job:create, job:read, job:update, job:delete, job:publish
  - [ ] application:read, application:update, application:delete
  - [ ] booking:read, booking:update, booking:delete
  - [ ] payment:read, payment:update, payment:delete
  - [ ] payout:create, payout:read, payout:update, payout:approve
  - [ ] finance:read, finance:update, finance:export
  - [ ] audit:read, audit:export
  - [ ] settings:read, settings:update
  - [ ] content:create, content:read, content:update, content:delete
  - [ ] moderation:read, moderation:update, moderation:delete
  - [ ] support:read, support:update

### Backend Tasks

- [x] Create MFA module
  - [x] TOTP setup
  - [x] TOTP challenge/verify
  - [x] Recovery code generation
  - [x] Trusted device management
- [ ] Create Roles/Permissions module
  - [ ] Role CRUD
  - [ ] Permission CRUD
  - [ ] Assign role to user
  - [ ] Remove role from user
  - [ ] Grant permission to role
- [x] Create MFA service
  - [x] Generate TOTP secret
  - [x] Generate QR code
  - [x] Verify TOTP code
  - [x] Generate recovery codes
  - [x] Validate recovery code
- [x] Create RBAC service
  - [x] Check user has role
  - [ ] Check user has permission
  - [ ] Check user can access resource
  - [x] Check user is resource owner
- [x] Create decorators
  - [x] @Roles(...roles)
  - [ ] @Permissions(...permissions)
  - [ ] @ResourceOwner()
- [x] Add mandatory MFA for
  - [x] SuperAdmin
  - [x] Company privileged members
  - [ ] Finance admin
- [x] Add Swagger documentation
- [x] Add unit/e2e tests

### Frontend Tasks

- [x] Create MFA Setup page `/settings/mfa`
  - [x] QR code display
  - [x] Manual secret display
  - [x] Setup code entry
  - [x] Verify and enable
  - [x] Recovery codes display with download
- [x] Create MFA Challenge page `/mfa-challenge`
  - [x] TOTP code input
  - [x] Recovery code option
  - [x] Trust this device option
  - [x] Submit handler
- [x] Create MFA Recovery page `/mfa-recovery`
  - [x] Recovery code entry
  - [x] Recover access
- [ ] Create Role Management page `/admin/roles`
  - [ ] Role list
  - [ ] Role creation/editing
  - [ ] Permission assignment
- [ ] Create User Role Assignment page `/admin/users/[id]/roles`
  - [ ] Available roles
  - [ ] Current roles
  - [ ] Assign/remove actions
- [ ] Add role-based UI guards
  - [ ] Show/hide menu items
  - [ ] Show/hide actions
  - [ ] Access control
- [x] Update API client
  - [x] setupMFA()
  - [x] verifyMFA()
  - [x] getRecoveryCodes()
  - [ ] manageRoles()
  - [ ] assignRole()
  - [ ] removeRole()
- [x] Add responsive and accessible design

---

# PHASE 2: CANDIDATE CORE

## NH-M05: Candidate Profile

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Verified complete incl. photo upload (commit [NH-M05]); all 14 candidate E2E suites green (153 tests)  
**Dependencies:** NH-M03, NH-M04

### Database Tasks

- [x] Create CandidateProfile model
  - [x] id, user_id
  - [x] headline
  - [x] bio
  - [x] photo_url
  - [ ] date_of_birth (encrypted)
  - [x] country, city
  - [x] current_location
  - [ ] nationality
  - [x] professional_summary
  - [x] career_objective
  - [x] linkedin_url
  - [x] github_url
  - [x] portfolio_url
  - [x] public_slug (unique)
  - [x] profile_completion_score
  - [x] created_at, updated_at
- [x] Create Education model
  - [x] id, candidate_id
  - [x] institution_name
  - [x] degree
  - [x] field_of_study
  - [x] start_date, end_date
  - [ ] is_current, is_verified
  - [x] grade, description
  - [x] created_at, updated_at
- [x] Create WorkExperience model
  - [x] id, candidate_id
  - [x] company_name
  - [x] job_title
  - [x] employment_type
  - [x] start_date, end_date
  - [x] is_current
  - [x] description, achievements
  - [x] created_at, updated_at
- [x] Create CandidateSkill model
  - [x] id, candidate_id
  - [x] skill_name
  - [x] skill_level (beginner, intermediate, advanced, expert)
  - [ ] is_verified
  - [ ] verified_by, verified_at
  - [ ] evidence (jsonb)
  - [x] created_at, updated_at
- [x] Create Project model
  - [x] id, candidate_id
  - [x] title, slug
  - [x] summary, description
  - [x] problem_statement, solution
  - [x] role, team_size
  - [x] technology_stack (jsonb)
  - [x] start_date, end_date
  - [x] github_url, live_url, demo_url
  - [x] status (draft, published, verified)
  - [x] visibility (private, trainer, company, public)
  - [x] created_at, updated_at
- [ ] Create ProjectMedia model
  - [ ] id, project_id
  - [ ] type (image, video, document)
  - [x] url
  - [ ] caption, order
  - [x] created_at
- [x] Create Certification model
  - [x] id, candidate_id
  - [x] name, issuer
  - [x] issued_date, expiry_date
  - [x] credential_id, credential_url
  - [ ] is_verified
  - [x] created_at, updated_at
- [x] Create Training model
  - [x] id, candidate_id
  - [x] title
  - [x] provider, description
  - [x] start_date, end_date
  - [x] certificate_url
  - [x] created_at, updated_at
- [x] Create CandidateLanguage model
  - [x] id, candidate_id
  - [x] language_code
  - [x] proficiency (A1, A2, B1, B2, C1, C2, Native)
  - [x] created_at, updated_at
- [x] Create CandidateAchievement model
  - [x] id, candidate_id
  - [x] title, description
  - [x] date_awarded, issuer
  - [x] created_at
- [x] Create CandidatePreference model
  - [x] id, candidate_id
  - [x] preferred_job_roles (jsonb)
  - [x] preferred_industries (jsonb)
  - [x] preferred_locations (jsonb)
  - [x] work_preference (remote, hybrid, onsite)
  - [x] expected_salary_min, expected_salary_max
  - [x] expected_salary_currency
  - [x] employment_type (jsonb)
  - [x] availability (immediate, two_weeks, one_month, three_months)
  - [x] created_at, updated_at
- [x] Create PrivacySetting model
  - [x] id, candidate_id
  - [x] section (profile, cv, projects, skills, education, etc.)
  - [x] visibility_level (private, trainer, company, public)
  - [x] created_at, updated_at
- [x] Create CareerPassport model
  - [x] id, candidate_id
  - [x] version
  - [x] data (jsonb) - snapshot of all profile data
  - [x] published_at
  - [x] created_at, updated_at
- [x] Add indexes
  - [x] candidate_profiles.user_id
  - [x] candidate_profiles.public_slug (unique)
  - [x] education.candidate_id
  - [x] work_experience.candidate_id
  - [x] candidate_skills.candidate_id
  - [x] projects.candidate_id
  - [x] career_passports.candidate_id

### Backend Tasks

- [x] Create Candidate module
- [x] Create Profile controller
  - [x] GET /candidates/me/profile
  - [x] PUT /candidates/me/profile
  - [x] GET /candidates/:slug/public (public)
  - [x] GET /candidates/me/privacy
  - [x] PUT /candidates/me/privacy
  - [x] GET /candidates/me/completion
- [x] Create Education controller
  - [x] GET /candidates/me/education
  - [x] POST /candidates/me/education
  - [x] PUT /candidates/me/education/:id
  - [x] DELETE /candidates/me/education/:id
- [x] Create Experience controller
  - [x] GET /candidates/me/experience
  - [x] POST /candidates/me/experience
  - [x] PUT /candidates/me/experience/:id
  - [x] DELETE /candidates/me/experience/:id
- [x] Create Skills controller
  - [x] GET /candidates/me/skills
  - [x] POST /candidates/me/skills
  - [x] PUT /candidates/me/skills/:id
  - [x] DELETE /candidates/me/skills/:id
- [x] Create Projects controller
  - [x] GET /candidates/me/projects
  - [x] POST /candidates/me/projects
  - [x] PUT /candidates/me/projects/:id
  - [x] DELETE /candidates/me/projects/:id
  - [ ] POST /candidates/me/projects/:id/media
  - [ ] DELETE /candidates/me/projects/:id/media/:media_id
- [x] Create Certifications controller
  - [x] GET /candidates/me/certifications
  - [x] POST /candidates/me/certifications
  - [x] PUT /candidates/me/certifications/:id
  - [x] DELETE /candidates/me/certifications/:id
- [x] Create Profile service
  - [x] CRUD operations
  - [x] Profile completion calculation
  - [x] Privacy enforcement
  - [x] Public profile generation
- [x] Create Education service
- [x] Create Experience service
- [x] Create Skills service
- [x] Create Projects service
- [x] Create Privacy service
- [x] Add authorization for all endpoints
- [x] Add validation DTOs
- [x] Add Swagger documentation
- [x] Add unit/e2e tests

### Frontend Tasks

- [x] Create Candidate Dashboard page `/candidate/dashboard`
  - [x] Profile completion indicator
  - [x] Quick actions
  - [x] Recent activity
  - [x] Upcoming items
- [x] Create Profile page `/candidate/profile`
  - [x] Edit form with all sections
    - [x] Personal information
    - [x] Professional summary
    - [x] Career objective
    - [x] Social links
  - [x] Photo upload with cropping
  - [x] Public profile preview
  - [x] Profile completion progress
- [x] Create Education management
  - [x] List education entries
  - [x] Add education form
  - [x] Edit education form
  - [x] Delete confirmation
  - [x] Reorder function
- [x] Create Experience management
  - [x] List experience entries
  - [x] Add experience form
  - [x] Edit experience form
  - [x] Delete confirmation
  - [x] Reorder function
- [x] Create Skills management
  - [x] Add skill with level
  - [x] Remove skill
  - [x] Update level
  - [ ] Skill suggestions
- [ ] Create Projects management
  - [ ] List projects
  - [ ] Add/Edit project form
    - [ ] All project fields
    - [ ] Technology stack
    - [ ] Media upload
    - [ ] Visibility settings
  - [x] Delete confirmation
  - [x] Reorder function
- [x] Create Certifications management
  - [x] List certifications
  - [x] Add/Edit certification form
  - [x] Delete confirmation
- [x] Create Training management
  - [x] List trainings
  - [x] Add/Edit training form
  - [x] Delete confirmation
- [x] Create Languages management
  - [x] Add language with proficiency
  - [x] Update proficiency
  - [x] Remove language
- [x] Create Preferences page `/candidate/preferences`
  - [x] Job preferences
  - [x] Location preferences
  - [x] Salary expectations
  - [x] Availability
- [x] Create Privacy Settings page `/candidate/privacy`
  - [x] Section visibility controls
  - [x] Public profile toggle
  - [x] Data visibility preview
- [x] Create Public Profile page `/u/[slug]`
  - [x] Public view of profile
  - [x] Respect privacy settings
  - [x] No private contact info
  - [x] SEO meta tags
- [x] Add responsive/accessible design
- [x] Add loading/empty/error states
- [x] Add API client methods

---

## NH-M06: CV Builder and PDF Export

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Verified complete (commit [NH-M06]): async PDF export, readiness gate, profile-snapshot import, dashboard/editor UI; fixed IDOR + stored-XSS defects found in the pre-existing HTML export  
**Dependencies:** NH-M05

### Database Tasks

- [ ] Create CV model
  - [ ] id, candidate_id
  - [ ] title, slug
  - [ ] template_id
  - [ ] is_default
  - [ ] is_public
  - [ ] share_token (unique)
  - [ ] version
  - [ ] created_at, updated_at
- [ ] Create CVData model
  - [ ] id, cv_id
  - [ ] personal_info (jsonb)
  - [ ] summary (text)
  - [ ] education (jsonb)
  - [ ] experience (jsonb)
  - [ ] skills (jsonb)
  - [ ] projects (jsonb)
  - [ ] certifications (jsonb)
  - [ ] training (jsonb)
  - [ ] achievements (jsonb)
  - [ ] languages (jsonb)
  - [ ] references (jsonb)
  - [ ] custom_sections (jsonb)
  - [ ] order (jsonb) - section ordering
  - [ ] created_at, updated_at
- [ ] Create CVTemplate model
  - [ ] id, name
  - [ ] template_type (professional, modern, creative, ats_friendly)
  - [ ] preview_image
  - [ ] style_config (jsonb)
  - [ ] is_active
  - [ ] is_premium
  - [ ] created_at
- [ ] Create CVExport model
  - [ ] id, cv_id
  - [ ] format (pdf, docx, html)
  - [ ] file_url
  - [ ] file_size
  - [ ] generated_at
  - [ ] expires_at
- [ ] Create CVReview model
  - [ ] id, cv_id
  - [ ] reviewer_id (trainer)
  - [ ] status (pending, in_progress, completed)
  - [ ] rating (1-5)
  - [ ] feedback (text)
  - [ ] section_feedback (jsonb)
  - [ ] created_at, updated_at
- [ ] Add indexes
  - [ ] cvs.candidate_id
  - [ ] cvs.share_token (unique)
  - [ ] cv_exports.cv_id

### Backend Tasks

- [ ] Create CV module
- [ ] Create CV controller
  - [ ] GET /cvs/me
  - [ ] POST /cvs
  - [ ] GET /cvs/:id
  - [ ] PUT /cvs/:id
  - [ ] DELETE /cvs/:id
  - [ ] POST /cvs/:id/duplicate
  - [ ] PUT /cvs/:id/set-default
  - [ ] GET /cvs/:id/export/pdf
  - [ ] GET /cvs/:id/share
  - [ ] PUT /cvs/:id/share/toggle
  - [ ] GET /cvs/shared/:token (public)
- [ ] Create CVTemplate controller
  - [ ] GET /cv-templates
  - [ ] GET /cv-templates/:id
- [ ] Create CVReview controller
  - [ ] POST /cvs/:id/reviews
  - [ ] PUT /cvs/:id/reviews/:review_id
  - [ ] GET /cvs/:id/reviews
- [ ] Create CV service
  - [ ] CRUD operations
  - [ ] Create from profile
  - [ ] Duplicate CV
  - [ ] Set default
  - [ ] Share management
  - [ ] Template selection
- [ ] Create PDF Export service
  - [ ] Generate PDF with Puppeteer/PDFKit
  - [ ] Template rendering
  - [ ] File storage in MinIO
  - [ ] Signed download URL
  - [ ] Queue job for async generation
- [ ] Create CV Review service
  - [ ] Submit for review
  - [ ] Trainer feedback
  - [ ] Completion status
- [ ] Add authorization
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create CV Dashboard page `/candidate/cvs`
  - [ ] List all CVs
  - [ ] Create new CV
  - [ ] Duplicate CV
  - [ ] Set default CV
  - [ ] Delete CV
  - [ ] Export actions
- [ ] Create CV Builder page `/candidate/cvs/[id]/edit`
  - [ ] Section-based editor
    - [ ] Personal info
    - [ ] Summary
    - [ ] Education (add/edit/delete/reorder)
    - [ ] Experience (add/edit/delete/reorder)
    - [ ] Skills
    - [ ] Projects (select from profile)
    - [ ] Certifications (select from profile)
    - [ ] Custom sections
  - [ ] Drag-and-drop section ordering
  - [ ] Show/hide sections
  - [ ] Real-time preview (split view)
  - [ ] Auto-save (debounced)
  - [ ] Version history
  - [ ] Template selection
- [ ] Create CV Preview page `/candidate/cvs/[id]/preview`
  - [ ] Full CV preview
  - [ ] Different template views
  - [ ] ATS-friendly version
- [ ] Create CV Export page
  - [ ] Download PDF
  - [ ] Share link generation
  - [ ] Watermark options
- [ ] Create CV Share page `/cv/[token]` (public)
  - [ ] Public CV view
  - [ ] Download option
- [ ] Create CV Review page
  - [ ] Submit for review
  - [ ] Review status
  - [ ] Feedback display
- [ ] Create CV Templates page
  - [ ] Browse templates
  - [ ] Preview templates
  - [ ] Select template
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states
- [ ] Add API client methods

---

# PHASE 2B: ASSESSMENT, LEARNING, DASHBOARD (missing from original list — added from claude_ai_brain.md roadmap)

## NH-M07: Assessment and Exam Simulation

**Status:** COMPLETED  
**Dependencies:** NH-M05  
**Reality (2026-07-23 audit):** Delivered as NH-P2-T001–T009 — categories, question bank, authoring/publishing, attempts/autosave/timer, scoring/results, analytics, leaderboards, retakes, certificates; full frontend; targeted E2E suites green.

---

## NH-M08: Learning Content and Progress

**Status:** NOT_STARTED  
**Dependencies:** NH-M05  
**Reality (2026-07-23 audit):** No learning/course module in API or web.

---

## NH-M09: Candidate Dashboard

**Status:** COMPLETED  
**Dependencies:** NH-M05, NH-M06, NH-M07  
**Reality (2026-07-23 audit):** Fully integrated with premium UI, profile aggregation, and photo upload.

---

# PHASE 3: EXPERT/TRAINER MARKETPLACE

## NH-M10: Expert Profile and Verification

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Backend + admin review UI done; MFA guard applied (NH-M04); final verification pass pending  
**Dependencies:** NH-M03, NH-M04, NH-M05

### Database Tasks

- [ ] Create ExpertProfile model
  - [ ] id, user_id
  - [ ] headline, bio
  - [ ] photo_url
  - [ ] country, city
  - [ ] years_experience
  - [ ] current_position, current_company
  - [ ] industry, domain
  - [ ] languages (jsonb)
  - [ ] certifications (jsonb)
  - [ ] education (jsonb)
  - [ ] work_history (jsonb)
  - [ ] session_count, rating_avg
  - [ ] response_time (hours)
  - [ ] is_public
  - [ ] public_slug (unique)
  - [ ] created_at, updated_at
- [ ] Create ExpertVerification model
  - [ ] id, expert_id
  - [ ] status (draft, submitted, under_review, information_requested, verified, rejected, suspended)
  - [ ] identity_document_url
  - [ ] professional_evidence (jsonb)
  - [ ] additional_documents (jsonb)
  - [ ] admin_notes, admin_feedback
  - [ ] submitted_at, reviewed_at
  - [ ] expires_at, renewed_at
  - [ ] created_at, updated_at
- [ ] Create ExpertVerificationRequest model
  - [ ] id, expert_id
  - [ ] comment, requested_changes
  - [ ] status (requested, resolved)
  - [ ] created_at, resolved_at
- [ ] Create ExpertiseArea model
  - [ ] id, name
  - [ ] category
  - [ ] description
  - [ ] is_active
  - [ ] created_at
- [ ] Create ExpertExpertise model
  - [ ] id, expert_id, expertise_id
  - [ ] years_experience
  - [ ] is_primary
  - [ ] created_at
- [ ] Create ExpertService model
  - [ ] id, expert_id
  - [ ] name, description
  - [ ] service_type (mock_interview, cv_review, career_counselling, etc.)
  - [ ] duration (30, 35, 40)
  - [ ] price, currency
  - [ ] is_active, is_featured
  - [ ] created_at, updated_at
- [ ] Create ExpertAvailability model
  - [ ] id, expert_id
  - [ ] day_of_week (0-6)
  - [ ] start_time, end_time
  - [ ] is_active
  - [ ] created_at, updated_at
- [ ] Create ExpertOverrideAvailability model
  - [ ] id, expert_id
  - [ ] date
  - [ ] start_time, end_time
  - [ ] is_available
  - [ ] note
  - [ ] created_at
- [ ] Create ExpertPricing model
  - [ ] id, expert_id
  - [ ] service_type
  - [ ] duration (30, 35, 40)
  - [ ] price, currency
  - [ ] is_active
  - [ ] created_at, updated_at
- [ ] Add indexes
  - [ ] expert_profiles.user_id
  - [ ] expert_profiles.public_slug (unique)
  - [ ] expert_verifications.expert_id
  - [ ] expert_services.expert_id
  - [ ] expert_availability.expert_id
  - [ ] expert_pricing.expert_id

### Backend Tasks

- [ ] Create Expert module
- [ ] Create Expert Profile controller
  - [ ] GET /experts/me/profile
  - [ ] PUT /experts/me/profile
  - [ ] GET /experts/:slug/public
  - [ ] PUT /experts/me/toggle-public
- [ ] Create Expert Verification controller
  - [ ] POST /experts/me/verification
  - [ ] GET /experts/me/verification
  - [ ] PUT /experts/me/verification
  - [ ] POST /experts/me/verification/submit
  - [ ] GET /admin/experts/verification (admin)
  - [ ] GET /admin/experts/verification/:id (admin)
  - [ ] PUT /admin/experts/verification/:id/status (admin)
  - [ ] POST /admin/experts/verification/:id/request-changes (admin)
- [ ] Create Expertise controller
  - [ ] GET /experts/me/expertise
  - [ ] POST /experts/me/expertise
  - [ ] DELETE /experts/me/expertise/:id
  - [ ] GET /expertise (public)
- [ ] Create Expert Service controller
  - [ ] GET /experts/me/services
  - [ ] POST /experts/me/services
  - [ ] PUT /experts/me/services/:id
  - [ ] DELETE /experts/me/services/:id
  - [ ] GET /experts/:slug/services (public)
- [ ] Create Expert service
  - [ ] Profile CRUD
  - [ ] Verification workflow
  - [ ] Expertise management
  - [ ] Service CRUD
  - [ ] Public profile generation
- [ ] Add authorization
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Expert Dashboard page `/expert/dashboard`
  - [ ] Overview stats
  - [ ] Upcoming sessions
  - [ ] Pending tasks
  - [ ] Earnings summary
  - [ ] Rating/reviews
- [ ] Create Expert Profile page `/expert/profile`
  - [ ] Edit profile form
    - [ ] Personal info
    - [ ] Bio
    - [ ] Languages
    - [ ] Work history
    - [ ] Education
    - [ ] Certifications
  - [ ] Photo upload
  - [ ] Public profile preview
  - [ ] Toggle public visibility
- [ ] Create Expert Verification page `/expert/verification`
  - [ ] Document upload
  - [ ] Professional evidence
  - [ ] Submit for review
  - [ ] Status tracking
  - [ ] Admin feedback display
  - [ ] Re-submit with changes
- [ ] Create Expert Expertise page `/expert/expertise`
  - [ ] Add expertise from catalog
  - [ ] Set years experience
  - [ ] Set primary expertise
  - [ ] Remove expertise
- [ ] Create Expert Services page `/expert/services`
  - [ ] List services
  - [ ] Add new service
    - [ ] Service type
    - [ ] Name, description
    - [ ] Duration
    - [ ] Pricing
  - [ ] Edit service
  - [ ] Toggle active/inactive
  - [ ] Delete service
- [ ] Create Expert Availability page `/expert/availability`
  - [ ] Weekly schedule
    - [ ] Day selection
    - [ ] Start/end time
    - [ ] Toggle active
  - [ ] Date overrides
    - [ ] Add unavailable dates
    - [ ] Add special available times
  - [ ] Booking settings
    - [ ] Minimum notice
    - [ ] Maximum advance booking
    - [ ] Break between sessions
- [ ] Create Expert Public Profile page `/e/[slug]`
  - [ ] Profile display
  - [ ] Expertise list
  - [ ] Services with pricing
  - [ ] Availability calendar
  - [ ] Reviews/ratings
  - [ ] Book now button
  - [ ] SEO meta tags
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states
- [ ] Add API client methods

---

## NH-M11: Expert Services and Pricing

**Status:** COMPLETED  
**Reality (2026-07-23 audit):** Delivered as NH-P3-T002 (expertise catalog, service CRUD, 30/35/40 durations, decimal pricing, frontend)  
**Dependencies:** NH-M10

### Database Tasks

- [x] Create ServicePackage model
  - [x] id, expert_id
  - [x] title, description
  - [x] service_type
  - [x] career_domain
  - [ ] job_role (optional)
  - [ ] difficulty (beginner, intermediate, advanced)
  - [x] language
  - [ ] sessions_count (number of sessions)
  - [x] duration_per_session (30, 35, 40)
  - [ ] total_duration (calculated)
  - [x] price, currency
  - [ ] deliverables (jsonb)
  - [ ] cancellation_policy (jsonb)
  - [ ] reschedule_policy (jsonb)
  - [ ] includes_cv_review (boolean)
  - [ ] includes_written_report (boolean)
  - [ ] includes_follow_up (boolean)
  - [ ] max_bookings (int)
  - [x] is_active
  - [x] created_at, updated_at
- [x] Create ServiceCategory model
  - [x] id, name
  - [x] slug
  - [x] description
  - [x] icon
  - [x] is_active
  - [x] created_at
- [x] Add indexes
  - [x] service_packages.expert_id
  - [x] service_packages.service_type
  - [x] service_packages.is_active

### Backend Tasks

- [x] Create Service Package controller
  - [x] GET /experts/me/packages
  - [x] POST /experts/me/packages
  - [x] PUT /experts/me/packages/:id
  - [x] DELETE /experts/me/packages/:id
  - [x] PUT /experts/me/packages/:id/toggle
  - [ ] GET /experts/:slug/packages (public)
  - [x] GET /packages/categories (public)
- [x] Create Service Package service
  - [x] CRUD operations
  - [x] Pricing validation
  - [x] Calculate total duration
  - [x] Availability validation
- [x] Add authorization
- [x] Add validation DTOs
- [x] Add Swagger documentation
- [x] Add unit/e2e tests

### Frontend Tasks

- [x] Create Service Packages page `/expert/packages`
  - [x] List packages
  - [x] Add new package
    - [x] Service type selection
    - [x] Title, description
    - [x] Career domain
    - [ ] Job role
    - [ ] Difficulty
    - [x] Language
    - [x] Duration
    - [x] Pricing
    - [ ] Deliverables
    - [ ] Policies
    - [ ] Options (CV review, report, follow-up)
    - [ ] Max bookings
  - [x] Edit package
  - [x] Toggle active/inactive
  - [x] Delete package
  - [ ] Package metrics (bookings, revenue)
- [x] Add responsive/accessible design
- [x] Add loading/empty/error states

---

## NH-M12: Expert Availability and Slot Engine

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Availability profile/weekly/overrides + UI done. Gap: slot computation/preview engine  
**Dependencies:** NH-M10

### Database Tasks

- [ ] Create AvailabilitySlot model
  - [ ] id, expert_id
  - [ ] start_time (timestamp)
  - [ ] end_time (timestamp)
  - [ ] timezone
  - [ ] is_booked
  - [ ] booking_id (optional)
  - [ ] is_recurring (boolean)
  - [ ] recurring_rule (jsonb)
  - [ ] created_at
- [ ] Create BookingHold model
  - [ ] id, slot_id
  - [ ] hold_token
  - [ ] expires_at
  - [ ] created_at
- [ ] Add indexes
  - [ ] availability_slots.expert_id
  - [ ] availability_slots.start_time
  - [ ] availability_slots.is_booked
  - [ ] booking_holds.slot_id
  - [ ] booking_holds.hold_token (unique)
  - [ ] booking_holds.expires_at

### Backend Tasks

- [ ] Create Availability controller
  - [ ] GET /experts/me/availability
  - [ ] PUT /experts/me/availability (bulk update)
  - [ ] GET /experts/me/availability/slots
  - [ ] POST /experts/me/availability/generate (generate slots from rules)
  - [ ] GET /experts/:slug/availability (public)
  - [ ] GET /experts/:slug/availability/slots (public, filtered)
  - [ ] POST /experts/:slug/availability/slots/:slot_id/hold (temporary hold)
  - [ ] DELETE /experts/:slug/availability/slots/:slot_id/hold (release hold)
- [ ] Create Availability service
  - [ ] Generate slots from weekly rules
  - [ ] Handle timezone conversion
  - [ ] Apply date overrides
  - [ ] Check for conflicts
  - [ ] Hold slots temporarily
  - [ ] Release expired holds
  - [ ] Prevent double booking
  - [ ] DST-safe calculations
  - [ ] Batch slot generation
  - [ ] Slot expiry job
- [ ] Add database transaction for slot booking
- [ ] Add row locking for concurrency
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Availability page `/expert/availability`
  - [ ] Weekly schedule editor
    - [ ] Add/remove availability days
    - [ ] Time picker for start/end
    - [ ] Multiple time blocks per day
  - [ ] Date overrides
    - [ ] Add unavailable dates
    - [ ] Add special available times
  - [ ] Settings
    - [ ] Minimum notice (hours/days)
    - [ ] Maximum advance booking (days)
    - [ ] Buffer between sessions (minutes)
    - [ ] Timezone selection
  - [ ] Slot preview
    - [ ] View generated slots for next 30 days
    - [ ] Filter by date range
    - [ ] See booked vs available
- [ ] Add responsive/accessible design

---

## NH-M13: Expert Discovery and Public Profile

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** find-expert page + trainers module exist. Gap: unverified search/projection; trainers-vs-experts module duplication must be reconciled first  
**Dependencies:** NH-M10, NH-M11

### Backend Tasks

- [ ] Create Expert Discovery controller
  - [ ] GET /experts (search/filter)
  - [ ] GET /experts/:slug
  - [ ] GET /experts/:slug/services
  - [ ] GET /experts/:slug/availability
  - [ ] GET /experts/:slug/reviews
- [ ] Create Expert Discovery service
  - [ ] Search with filters
    - [ ] Service type
    - [ ] Expertise
    - [ ] Country
    - [ ] Language
    - [ ] Price range
    - [ ] Rating
    - [ ] Availability
  - [ ] Sorting
    - [ ] Rating
    - [ ] Price
    - [ ] Relevance
    - [ ] Popularity
  - [ ] Pagination
  - [ ] Full-text search
- [ ] Add indexes for search fields
- [ ] Add caching for public searches
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Expert Directory page `/experts`
  - [ ] Search bar
  - [ ] Filters
    - [ ] Service type
    - [ ] Expertise
    - [ ] Country
    - [ ] Language
    - [ ] Price range
    - [ ] Rating
    - [ ] Availability
  - [ ] Sort options
  - [ ] Expert cards
    - [ ] Photo
    - [ ] Name
    - [ ] Headline
    - [ ] Expertise
    - [ ] Rating
    - [ ] Price
    - [ ] Book now button
  - [ ] Pagination
- [ ] Create Expert Detail page `/experts/[slug]`
  - [ ] Profile
    - [ ] Photo, name, headline
    - [ ] Bio
    - [ ] Expertise
    - [ ] Statistics
    - [ ] Languages
  - [ ] Services
    - [ ] List with pricing
    - [ ] Book now
  - [ ] Availability calendar
    - [ ] Pick date
    - [ ] Available slots
    - [ ] Book slot
  - [ ] Reviews section
  - [ ] SEO meta tags
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M14: Expert Booking and Scheduling

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Backend bookings CRUD only (trainers module). Gap: no frontend, no slot integration  
**Dependencies:** NH-M12, NH-M13

### Database Tasks

- [ ] Create Booking model
  - [ ] id, candidate_id, expert_id
  - [ ] service_id, package_id
  - [ ] slot_id
  - [ ] status (pending, confirmed, completed, cancelled, no_show)
  - [ ] booking_date, session_date
  - [ ] price, currency
  - [ ] meeting_url
  - [ ] cancellation_reason
  - [ ] reschedule_count
  - [ ] created_at, updated_at
- [ ] Create BookingHistory model
  - [ ] id, booking_id
  - [ ] status
  - [ ] note
  - [ ] created_at
- [ ] Add indexes
  - [ ] bookings.candidate_id
  - [ ] bookings.expert_id
  - [ ] bookings.slot_id
  - [ ] bookings.status
  - [ ] bookings.session_date

### Backend Tasks

- [ ] Create Booking controller
  - [ ] POST /bookings (create booking)
  - [ ] GET /bookings/me/candidate (candidate bookings)
  - [ ] GET /bookings/me/expert (expert bookings)
  - [ ] GET /bookings/:id
  - [ ] PUT /bookings/:id/confirm (expert confirm)
  - [ ] PUT /bookings/:id/reject (expert reject)
  - [ ] PUT /bookings/:id/cancel (cancel)
  - [ ] PUT /bookings/:id/reschedule (request reschedule)
  - [ ] PUT /bookings/:id/reschedule/accept (expert accept reschedule)
  - [ ] PUT /bookings/:id/complete (mark complete)
  - [ ] PUT /bookings/:id/no-show
- [ ] Create Booking service
  - [ ] Create booking with slot hold
  - [ ] Payment integration
  - [ ] Confirm/reject workflow
  - [ ] Cancel workflow
  - [ ] Reschedule workflow
  - [ ] No-show handling
  - [ ] Conflict prevention
  - [ ] Notification triggers
  - [ ] History tracking
- [ ] Add database transaction
- [ ] Add row locking for slot
- [ ] Add expiration job for pending bookings
- [ ] Add notification hooks
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Candidate Bookings page `/candidate/bookings`
  - [ ] List all bookings
  - [ ] Filter by status
  - [ ] Upcoming bookings
  - [ ] Past bookings
  - [ ] Booking detail view
  - [ ] Cancel booking
  - [ ] Reschedule booking
- [ ] Create Expert Bookings page `/expert/bookings`
  - [ ] List all bookings
  - [ ] Filter by status
  - [ ] Pending requests (confirm/reject)
  - [ ] Upcoming sessions
  - [ ] Booking detail view
  - [ ] Manage booking
  - [ ] Mark complete/no-show
- [ ] Create Booking Flow
  - [ ] Service selection page
  - [ ] Slot selection calendar
  - [ ] Booking confirmation
  - [ ] Payment step (NH-M29)
  - [ ] Success page
  - [ ] Email notifications
- [ ] Add responsive/accessible design

---

## NH-M15: Interview and Coaching Session

**Status:** NOT_STARTED  
**Dependencies:** NH-M14

### Database Tasks

- [ ] Create Session model
  - [ ] id, booking_id
  - [ ] meeting_id
  - [ ] status (scheduled, in_progress, completed, missed)
  - [ ] started_at, ended_at
  - [ ] duration_minutes (actual)
  - [ ] candidate_joined_at
  - [ ] expert_joined_at
  - [ ] candidate_attendance (yes, no, late)
  - [ ] expert_attendance (yes, no, late)
  - [ ] recording_url (optional)
  - [ ] notes (jsonb - expert notes)
  - [ ] created_at, updated_at
- [ ] Create SessionEvent model
  - [ ] id, session_id
  - [ ] event_type (join, leave, screen_share, etc.)
  - [ ] participant_type (candidate, expert)
  - [ ] timestamp
  - [ ] metadata (jsonb)
- [ ] Add indexes
  - [ ] sessions.booking_id
  - [ ] sessions.meeting_id
  - [ ] sessions.status

### Backend Tasks

- [ ] Create Session controller
  - [ ] GET /sessions/:id
  - [ ] POST /sessions/:id/join (generate meeting token)
  - [ ] PUT /sessions/:id/start
  - [ ] PUT /sessions/:id/end
  - [ ] PUT /sessions/:id/attendance
  - [ ] PUT /sessions/:id/notes (expert)
  - [ ] GET /sessions/:id/events
- [ ] Create Session service
  - [ ] Meeting room creation (Agora/Jitsi integration)
  - [ ] Token generation
  - [ ] Attendance tracking
  - [ ] Session timer
  - [ ] Notes management
  - [ ] Recording (with consent)
  - [ ] Event logging
- [ ] Add video provider abstraction
- [ ] Add authorization
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Session Lobby page `/session/[id]/lobby`
  - [ ] Session details
  - [ ] Join button
  - [ ] Device check (camera, mic)
  - [ ] Waiting room
  - [ ] Start countdown
- [ ] Create Session Room page `/session/[id]/room`
  - [ ] Video/audio stream
  - [ ] Participant list
  - [ ] Chat (if enabled)
  - [ ] Screen share (if supported)
  - [ ] Session timer (expert view)
  - [ ] Notes panel (expert)
  - [ ] Controls
    - [ ] Mute/unmute
    - [ ] Video on/off
    - [ ] Leave
    - [ ] End session (expert)
  - [ ] Connection status
  - [ ] Error handling
- [ ] Create Session Detail page `/session/[id]`
  - [ ] Session info
  - [ ] Attendance
  - [ ] Duration
  - [ ] Recording (if available)
  - [ ] Notes
- [ ] Add responsive/accessible design

---

## NH-M16: Feedback, Evaluation, and Reviews

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Backend evaluation controller/service only. Gap: no frontend, aggregates unverified  
**Dependencies:** NH-M15

### Database Tasks

- [ ] Create Evaluation model
  - [ ] id, session_id, expert_id, candidate_id
  - [ ] scores (jsonb)
    - [ ] communication
    - [ ] technical_knowledge
    - [ ] confidence
    - [ ] problem_solving
    - [ ] language_proficiency
    - [ ] hr_readiness
    - [ ] role_specific
    - [ ] professionalism
    - [ ] overall_readiness
  - [ ] strengths (jsonb)
  - [ ] weaknesses (jsonb)
  - [ ] written_feedback (text)
  - [ ] recommended_learning (jsonb)
  - [ ] recommended_practice (jsonb)
  - [ ] improvement_plan (jsonb)
  - [ ] follow_up_date
  - [ ] is_final
  - [ ] version
  - [ ] created_at, updated_at
- [ ] Create Review model
  - [ ] id, booking_id, reviewer_id (candidate)
  - [ ] rating (1-5)
  - [ ] title, content
  - [ ] tags (jsonb)
  - [ ] is_anonymous
  - [ ] is_public
  - [ ] is_reported
  - [ ] created_at, updated_at
- [ ] Create ReviewReport model
  - [ ] id, review_id, reporter_id
  - [ ] reason
  - [ ] description
  - [ ] status (pending, reviewed, resolved)
  - [ ] created_at, resolved_at
- [ ] Add indexes
  - [ ] evaluations.session_id
  - [ ] evaluations.expert_id, evaluations.candidate_id
  - [ ] reviews.booking_id
  - [ ] reviews.reviewer_id

### Backend Tasks

- [ ] Create Evaluation controller
  - [ ] POST /sessions/:id/evaluation (expert)
  - [ ] GET /sessions/:id/evaluation
  - [ ] PUT /sessions/:id/evaluation (expert)
  - [ ] GET /candidates/me/evaluations
  - [ ] GET /experts/me/evaluations
  - [ ] GET /candidates/:id/evaluations (with permission)
- [ ] Create Review controller
  - [ ] POST /bookings/:id/review (candidate)
  - [ ] GET /bookings/:id/review
  - [ ] PUT /bookings/:id/review
  - [ ] GET /experts/:slug/reviews (public)
  - [ ] GET /admin/reviews (admin)
  - [ ] POST /admin/reviews/:id/moderate (admin)
- [ ] Create Evaluation service
  - [ ] Create/update evaluation
  - [ ] Score calculation
  - [ ] Improvement plan generation
  - [ ] Version history
  - [ ] Follow-up tracking
- [ ] Create Review service
  - [ ] Create/update review
  - [ ] Rating aggregation
  - [ ] Review moderation
  - [ ] Report handling
  - [ ] Anonymous reviews
- [ ] Add authorization
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Evaluation Form page `/session/[id]/evaluate`
  - [ ] Score sliders for each category
  - [ ] Strengths input
  - [ ] Weaknesses input
  - [ ] Written feedback
  - [ ] Recommended actions
  - [ ] Save draft
  - [ ] Submit final
- [ ] Create Evaluation Detail page `/session/[id]/evaluation`
  - [ ] Scores display (candidate view)
  - [ ] Feedback display
  - [ ] Improvement plan
  - [ ] Download report
- [ ] Create Review Form `/booking/[id]/review`
  - [ ] Rating stars
  - [ ] Title
  - [ ] Content
  - [ ] Tags
  - [ ] Anonymous toggle
  - [ ] Submit
- [ ] Create Reviews Display on expert profile
  - [ ] Rating summary
  - [ ] Review list
  - [ ] Sort by date/rating
  - [ ] Report review
- [ ] Create Moderation page `/admin/reviews` (admin)
  - [ ] Reported reviews list
  - [ ] Review detail
  - [ ] Approve/remove
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M17: Expert Earnings, Wallet, and Payout

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Backend wallet/payout endpoints only. Gap: zero frontend  
**Dependencies:** NH-M14, NH-M16

### Database Tasks

- [ ] Create Wallet model
  - [ ] id, user_id
  - [ ] type (candidate, expert, platform)
  - [ ] balance, currency
  - [ ] available_balance
  - [ ] pending_balance
  - [ ] total_earned
  - [ ] created_at, updated_at
- [ ] Create WalletTransaction model
  - [ ] id, wallet_id
  - [ ] amount, currency
  - [ ] type (credit, debit, hold, release)
  - [ ] status (pending, completed, failed, reversed)
  - [ ] reference_type (booking, refund, commission, payout)
  - [ ] reference_id
  - [ ] description
  - [ ] metadata (jsonb)
  - [ ] idempotency_key
  - [ ] created_at, completed_at
- [ ] Create Commission model
  - [ ] id, transaction_id (optional)
  - [ ] expert_id, booking_id
  - [ ] amount, currency
  - [ ] rate (percentage)
  - [ ] type (platform, payment_gateway, tax)
  - [ ] status (calculated, withheld, released)
  - [ ] created_at
- [ ] Create PayoutAccount model
  - [ ] id, expert_id
  - [ ] type (bank, bKash, Nagad, PayPal, etc.)
  - [ ] account_details (encrypted jsonb)
  - [ ] is_default
  - [ ] is_verified
  - [ ] created_at, updated_at
- [ ] Create PayoutRequest model
  - [ ] id, expert_id, account_id
  - [ ] amount, currency
  - [ ] status (pending, processing, completed, failed)
  - [ ] scheduled_date
  - [ ] processing_fee
  - [ ] notes (admin)
  - [ ] reviewed_by, reviewed_at
  - [ ] completed_at
  - [ ] created_at, updated_at
- [ ] Create PayoutBatch model
  - [ ] id, processed_by
  - [ ] total_amount, currency
  - [ ] item_count
  - [ ] status (draft, processing, completed, failed)
  - [ ] processed_at
  - [ ] created_at
- [ ] Create Earning model
  - [ ] id, expert_id, booking_id
  - [ ] gross_amount, currency
  - [ ] commission_amount
  - [ ] net_amount
  - [ ] status (pending, available, paid_out)
  - [ ] released_at
  - [ ] created_at
- [ ] Add indexes
  - [ ] wallets.user_id
  - [ ] wallet_transactions.wallet_id
  - [ ] wallet_transactions.reference_type, reference_id
  - [ ] wallet_transactions.idempotency_key (unique)
  - [ ] commissions.expert_id
  - [ ] commissions.booking_id
  - [ ] payout_requests.expert_id
  - [ ] earnings.expert_id
  - [ ] earnings.booking_id

### Backend Tasks

- [ ] Create Wallet controller
  - [ ] GET /wallets/me (current user)
  - [ ] GET /wallets/me/transactions
  - [ ] GET /experts/me/wallet (expert)
  - [ ] GET /experts/me/earnings (expert)
- [ ] Create Payout controller
  - [ ] POST /experts/me/payout-accounts
  - [ ] GET /experts/me/payout-accounts
  - [ ] PUT /experts/me/payout-accounts/:id
  - [ ] DELETE /experts/me/payout-accounts/:id
  - [ ] POST /experts/me/payout-requests
  - [ ] GET /experts/me/payout-requests
  - [ ] GET /admin/payouts (admin)
  - [ ] PUT /admin/payouts/:id/status (admin)
  - [ ] POST /admin/payouts/batch (admin)
- [ ] Create Wallet service
  - [ ] Credit wallet
  - [ ] Debit wallet
  - [ ] Hold/release
  - [ ] Balance calculation
  - [ ] Transaction history
  - [ ] Idempotency handling
- [ ] Create Commission service
  - [ ] Calculate commission
  - [ ] Hold commission
  - [ ] Release commission
  - [ ] Commission rules
  - [ ] Commission rates
- [ ] Create Payout service
  - [ ] Payout account management
  - [ ] Payout request creation
  - [ ] Payout processing
  - [ ] Payout batching
  - [ ] Payout status tracking
  - [ ] Payment gateway integration
- [ ] Create Earning service
  - [ ] Calculate earning from booking
  - [ ] Release earning after completion
  - [ ] Make available after dispute window
  - [ ] Track paid out earnings
- [ ] Add audit trail
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Expert Earnings page `/expert/earnings`
  - [ ] Balance summary (available, pending, total)
  - [ ] Earnings chart (daily/weekly/monthly)
  - [ ] Transaction list
  - [ ] Filter by date
  - [ ] Export reports
- [ ] Create Expert Payout page `/expert/payout`
  - [ ] Add payout account
    - [ ] Bank account
    - [ ] Mobile money (bKash, Nagad)
    - [ ] PayPal
    - [ ] Account verification
  - [ ] Request payout
    - [ ] Amount
    - [ ] Select account
    - [ ] Confirm
  - [ ] Payout history
  - [ ] Payout status tracking
- [ ] Create Admin Finance page `/admin/finance`
  - [ ] Payout queue
  - [ ] Payout request detail
  - [ ] Process payout (mark as processed)
  - [ ] Batch processing
  - [ ] Commission settings
  - [ ] Finance reports
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M18: Expert Dashboard and Reports

**Status:** NOT_STARTED  
**Dependencies:** NH-M10 to NH-M17

### Backend Tasks

- [ ] Create Expert Dashboard controller
  - [ ] GET /experts/me/dashboard/stats
  - [ ] GET /experts/me/dashboard/bookings
  - [ ] GET /experts/me/dashboard/earnings
  - [ ] GET /experts/me/dashboard/ratings
  - [ ] GET /experts/me/dashboard/availability
- [ ] Create Report service
  - [ ] Booking metrics
  - [ ] Revenue metrics
  - [ ] Performance metrics
  - [ ] Rating analytics
  - [ ] Time series data
- [ ] Add caching
- [ ] Add Swagger documentation

### Frontend Tasks

- [ ] Create Expert Dashboard page `/expert/dashboard`
  - [ ] Stats cards
    - [ ] Total bookings
    - [ ] Total earnings
    - [ ] Average rating
    - [ ] Session count
    - [ ] Response time
  - [ ] Upcoming sessions
  - [ ] Recent earnings
  - [ ] Rating trend
  - [ ] Booking chart (daily/weekly/monthly)
  - [ ] Revenue chart
  - [ ] Quick actions
- [ ] Create Reports page `/expert/reports`
  - [ ] Date range picker
  - [ ] Bookings report
  - [ ] Earnings report
  - [ ] Services performance
  - [ ] Export reports (PDF/CSV)
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

# PHASE 4: COMPANY & JOBS

## NH-M19: Company Profile and Verification

**Status:** NOT_STARTED  
**Dependencies:** NH-M03, NH-M04

### Database Tasks

- [ ] Create Company model
  - [ ] id, owner_id
  - [ ] legal_name, brand_name
  - [ ] registration_number
  - [ ] tax_id (encrypted)
  - [ ] website
  - [ ] industry, company_size
  - [ ] country, address
  - [ ] phone, email
  - [ ] description
  - [ ] logo_url, cover_image_url
  - [ ] culture (jsonb)
  - [ ] benefits (jsonb)
  - [ ] slug (unique)
  - [ ] created_at, updated_at
- [ ] Create CompanyVerification model
  - [ ] id, company_id
  - [ ] status (draft, submitted, under_review, information_requested, verified, rejected, suspended)
  - [ ] documents (jsonb)
  - [ ] admin_notes
  - [ ] admin_feedback
  - [ ] submitted_at, reviewed_at
  - [ ] expires_at
  - [ ] created_at, updated_at
- [ ] Create CompanyMember model
  - [ ] id, company_id, user_id
  - [ ] role (owner, admin, recruiter, hr_manager, interviewer, viewer, finance)
  - [ ] status (pending, active, inactive)
  - [ ] invited_at, joined_at
  - [ ] invited_by
  - [ ] permissions (jsonb) - overrides
  - [ ] created_at, updated_at
- [ ] Add indexes
  - [ ] companies.owner_id
  - [ ] companies.slug (unique)
  - [ ] company_verifications.company_id
  - [ ] company_members.company_id
  - [ ] company_members.user_id

### Backend Tasks

- [ ] Create Company controller
  - [ ] POST /companies (create)
  - [ ] GET /companies/me
  - [ ] PUT /companies/me
  - [ ] GET /companies/:slug (public)
  - [ ] POST /companies/me/verification
  - [ ] GET /companies/me/verification
  - [ ] PUT /companies/me/verification/submit
- [ ] Create Admin Company controller
  - [ ] GET /admin/companies
  - [ ] GET /admin/companies/:id
  - [ ] PUT /admin/companies/:id/verification/status
  - [ ] POST /admin/companies/:id/verification/request-changes
- [ ] Create Company service
  - [ ] CRUD
  - [ ] Verification workflow
  - [ ] Slug generation
  - [ ] Public profile
- [ ] Add authorization
- [ ] Add validation DTOs
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Company Setup page `/company/setup`
  - [ ] Step 1: Basic info
  - [ ] Step 2: Contact info - [ ] Step 3: Verification documents
  - [ ] Step 4: Submit for review
  - [ ] Progress tracker
- [ ] Create Company Profile page `/company/profile`
  - [ ] Edit form
  - [ ] Logo upload
  - [ ] Cover image upload
  - [ ] Public preview
- [ ] Create Company Verification page `/company/verification`
  - [ ] Document upload
  - [ ] Submit for review
  - [ ] Status tracking
  - [ ] Admin feedback
- [ ] Create Company Public Profile page `/c/[slug]`
  - [ ] Company info
  - [ ] Culture
  - [ ] Benefits
  - [ ] Active jobs
  - [ ] Team (optional)
  - [ ] Contact
- [ ] Add responsive/accessible design

---

## NH-M20: Company Team and Permissions

**Status:** NOT_STARTED  
**Dependencies:** NH-M19

### Database Tasks

- [ ] Create CompanyInvitation model
  - [ ] id, company_id
  - [ ] email
  - [ ] role
  - [ ] permissions (jsonb)
  - [ ] token (unique)
  - [ ] status (pending, accepted, expired)
  - [ ] expires_at
  - [ ] created_at
- [ ] Add indexes
  - [ ] company_invitations.company_id
  - [ ] company_invitations.token (unique)
  - [ ] company_invitations.email

### Backend Tasks

- [ ] Create Company Team controller
  - [ ] GET /companies/me/members
  - [ ] POST /companies/me/members/invite
  - [ ] DELETE /companies/me/members/:id
  - [ ] PUT /companies/me/members/:id/role
  - [ ] GET /companies/me/invitations
  - [ ] POST /companies/me/invitations/:token/accept
  - [ ] DELETE /companies/me/invitations/:id
- [ ] Create Team service
  - [ ] Member management
  - [ ] Invitation workflow
  - [ ] Role assignment
  - [ ] Permission management
  - [ ] Tenant isolation
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Company Team page `/company/team`
  - [ ] Member list
  - [ ] Invite member
    - [ ] Email input
    - [ ] Role selection
    - [ ] Custom permissions
    - [ ] Send invitation
  - [ ] Member management
    - [ ] Change role
    - [ ] Remove member
  - [ ] Invitation list
    - [ ] Pending invitations
    - [ ] Resend
    - [ ] Cancel
- [ ] Add responsive/accessible design

---

## NH-M21: Company Candidate Search

**Status:** NOT_STARTED  
**Dependencies:** NH-M19, NH-M05

### Backend Tasks

- [ ] Create Candidate Search controller
  - [ ] GET /companies/me/candidates/search
  - [ ] GET /companies/me/candidates/:id/profile (with permission)
  - [ ] GET /companies/me/candidates/:id/cv (with permission)
  - [ ] POST /companies/me/candidates/:id/access-request
  - [ ] GET /companies/me/candidates/:id/access-status
- [ ] Create Candidate Search service
  - [ ] Search with filters
    - [ ] Skills
    - [ ] Verified skills
    - [ ] Job roles
    - [ ] Experience
    - [ ] Education
    - [ ] Location
    - [ ] Availability
    - [ ] Readiness levels
  - [ ] Privacy enforcement
  - [ ] Access request workflow
  - [ ] Permission checking
- [ ] Add audit logging
- [ ] Add rate limiting
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Candidate Search page `/company/talent/search`
  - [ ] Search bar
  - [ ] Advanced filters
    - [ ] Skills
    - [ ] Experience
    - [ ] Location
    - [ ] Education
    - [ ] Availability
  - [ ] Results with pagination
  - [ ] Candidate cards
    - [ ] Name, headline
    - [ ] Skills
    - [ ] Readiness
    - [ ] Request access button
  - [ ] Saved searches
- [ ] Create Candidate Profile View page `/company/talent/[id]`
  - [ ] Profile sections (with privacy enforcement)
  - [ ] Request full access
  - [ ] Access status
  - [ ] Add to shortlist
  - [ ] Contact
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M22: Shortlists and Talent Pipeline

**Status:** NOT_STARTED  
**Dependencies:** NH-M21

### Database Tasks

- [ ] Create Shortlist model
  - [ ] id, company_id
  - [ ] name
  - [ ] description
  - [ ] is_active
  - [ ] created_by
  - [ ] created_at, updated_at
- [ ] Create ShortlistCandidate model
  - [ ] id, shortlist_id, candidate_id
  - [ ] added_at
  - [ ] notes (text)
  - [ ] tags (jsonb)
  - [ ] stage (jsonb)
  - [ ] order
- [ ] Add indexes
  - [ ] shortlists.company_id
  - [ ] shortlist_candidates.shortlist_id
  - [ ] shortlist_candidates.candidate_id

### Backend Tasks

- [ ] Create Shortlist controller
  - [ ] GET /companies/me/shortlists
  - [ ] POST /companies/me/shortlists
  - [ ] GET /companies/me/shortlists/:id
  - [ ] PUT /companies/me/shortlists/:id
  - [ ] DELETE /companies/me/shortlists/:id
  - [ ] POST /companies/me/shortlists/:id/candidates
  - [ ] DELETE /companies/me/shortlists/:id/candidates/:candidate_id
  - [ ] PUT /companies/me/shortlists/:id/candidates/:candidate_id/notes
  - [ ] PUT /companies/me/shortlists/:id/candidates/:candidate_id/tags
  - [ ] PUT /companies/me/shortlists/:id/candidates/:candidate_id/stage
- [ ] Create Shortlist service
  - [ ] CRUD
  - [ ] Candidate management
  - [ ] Tags and notes
  - [ ] Stage management
  - [ ] Ordering
  - [ ] Company isolation
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Shortlists page `/company/talent/shortlists`
  - [ ] List shortlists
  - [ ] Create new shortlist
  - [ ] Delete shortlist
- [ ] Create Shortlist Detail page `/company/talent/shortlists/[id]`
  - [ ] Shortlist info
  - [ ] Candidate list (Kanban/List view)
  - [ ] Add candidate
  - [ ] Remove candidate
  - [ ] Add notes
  - [ ] Add tags
  - [ ] Move between stages
  - [ ] Reorder candidates
- [ ] Add responsive/accessible design

---

## NH-M23: Candidate Contact and Communication

**Status:** NOT_STARTED  
**Dependencies:** NH-M21, NH-M22

### Database Tasks

- [ ] Create ContactConsent model
  - [ ] id, candidate_id, company_id
  - [ ] consent_type (email, sms, phone)
  - [ ] status (granted, revoked, expired)
  - [ ] granted_at, revoked_at
  - [ ] expires_at
- [ ] Create ContactHistory model
  - [ ] id, company_id, candidate_id
  - [ ] channel (email, sms, in_app)
  - [ ] message (text)
  - [ ] sent_at
  - [ ] delivered_at
  - [ ] viewed_at
  - [ ] replied_at
- [ ] Add indexes
  - [ ] contact_consent.candidate_id
  - [ ] contact_consent.company_id
  - [ ] contact_history.company_id
  - [ ] contact_history.candidate_id

### Backend Tasks

- [ ] Create Contact controller
  - [ ] POST /companies/me/candidates/:id/contact
  - [ ] GET /companies/me/candidates/:id/contact-history
  - [ ] POST /candidates/me/contact-consent/grant
  - [ ] POST /candidates/me/contact-consent/revoke
  - [ ] GET /candidates/me/contact-consent
- [ ] Create Contact service
  - [ ] Send email
  - [ ] Send SMS
  - [ ] Send in-app message
  - [ ] Consent checking
  - [ ] Rate limiting
  - [ ] Template management
  - [ ] History tracking
- [ ] Add email/SMS provider
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Contact page `/company/talent/[id]/contact`
  - [ ] Contact options
    - [ ] Email
    - [ ] SMS (if available)
    - [ ] In-app message
  - [ ] Template selection
  - [ ] Message composer
  - [ ] Send
  - [ ] History
- [ ] Create Candidate Consent page `/candidate/privacy/consent`
  - [ ] View pending consents
  - [ ] Grant/revoke consent
  - [ ] Consent history
- [ ] Add responsive/accessible design

---

## NH-M24: Job Posting and Public Job Board

**Status:** NOT_STARTED  
**Dependencies:** NH-M19

### Database Tasks

- [ ] Create Job model
  - [ ] id, company_id
  - [ ] title, slug
  - [ ] description
  - [ ] responsibilities (jsonb)
  - [ ] requirements (jsonb)
  - [ ] preferred_skills (jsonb)
  - [ ] education_min
  - [ ] experience_min (years)
  - [ ] is_fresh_graduate (boolean)
  - [ ] employment_type (full_time, part_time, contract, internship)
  - [ ] work_mode (remote, hybrid, onsite)
  - [ ] country, city
  - [ ] salary_min, salary_max
  - [ ] salary_currency
  - [ ] salary_visible (boolean)
  - [ ] benefits (jsonb)
  - [ ] vacancies
  - [ ] application_deadline
  - [ ] joining_date (optional)
  - [ ] category, sub_category
  - [ ] industry
  - [ ] status (draft, pending_review, published, paused, closed, expired, archived)
  - [ ] visibility (public, verified_only, invited_only)
  - [ ] is_featured
  - [ ] posted_by
  - [ ] published_at, closed_at
  - [ ] created_at, updated_at
- [ ] Create JobCategory model
  - [ ] id, name, slug
  - [ ] description
  - [ ] parent_id (optional)
  - [ ] is_active
  - [ ] created_at
- [ ] Create JobSkill model
  - [ ] id, job_id
  - [ ] skill_name
  - [ ] is_required
  - [ ] created_at
- [ ] Create SavedJob model
  - [ ] id, candidate_id, job_id
  - [ ] created_at
- [ ] Create JobAlert model
  - [ ] id, candidate_id
  - [ ] filters (jsonb)
  - [ ] frequency (daily, weekly)
  - [ ] is_active
  - [ ] created_at, updated_at
- [ ] Add indexes
  - [ ] jobs.company_id
  - [ ] jobs.slug (unique)
  - [ ] jobs.status
  - [ ] jobs.published_at
  - [ ] jobs.application_deadline
  - [ ] saved_jobs.candidate_id
  - [ ] saved_jobs.job_id
  - [ ] job_alerts.candidate_id

### Backend Tasks

- [ ] Create Job controller
  - [ ] GET /companies/me/jobs
  - [ ] POST /companies/me/jobs
  - [ ] GET /companies/me/jobs/:id
  - [ ] PUT /companies/me/jobs/:id
  - [ ] DELETE /companies/me/jobs/:id
  - [ ] PUT /companies/me/jobs/:id/status
  - [ ] POST /companies/me/jobs/:id/duplicate
  - [ ] GET /jobs (public)
  - [ ] GET /jobs/:slug (public)
  - [ ] GET /jobs/categories
  - [ ] POST /candidates/me/saved-jobs/:jobId
  - [ ] DELETE /candidates/me/saved-jobs/:jobId
  - [ ] GET /candidates/me/saved-jobs
  - [ ] POST /candidates/me/job-alerts
  - [ ] GET /candidates/me/job-alerts
  - [ ] DELETE /candidates/me/job-alerts/:id
- [ ] Create Job service
  - [ ] CRUD
  - [ ] Slug generation
  - [ ] Status management
  - [ ] Publish workflow
  - [ ] Visibility enforcement
  - [ ] Search and filtering
  - [ ] Saved jobs
  - [ ] Job alerts
- [ ] Add moderation for new jobs
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Company Job Management page `/company/jobs`
  - [ ] Job list
  - [ ] Create new job
  - [ ] Edit job
  - [ ] Manage status (draft, publish, pause, close)
  - [ ] Duplicate job
  - [ ] Delete job
  - [ ] View applications count
- [ ] Create Job Editor page `/company/jobs/create` and `/company/jobs/[id]/edit`
  - [ ] All job fields
  - [ ] Skills management
  - [ ] Salary
  - [ ] Benefits
  - [ ] Screening questions
  - [ ] Visibility settings
  - [ ] Preview
  - [ ] Save draft
  - [ ] Publish
- [ ] Create Public Job Board page `/jobs`
  - [ ] Search bar
  - [ ] Filters
    - [ ] Category
    - [ ] Employment type
    - [ ] Work mode
    - [ ] Location
    - [ ] Salary range
  - [ ] Sort options
  - [ ] Job cards
    - [ ] Title, company
    - [ ] Location
    - [ ] Salary (if visible)
    - [ ] Posted date
    - [ ] Save job
    - [ ] Apply
  - [ ] Pagination
- [ ] Create Job Detail page `/jobs/[slug]`
  - [ ] Job details
    - [ ] Title, company
    - [ ] Description
    - [ ] Responsibilities
    - [ ] Requirements
    - [ ] Benefits
    - [ ] Salary (if visible)
    - [ ] Location
    - [ ] Deadline
  - [ ] Company info
  - [ ] Apply button
  - [ ] Save job
  - [ ] Share
- [ ] Create Saved Jobs page `/candidate/saved-jobs`
  - [ ] List saved jobs
  - [ ] Remove from saved
  - [ ] Apply
- [ ] Create Job Alerts page `/candidate/job-alerts`
  - [ ] Create alert with filters
  - [ ] List alerts
  - [ ] Edit alert
  - [ ] Delete alert
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M25: Job Applications and Applicant Tracking

**Status:** NOT_STARTED  
**Dependencies:** NH-M24

### Database Tasks

- [ ] Create Application model
  - [ ] id, job_id, candidate_id
  - [ ] cv_id (snapshot)
  - [ ] cv_snapshot (jsonb)
  - [ ] cover_letter
  - [ ] salary_expectation
  - [ ] availability_date
  - [ ] screening_answers (jsonb)
  - [ ] selected_projects (jsonb)
  - [ ] career_passport_snapshot (jsonb)
  - [ ] status (applied, screening, shortlisted, interview, offer, hired, rejected, withdrawn)
  - [ ] stage_id (optional)
  - [ ] current_stage_order
  - [ ] submitted_at
  - [ ] updated_at
- [ ] Create ApplicationStage model
  - [ ] id, application_id
  - [ ] stage_name
  - [ ] order
  - [ ] status (pending, passed, failed, skipped)
  - [ ] started_at, completed_at
  - [ ] reviewer_id (optional)
  - [ ] notes
- [ ] Create ApplicationNote model
  - [ ] id, application_id
  - [ ] author_id
  - [ ] content
  - [ ] created_at
- [ ] Create ApplicationActivity model
  - [ ] id, application_id
  - [ ] action
  - [ ] description
  - [ ] performed_by
  - [ ] performed_at
- [ ] Add indexes
  - [ ] applications.job_id
  - [ ] applications.candidate_id
  - [ ] applications.status
  - [ ] application_stages.application_id

### Backend Tasks

- [ ] Create Application controller
  - [ ] POST /jobs/:id/apply (candidate)
  - [ ] GET /candidates/me/applications
  - [ ] GET /candidates/me/applications/:id
  - [ ] PUT /candidates/me/applications/:id/withdraw
  - [ ] GET /companies/me/jobs/:id/applications
  - [ ] GET /companies/me/applications/:id
  - [ ] PUT /companies/me/applications/:id/stage
  - [ ] PUT /companies/me/applications/:id/status
  - [ ] POST /companies/me/applications/:id/notes
  - [ ] GET /companies/me/applications/:id/notes
- [ ] Create Application service
  - [ ] Apply to job
  - [ ] CV snapshot
  - [ ] Screening answers
  - [ ] Application status management
  - [ ] Stage management
  - [ ] Notes
  - [ ] Activity tracking
  - [ ] Withdraw
  - [ ] Duplicate prevention
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Application Form `/jobs/[slug]/apply`
  - [ ] Select CV version
  - [ ] Select projects to attach
  - [ ] Cover letter
  - [ ] Screening questions answers
  - [ ] Salary expectation
  - [ ] Availability
  - [ ] Consent
  - [ ] Submit
  - [ ] Success page
- [ ] Create Candidate Applications page `/candidate/applications`
  - [ ] List applications
  - [ ] Filter by status
  - [ ] Application detail
  - [ ] Application status
  - [ ] Withdraw
- [ ] Create Company Applicant List page `/company/jobs/[id]/applicants`
  - [ ] Applicant list
  - [ ] Filter by stage/status
  - [ ] Search
  - [ ] Bulk actions
  - [ ] Move between stages
  - [ ] Add notes
- [ ] Create Company Applicant Detail page `/company/applications/[id]`
  - [ ] Application info
  - [ ] CV preview
  - [ ] Screening answers
  - [ ] Stage history
  - [ ] Notes
  - [ ] Actions (advance, reject, etc.)
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M26: Company Dashboard and Analytics

**Status:** NOT_STARTED  
**Dependencies:** NH-M19 to NH-M25

### Backend Tasks

- [ ] Create Company Dashboard controller
  - [ ] GET /companies/me/dashboard/stats
  - [ ] GET /companies/me/dashboard/jobs
  - [ ] GET /companies/me/dashboard/applications
  - [ ] GET /companies/me/dashboard/hiring
  - [ ] GET /companies/me/dashboard/candidates
  - [ ] GET /companies/me/reports/applications
  - [ ] GET /companies/me/reports/hiring
- [ ] Create Analytics service
  - [ ] Job performance
  - [ ] Application funnel
  - [ ] Time to hire
  - [ ] Source effectiveness
  - [ ] Team activity
- [ ] Add caching
- [ ] Add Swagger documentation

### Frontend Tasks

- [ ] Create Company Dashboard page `/company/dashboard`
  - [ ] Stats cards
    - [ ] Active jobs
    - [ ] Total applications
    - [ ] Interviews scheduled
    - [ ] Offers made
    - [ ] Hires
  - [ ] Recent applications
  - [ ] Hiring funnel chart
  - [ ] Job performance
  - [ ] Team activity
  - [ ] Quick actions
- [ ] Create Reports page `/company/reports`
  - [ ] Date range picker
  - [ ] Application report
  - [ ] Hiring report
  - [ ] Pipeline report
  - [ ] Source report
  - [ ] Export (PDF/CSV)
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

# PHASE 5: SHARED PLATFORM

## NH-M27: Messaging and Realtime

**Status:** NOT_STARTED  
**Dependencies:** NH-M03

### Database Tasks

- [ ] Create Conversation model
  - [ ] id, type (direct, group)
  - [ ] name (optional)
  - [ ] created_at, updated_at
- [ ] Create ConversationParticipant model
  - [ ] id, conversation_id, user_id
  - [ ] last_read_at
  - [ ] is_muted
  - [ ] is_pinned
  - [ ] joined_at
- [ ] Create Message model
  - [ ] id, conversation_id, sender_id
  - [ ] content (text)
  - [ ] type (text, file, system)
  - [ ] metadata (jsonb)
  - [ ] sent_at
  - [ ] is_deleted
- [ ] Create MessageRead model
  - [ ] id, message_id, user_id
  - [ ] read_at
- [ ] Create MessageAttachment model
  - [ ] id, message_id
  - [ ] file_url
  - [ ] file_name, file_size
  - [ ] mime_type
  - [ ] created_at
- [ ] Add indexes
  - [ ] conversation_participants.conversation_id
  - [ ] conversation_participants.user_id
  - [ ] messages.conversation_id
  - [ ] messages.sent_at

### Backend Tasks

- [ ] Create Messaging controller
  - [ ] GET /conversations
  - [ ] POST /conversations
  - [ ] GET /conversations/:id
  - [ ] POST /conversations/:id/messages
  - [ ] GET /conversations/:id/messages
  - [ ] PUT /conversations/:id/messages/:messageId/read
  - [ ] PUT /conversations/:id/mute
  - [ ] PUT /conversations/:id/unmute
  - [ ] DELETE /conversations/:id
  - [ ] DELETE /conversations/:id/messages/:messageId
- [ ] Create Messaging service
  - [ ] Conversation management
  - [ ] Message CRUD
  - [ ] Read receipts
  - [ ] Real-time via Socket.IO
  - [ ] Typing indicators
  - [ ] File attachments
  - [ ] Conversation isolation
- [ ] Create Socket.IO gateway
  - [ ] Connection handling
  - [ ] Authentication
  - [ ] Room management
  - [ ] Message broadcasting
  - [ ] Read receipts
  - [ ] Typing indicators
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Inbox page `/messages`
  - [ ] Conversation list
    - [ ] Unread count
    - [ ] Last message
    - [ ] Timestamp
    - [ ] Mute status
  - [ ] Create new conversation
  - [ ] Search conversations
- [ ] Create Conversation page `/messages/[id]`
  - [ ] Message list
  - [ ] Message input
  - [ ] Attachments
  - [ ] Typing indicator
  - [ ] Read receipts
  - [ ] Message actions
  - [ ] Participant info
- [ ] Create Chat widget (context-aware)
  - [ ] Quick access
  - [ ] Minimal chat window
  - [ ] Expandable
- [ ] Add Socket.IO integration
- [ ] Add responsive/accessible design

---

## NH-M28: Notifications and Preferences

**Status:** NOT_STARTED  
**Dependencies:** NH-M02, NH-M03, NH-M27

### Database Tasks

- [ ] Create Notification model
  - [ ] id, user_id
  - [ ] type (system, booking, message, job, etc.)
  - [ ] title, content
  - [ ] data (jsonb)
  - [ ] channel (in_app, email, sms, push)
  - [ ] is_read
  - [ ] read_at
  - [ ] created_at
  - [ ] delivered_at
- [ ] Create NotificationPreference model
  - [ ] id, user_id
  - [ ] type (booking_confirmation, booking_reminder, message_new, job_alert, etc.)
  - [ ] channels (jsonb) - { email: true, sms: false, push: true }
  - [ ] is_enabled
  - [ ] created_at, updated_at
- [ ] Create NotificationQueue model
  - [ ] id
  - [ ] notification_id
  - [ ] channel
  - [ ] status (pending, sent, failed)
  - [ ] error
  - [ ] attempts
  - [ ] created_at, sent_at
- [ ] Add indexes
  - [ ] notifications.user_id
  - [ ] notifications.is_read
  - [ ] notifications.created_at
  - [ ] notification_preferences.user_id

### Backend Tasks

- [ ] Create Notification controller
  - [ ] GET /notifications
  - [ ] GET /notifications/unread-count
  - [ ] PUT /notifications/:id/read
  - [ ] PUT /notifications/read-all
  - [ ] PUT /notifications/:id/archive
  - [ ] DELETE /notifications/:id
  - [ ] GET /notifications/preferences
  - [ ] PUT /notifications/preferences
- [ ] Create Notification service
  - [ ] Create notification
  - [ ] Send in-app
  - [ ] Queue email
  - [ ] Queue SMS
  - [ ] Queue push
  - [ ] Mark read
  - [ ] Preferences management
  - [ ] Batch processing
  - [ ] Deduplication
- [ ] Create Notification workers
  - [ ] Email worker
  - [ ] SMS worker
  - [ ] Push worker
- [ ] Add event listeners for notification triggers
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Notification Center page `/notifications`
  - [ ] Notification list
  - [ ] Filter by type
  - [ ] Mark all as read
  - [ ] Mark individual read
  - [ ] Delete notification
  - [ ] Real-time updates
- [ ] Create Notification Badge (global header)
  - [ ] Unread count
  - [ ] Quick dropdown
  - [ ] Recent notifications
  - [ ] Mark all read
  - [ ] View all link
- [ ] Create Preferences page `/settings/notifications`
  - [ ] Channel preferences
    - [ ] In-app
    - [ ] Email
    - [ ] SMS
    - [ ] Push
  - [ ] Event preferences
    - [ ] Booking
    - [ ] Messages
    - [ ] Jobs
    - [ ] System
    - [ ] Marketing (opt-in)
  - [ ] Digest settings
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M29: Payments, Refunds, and Commission

**Status:** NOT_STARTED  
**Dependencies:** NH-M14, NH-M17

### Database Tasks

- [ ] Create PaymentOrder model
  - [ ] id, user_id
  - [ ] amount, currency
  - [ ] description
  - [ ] type (booking, course, subscription)
  - [ ] reference_type, reference_id
  - [ ] status (pending, processing, paid, failed, refunded)
  - [ ] gateway, gateway_order_id
  - [ ] metadata (jsonb)
  - [ ] idempotency_key (unique)
  - [ ] created_at, updated_at
- [ ] Create PaymentAttempt model
  - [ ] id, order_id
  - [ ] gateway_transaction_id
  - [ ] status (initiated, success, failed)
  - [ ] amount, currency
  - [ ] gateway_response (jsonb)
  - [ ] created_at
- [ ] Create PaymentWebhook model
  - [ ] id, gateway
  - [ ] event_type
  - [ ] payload (jsonb)
  - [ ] processed (boolean)
  - [ ] processed_at
  - [ ] signature_valid
  - [ ] created_at
- [ ] Create Refund model
  - [ ] id, order_id
  - [ ] amount, currency
  - [ ] reason
  - [ ] status (pending, processing, completed, failed)
  - [ ] gateway_refund_id
  - [ ] approved_by (admin)
  - [ ] created_at, completed_at
- [ ] Create Invoice model
  - [ ] id, order_id
  - [ ] invoice_number (unique)
  - [ ] recipient_name, recipient_email
  - [ ] items (jsonb)
  - [ ] subtotal, tax, total
  - [ ] currency
  - [ ] status (draft, sent, paid, void)
  - [ ] pdf_url
  - [ ] created_at, sent_at
- [ ] Add indexes
  - [ ] payment_orders.user_id
  - [ ] payment_orders.reference_type, reference_id
  - [ ] payment_orders.idempotency_key (unique)
  - [ ] payment_orders.gateway_order_id
  - [ ] refunds.order_id
  - [ ] invoices.order_id

### Backend Tasks

- [ ] Create Payment controller
  - [ ] POST /payments/initiate
  - [ ] POST /payments/webhook (gateway)
  - [ ] GET /payments/orders/:id
  - [ ] GET /payments/orders (user)
  - [ ] POST /payments/orders/:id/refund
  - [ ] GET /payments/refunds (admin)
  - [ ] PUT /payments/refunds/:id/status (admin)
- [ ] Create Payment service
  - [ ] Initiate payment
  - [ ] Process payment
  - [ ] Webhook handling (idempotent)
  - [ ] Refund processing
  - [ ] Invoice generation
  - [ ] Gateway abstraction
  - [ ] Commission calculation
  - [ ] Wallet integration
- [ ] Create Payment Gateway adapters
  - [ ] aamarpay (BD)
  - [ ] bKash (BD)
  - [ ] Nagad (BD)
  - [ ] jazzcash (PK)
  - [ ] easypaisa (PK)
  - [ ] razorpay (IN)
  - [ ] stripe (international)
  - [ ] paypal (international)
- [ ] Add webhook verification
- [ ] Add idempotency
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Checkout page `/checkout`
  - [ ] Order summary
  - [ ] Payment method selection
  - [ ] Gateway redirect/form
  - [ ] Processing state
  - [ ] Success page
  - [ ] Failure page with retry
- [ ] Create Payment History page `/payments`
  - [ ] List orders
  - [ ] Order detail
  - [ ] Invoice download
  - [ ] Refund status
- [ ] Create Admin Payment Management page `/admin/payments`
  - [ ] Orders list
  - [ ] Order detail
  - [ ] Refund processing
  - [ ] Transaction logs
  - [ ] Webhook logs
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M30: Secure File and Media Management

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Per-feature secure storage exists (expert docs, certificates, MinIO infra). Gap: no unified module or reusable uploader  
**Dependencies:** NH-M01

### Database Tasks

- [ ] Create File model
  - [ ] id, user_id (optional)
  - [ ] name, original_name
  - [ ] key (unique - storage path)
  - [ ] bucket
  - [ ] mime_type
  - [ ] size
  - [ ] checksum (sha256)
  - [ ] is_public
  - [ ] visibility (private, trainer, company, public)
  - [ ] reference_type, reference_id (optional)
  - [ ] metadata (jsonb)
  - [ ] uploaded_at
  - [ ] expires_at (optional)
  - [ ] deleted_at (soft delete)
- [ ] Create FileAccess model
  - [ ] id, file_id, user_id
  - [ ] access_type (view, download, edit)
  - [ ] granted_at
  - [ ] expires_at (optional)
- [ ] Add indexes
  - [ ] files.key (unique)
  - [ ] files.user_id
  - [ ] files.reference_type, reference_id
  - [ ] file_access.file_id
  - [ ] file_access.user_id

### Backend Tasks

- [ ] Create File controller
  - [ ] POST /files/upload (presigned URL)
  - [ ] POST /files/finalize (after upload)
  - [ ] GET /files/:id (download)
  - [ ] GET /files/:id/url (signed URL)
  - [ ] DELETE /files/:id
  - [ ] PUT /files/:id/visibility
  - [ ] POST /files/:id/access (grant access)
  - [ ] DELETE /files/:id/access/:userId
- [ ] Create File service
  - [ ] Presigned upload URL generation
  - [ ] File validation (MIME, size, signature)
  - [ ] Checksum verification
  - [ ] Malware scan (hook)
  - [ ] Signed download URLs
  - [ ] Access control
  - [ ] Retention/deletion
  - [ ] Cleanup job
- [ ] Add MinIO integration
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create File Upload component
  - [ ] Drag and drop
  - [ ] File selection
  - [ ] Progress bar
  - [ ] Validation errors
  - [ ] Preview (images/videos)
  - [ ] Remove
  - [ ] Replace
- [ ] Create Image Uploader (profile, cover, etc.)
  - [ ] Drag and drop
  - [ ] Crop
  - [ ] Resize
- [ ] Create File Manager component
  - [ ] File list
  - [ ] Upload
  - [ ] Delete
  - [ ] Download
  - [ ] Share
- [ ] Add accessibility
- [ ] Add responsive design

---

# PHASE 6: SUPERADMIN & OPERATIONS

## NH-M31: Users, Roles, and Permissions Management

**Status:** NOT_STARTED  
**Dependencies:** NH-M04

### Backend Tasks

- [ ] Create Admin User controller
  - [ ] GET /admin/users
  - [ ] GET /admin/users/:id
  - [ ] PUT /admin/users/:id/status (suspend/activate)
  - [ ] POST /admin/users/:id/roles
  - [ ] DELETE /admin/users/:id/roles/:roleId
  - [ ] GET /admin/roles
  - [ ] POST /admin/roles
  - [ ] PUT /admin/roles/:id
  - [ ] DELETE /admin/roles/:id
  - [ ] GET /admin/permissions
  - [ ] PUT /admin/roles/:id/permissions
- [ ] Create Admin User service
  - [ ] User search
  - [ ] Status management
  - [ ] Role assignment
  - [ ] Permission management
  - [ ] Activity tracking
- [ ] Add authorization (super_admin only)
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Users page `/admin/users`
  - [ ] User list with search
  - [ ] Filter by role/status
  - [ ] User detail
  - [ ] Suspend/activate
  - [ ] Role management
  - [ ] Activity log
- [ ] Create Admin Roles page `/admin/roles`
  - [ ] Role list
  - [ ] Create role
  - [ ] Edit role
  - [ ] Permission assignment (matrix)
  - [ ] Role usage
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

## NH-M32: Verification and Moderation Center

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Expert application review queue + UI exist. Gap: no unified center, no company queue, no moderation  
**Dependencies:** NH-M10, NH-M19, NH-M31

### Backend Tasks

- [ ] Create Admin Moderation controller
  - [ ] GET /admin/moderation/experts
  - [ ] GET /admin/moderation/experts/:id
  - [ ] PUT /admin/moderation/experts/:id/status
  - [ ] GET /admin/moderation/companies
  - [ ] GET /admin/moderation/companies/:id
  - [ ] PUT /admin/moderation/companies/:id/status
  - [ ] GET /admin/moderation/reports
  - [ ] GET /admin/moderation/reports/:id
  - [ ] PUT /admin/moderation/reports/:id/status
  - [ ] GET /admin/moderation/content
  - [ ] PUT /admin/moderation/content/:id/action
- [ ] Create Moderation service
  - [ ] Expert verification
  - [ ] Company verification
  - [ ] Content review
  - [ ] Report handling
  - [ ] Document viewing (with permission)
  - [ ] Decision logging
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Moderation Dashboard `/admin/moderation`
  - [ ] Queue stats
  - [ ] Expert verifications
  - [ ] Company verifications
  - [ ] Reported content
- [ ] Create Expert Verification Queue `/admin/moderation/experts`
  - [ ] List pending
  - [ ] Filter by status
  - [ ] Expert detail
  - [ ] View documents
  - [ ] Approve/reject/request changes
  - [ ] Add notes
- [ ] Create Company Verification Queue `/admin/moderation/companies`
  - [ ] List pending
  - [ ] Company detail
  - [ ] View documents
  - [ ] Approve/reject/request changes
- [ ] Create Reports Queue `/admin/moderation/reports`
  - [ ] List reports
  - [ ] Report detail
  - [ ] Review content
  - [ ] Take action
  - [ ] Close report
- [ ] Add responsive/accessible design

---

## NH-M33: Catalog and Content Management

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Assessment category/question mgmt + expertise catalog exist. Gap: no unified admin catalog UI  
**Dependencies:** NH-M31

### Database Tasks

- [ ] Create Country model
  - [ ] code, name, phone_code
  - [ ] currency, currency_symbol
  - [ ] timezone
  - [ ] is_active
- [ ] Create Language model
  - [ ] code, name, native_name
  - [ ] is_rtl
  - [ ] is_active
- [ ] Create SkillCatalog model
  - [ ] name, category
  - [ ] description
  - [ ] is_active
- [ ] Create ExpertiseCatalog model
  - [ ] name, category
  - [ ] description
  - [ ] is_active
- [ ] Create Industry model
  - [ ] name, slug
  - [ ] description
  - [ ] is_active
- [ ] Create Currency model
  - [ ] code, name, symbol
  - [ ] decimal_places
  - [ ] is_active
- [ ] Create Template model (email, sms, notification)
  - [ ] name, slug
  - [ ] type (email, sms, notification)
  - [ ] subject (email)
  - [ ] content (html/text)
  - [ ] variables (jsonb)
  - [ ] is_active
- [ ] Add indexes
  - [ ] skill_catalog.name
  - [ ] expertise_catalog.name
  - [ ] industries.slug

### Backend Tasks

- [ ] Create Admin Catalog controller
  - [ ] GET /admin/catalog/countries
  - [ ] POST /admin/catalog/countries
  - [ ] PUT /admin/catalog/countries/:code
  - [ ] GET /admin/catalog/languages
  - [ ] POST /admin/catalog/languages
  - [ ] GET /admin/catalog/skills
  - [ ] POST /admin/catalog/skills
  - [ ] PUT /admin/catalog/skills/:id
  - [ ] GET /admin/catalog/expertise
  - [ ] POST /admin/catalog/expertise
  - [ ] GET /admin/catalog/industries
  - [ ] POST /admin/catalog/industries
  - [ ] GET /admin/catalog/templates
  - [ ] POST /admin/catalog/templates
  - [ ] PUT /admin/catalog/templates/:id
- [ ] Create Catalog service
  - [ ] CRUD for all catalogs
  - [ ] Template management
  - [ ] Activation/deactivation
  - [ ] Usage checks before deletion
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Catalog page `/admin/catalog`
  - [ ] Tab navigation
    - [ ] Countries
    - [ ] Languages
    - [ ] Skills
    - [ ] Expertise
    - [ ] Industries
    - [ ] Currencies
    - [ ] Templates
  - [ ] List view
  - [ ] Add/Edit form
  - [ ] Toggle active/inactive
  - [ ] Delete (with usage warning)
- [ ] Create Template Editor `/admin/catalog/templates`
  - [ ] Template list
  - [ ] Create/Edit
  - [ ] Variables helper
  - [ ] Preview
  - [ ] Test send
- [ ] Add responsive/accessible design

---

## NH-M34: Finance Operations

**Status:** NOT_STARTED  
**Dependencies:** NH-M17, NH-M29

### Backend Tasks

- [ ] Create Admin Finance controller
  - [ ] GET /admin/finance/transactions
  - [ ] GET /admin/finance/transactions/:id
  - [ ] GET /admin/finance/refunds
  - [ ] PUT /admin/finance/refunds/:id/status
  - [ ] GET /admin/finance/commissions
  - [ ] PUT /admin/finance/commissions/settings
  - [ ] GET /admin/finance/payouts
  - [ ] PUT /admin/finance/payouts/:id/status
  - [ ] POST /admin/finance/payouts/batch
  - [ ] GET /admin/finance/reports
  - [ ] POST /admin/finance/reports/export
- [ ] Create Finance service
  - [ ] Transaction management
  - [ ] Refund processing
  - [ ] Commission settings
  - [ ] Payout approval
  - [ ] Reconciliation
  - [ ] Report generation
  - [ ] Audit trail
- [ ] Add authorization (finance admin only)
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Finance Dashboard `/admin/finance`
  - [ ] Stats
    - [ ] Total revenue
    - [ ] Pending refunds
    - [ ] Pending payouts
    - [ ] Total commissions
  - [ ] Transaction list
  - [ ] Refund queue
  - [ ] Payout queue
- [ ] Create Transactions page `/admin/finance/transactions`
  - [ ] List with filters
  - [ ] Transaction detail
  - [ ] Refund
- [ ] Create Refunds page `/admin/finance/refunds`
  - [ ] List pending
  - [ ] Refund detail
  - [ ] Process refund
  - [ ] Reject refund
- [ ] Create Payouts page `/admin/finance/payouts`
  - [ ] Pending requests
  - [ ] Batch processing
  - [ ] Mark as paid
  - [ ] Failed payouts
- [ ] Create Commission Settings page `/admin/finance/commission`
  - [ ] Platform commission rate
  - [ ] Payment gateway fee
  - [ ] Tax settings
  - [ ] Commission rules
- [ ] Add responsive/accessible design

---

## NH-M35: Audit, Security Events, and Support

**Status:** IN_PROGRESS  
**Reality (2026-07-23 audit):** Audit foundation + events exist across features. Gap: no admin search/detail UI  
**Dependencies:** NH-M31

### Backend Tasks

- [ ] Create Admin Audit controller
  - [ ] GET /admin/audit/logs
  - [ ] GET /admin/audit/logs/:id
  - [ ] GET /admin/audit/security
  - [ ] GET /admin/audit/users/:userId
  - [ ] GET /admin/audit/export
- [ ] Create Support controller
  - [ ] POST /support/tickets
  - [ ] GET /support/tickets
  - [ ] GET /support/tickets/:id
  - [ ] POST /support/tickets/:id/messages
  - [ ] PUT /support/tickets/:id/status
  - [ ] GET /admin/support/tickets
  - [ ] PUT /admin/support/tickets/:id/assign
  - [ ] PUT /admin/support/tickets/:id/status
- [ ] Create Audit service
  - [ ] Log audit events
  - [ ] Search audit logs
  - [ ] Security event detection
  - [ ] Report generation
  - [ ] Data retention
- [ ] Create Support service
  - [ ] Ticket CRUD
  - [ ] Message management
  - [ ] Assignment
  - [ ] Status management
- [ ] Add authorization
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Audit Logs page `/admin/audit`
  - [ ] Log list
  - [ ] Filters (user, action, resource, date)
  - [ ] Log detail
  - [ ] Export
- [ ] Create Security Events page `/admin/security`
  - [ ] Event list
  - [ ] Suspicious activity
  - [ ] Session management
- [ ] Create Support Tickets page `/admin/support`
  - [ ] Ticket list
  - [ ] Filter by status/priority
  - [ ] Ticket detail
  - [ ] Reply
  - [ ] Assign
  - [ ] Change status
- [ ] Create Support page `/support` (user)
  - [ ] Create ticket
  - [ ] Ticket list
  - [ ] Ticket detail
  - [ ] Reply
- [ ] Add responsive/accessible design

---

## NH-M36: Settings and Feature Flags

**Status:** NOT_STARTED  
**Dependencies:** NH-M31

### Database Tasks

- [ ] Create SystemSetting model
  - [ ] id, key (unique)
  - [ ] value (jsonb)
  - [ ] type (string, number, boolean, json)
  - [ ] category
  - [ ] description
  - [ ] is_public
  - [ ] updated_by
  - [ ] updated_at
- [ ] Create FeatureFlag model
  - [ ] id, key (unique)
  - [ ] enabled (boolean)
  - [ ] description
  - [ ] categories (jsonb)
  - [ ] percentage_rollout (int, 0-100)
  - [ ] user_whitelist (jsonb)
  - [ ] updated_by, updated_at
- [ ] Create SettingHistory model
  - [ ] id, setting_key
  - [ ] old_value (jsonb)
  - [ ] new_value (jsonb)
  - [ ] changed_by
  - [ ] changed_at
  - [ ] reason

### Backend Tasks

- [ ] Create Admin Settings controller
  - [ ] GET /admin/settings
  - [ ] PUT /admin/settings
  - [ ] GET /admin/settings/:key
  - [ ] PUT /admin/settings/:key
  - [ ] GET /admin/feature-flags
  - [ ] PUT /admin/feature-flags/:key
  - [ ] GET /admin/settings/history
- [ ] Create Settings service
  - [ ] CRUD
  - [ ] Cache invalidation
  - [ ] History tracking
  - [ ] Validation
- [ ] Create Feature Flag service
  - [ ] Check enabled
  - [ ] Rollout percentage
  - [ ] User whitelist
  - [ ] Cache
- [ ] Add authorization (super_admin only)
- [ ] Add validation
- [ ] Add Swagger documentation
- [ ] Add unit/e2e tests

### Frontend Tasks

- [ ] Create Admin Settings page `/admin/settings`
  - [ ] Categories
    - [ ] General
    - [ ] Booking
    - [ ] Payments
    - [ ] Notifications
    - [ ] Security
    - [ ] Privacy
  - [ ] Setting form
  - [ ] Save
  - [ ] History
- [ ] Create Feature Flags page `/admin/features`
  - [ ] Flag list
  - [ ] Toggle
  - [ ] Percentage rollout
  - [ ] Whitelist management
- [ ] Add responsive/accessible design

---

## NH-M37: SuperAdmin Dashboard and Reports

**Status:** NOT_STARTED  
**Dependencies:** NH-M31 to NH-M36

### Backend Tasks

- [ ] Create Admin Dashboard controller
  - [ ] GET /admin/dashboard/stats
  - [ ] GET /admin/dashboard/growth
  - [ ] GET /admin/dashboard/revenue
  - [ ] GET /admin/dashboard/activity
  - [ ] GET /admin/dashboard/alerts
  - [ ] GET /admin/reports/general
  - [ ] GET /admin/reports/growth
  - [ ] GET /admin/reports/finance
  - [ ] GET /admin/reports/performance
- [ ] Create Dashboard service
  - [ ] User metrics
  - [ ] Revenue metrics
  - [ ] Platform health
  - [ ] Growth metrics
  - [ ] Alerts
- [ ] Add caching
- [ ] Add Swagger documentation

### Frontend Tasks

- [ ] Create SuperAdmin Dashboard `/admin`
  - [ ] KPI cards
    - [ ] Total users
    - [ ] Active users
    - [ ] Total revenue
    - [ ] Pending verifications
    - [ ] Active jobs
    - [ ] Platform health
  - [ ] Charts
    - [ ] User growth
    - [ ] Revenue trend
    - [ ] Activity heatmap
    - [ ] Country breakdown
  - [ ] Recent activity
  - [ ] Alerts
- [ ] Create Reports page `/admin/reports`
  - [ ] Report types
    - [ ] Growth report
    - [ ] Finance report
    - [ ] Performance report
    - [ ] User report
  - [ ] Date range
  - [ ] Filters
  - [ ] Generate
  - [ ] Export (PDF/CSV)
- [ ] Add responsive/accessible design
- [ ] Add loading/empty/error states

---

# PHASE 7: INTEGRATION & QUALITY

## NH-M38: End-to-End Integration

**Status:** NOT_STARTED  
**Dependencies:** ALL PREVIOUS MODULES

### Tasks

- [ ] Verify complete candidate flow
  - [ ] Register → Verify email → Complete profile → Build CV → Apply to job → Get hired
- [ ] Verify complete expert flow
  - [ ] Register → Become expert → Get verified → Create services → Set availability → Get booked → Conduct session → Get paid
- [ ] Verify complete company flow
  - [ ] Register → Get verified → Post job → Receive applications → Interview → Hire
- [ ] Verify cross-module workflows
  - [ ] Candidate → Expert booking with payment
  - [ ] Company → Candidate search with access request
  - [ ] Admin → Verification of expert/company
  - [ ] Admin → Finance operations
- [ ] Test notification delivery for all events
- [ ] Test real-time messaging across roles
- [ ] Test file uploads in all contexts
- [ ] Create E2E test suite
  - [ ] Critical user journeys
  - [ ] Payment flows
  - [ ] Authorization scenarios
  - [ ] Error scenarios
- [ ] Fix navigation inconsistencies
- [ ] Document all workflows

---

## NH-M39: Security, Performance, Accessibility, and Release Gate

**Status:** NOT_STARTED  
**Dependencies:** NH-M38

### Security Tasks

- [ ] Security audit
  - [ ] Authentication (MFA enforcement)
  - [ ] Authorization (IDOR checks)
  - [ ] Data privacy (no leaks)
  - [ ] File security
  - [ ] Webhook verification
  - [ ] Payment security
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection
  - [ ] Rate limiting
  - [ ] Dependency vulnerability scan
- [ ] Penetration test (automated)
- [ ] Security headers configuration
- [ ] Audit logging verification

### Performance Tasks

- [ ] Database optimization
  - [ ] Index analysis
  - [ ] Query optimization
  - [ ] N+1 query detection
  - [ ] Pagination verification
- [ ] Caching strategy
  - [ ] Query caching
  - [ ] Response caching
  - [ ] Cache invalidation
- [ ] Frontend optimization
  - [ ] Code splitting
  - [ ] Image optimization
  - [ ] Bundle size analysis
  - [ ] Web vitals (LCP, FID, CLS)
- [ ] Queue job monitoring
- [ ] API latency targets (p95 < 200ms)
- [ ] Load testing

### Accessibility Tasks

- [ ] WCAG 2.1 AA audit
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast
  - [ ] Focus management
  - [ ] ARIA labels
  - [ ] Form labels
  - [ ] Error messages
- [ ] Responsive testing
  - [ ] Mobile (360px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1440px)
- [ ] Reduced motion support
- [ ] Touch target sizes

### Release Tasks

- [ ] Production configuration
  - [ ] Environment variables
  - [ ] Database connection pooling
  - [ ] CDN configuration
  - [ ] SSL certificates
  - [ ] Domain setup
- [ ] Migration plan
  - [ ] Rollback strategy
  - [ ] Data migration validation
- [ ] Health checks
- [ ] Monitoring setup
  - [ ] Logging
  - [ ] Metrics
  - [ ] Alerts
- [ ] Documentation
  - [ ] Deployment guide
  - [ ] Runbook
  - [ ] Disaster recovery
- [ ] Performance budget

---

# DEPLOYMENT CHECKLIST

## Infrastructure

- [ ] DNS configured for mnexthire.com
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] CDN configured (CloudFlare/CloudFront)
- [ ] PostgreSQL (RDS/Cloud SQL/self-hosted)
- [ ] Redis (ElastiCache/Upstash/self-hosted)
- [ ] Object storage (S3/MinIO)
- [ ] Email service (SendGrid/AWS SES)
- [ ] SMS service (Twilio/MessageBird)
- [ ] Video provider (Agora/Whereby)
- [ ] Payment gateway integration
- [ ] Monitoring (Grafana/DataDog/NewRelic)
- [ ] Error tracking (Sentry)
- [ ] Logging (ELK/Datadog)

## Security

- [ ] HTTPS enforced
- [ ] HSTS header
- [ ] Security headers (CSP, X-XSS, etc.)
- [ ] Rate limiting configured
- [ ] WAF configured (if applicable)
- [ ] Secrets in secrets manager (not env)
- [ ] Database backups configured
- [ ] Point-in-time recovery enabled
- [ ] Audit logging for sensitive operations
- [ ] GDPR/Privacy policy compliance
- [ ] Terms of service
- [ ] Cookie consent

## Monitoring

- [ ] Uptime monitoring
- [ ] API endpoint monitoring
- [ ] Performance monitoring
- [ ] Error alerting
- [ ] Business metric dashboard
- [ ] Database monitoring
- [ ] Queue monitoring
- [ ] Payment monitoring
- [ ] Security alerting

## Documentation

- [ ] API documentation (Swagger)
- [ ] User documentation
- [ ] Admin documentation
- [ ] Developer setup guide
- [ ] Deployment guide
- [ ] Runbook/Incident response
- [ ] Database schema documentation

---

# PROJECT STATUS SUMMARY

Synced 2026-07-23 with the verified NH-M ledger in `docs/task/status.md` (authoritative — based on code, migrations, tests, and Git history, not this checklist).

| Phase | Modules          | Status                                                           |
| ----- | ---------------- | ---------------------------------------------------------------- |
| 0     | NH-M00, NH-M01   | ✅ COMPLETED                                                     |
| 1     | NH-M02 to NH-M04 | ✅ COMPLETED (M04: commit 0a2d790)                               |
| 2     | NH-M05 to NH-M09 | M05/M06 IN_PROGRESS, M07 ✅, M08 NOT_STARTED, M09 UNVERIFIED     |
| 3     | NH-M10 to NH-M18 | M11 ✅; M10/M12/M13/M14/M16/M17 IN_PROGRESS; M15/M18 NOT_STARTED |
| 4     | NH-M19 to NH-M26 | ⏳ NOT STARTED                                                   |
| 5     | NH-M27 to NH-M30 | M30 IN_PROGRESS; rest NOT STARTED                                |
| 6     | NH-M31 to NH-M37 | M32/M33/M35 IN_PROGRESS; rest NOT STARTED                        |
| 7     | NH-M38 to NH-M39 | ⏳ NOT STARTED                                                   |

**Total Modules:** 40 (NH-M00 to NH-M39)  
**Verified status:** 7 COMPLETED, 12 IN_PROGRESS, 1 UNVERIFIED, 20 NOT_STARTED  
**Next Module:** NH-M07 — Assessment and Exam Simulation (already verified COMPLETED; confirm and advance to NH-M08)

---

_End of Task List_
