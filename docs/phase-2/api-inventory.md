# Phase 2: API Inventory

## Assessment Catalog

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/catalog` | Candidate | 30/60s | List published assessments available to the candidate |
| GET | `/api/assessments/catalog/:assessmentId` | Candidate | 30/60s | Get a single published assessment from the catalog |

## Management - Categories

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/admin/categories` | Manager/Admin | 20/60s | Create a new category |
| PUT | `/api/assessments/admin/categories/:categoryId` | Manager/Admin | 20/60s | Update an existing category |
| DELETE | `/api/assessments/admin/categories/:categoryId` | Manager/Admin | 10/60s | Delete a category |

## Management - Questions

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/admin/questions` | Manager/Admin | 20/60s | Create a new question |
| PUT | `/api/assessments/admin/questions/:questionId` | Manager/Admin | 20/60s | Update an existing question |
| DELETE | `/api/assessments/admin/questions/:questionId` | Manager/Admin | 10/60s | Delete a question |

## Management - Assessment CRUD

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/admin` | Manager/Admin | 20/60s | Create a new assessment |
| PUT | `/api/assessments/admin/:assessmentId` | Manager/Admin | 20/60s | Update assessment details and sections |
| GET | `/api/assessments/admin` | Manager/Admin | 30/60s | List all assessments with filters (status, search, pagination) |
| POST | `/api/assessments/admin/:assessmentId/publish` | Manager/Admin | 10/60s | Publish an assessment (DRAFT to PUBLISHED) |
| POST | `/api/assessments/admin/:assessmentId/archive` | Manager/Admin | 10/60s | Archive a published assessment |

## Management - Sections

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/admin/:assessmentId/sections` | Manager/Admin | 20/60s | Add a section to an assessment |
| PUT | `/api/assessments/admin/:assessmentId/sections/:sectionId` | Manager/Admin | 20/60s | Update a section |
| DELETE | `/api/assessments/admin/:assessmentId/sections/:sectionId` | Manager/Admin | 10/60s | Remove a section from an assessment |

## Management - Assignments

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/admin/:assessmentId/assignments` | Manager/Admin | 20/60s | Assign assessment to a candidate |
| GET | `/api/assessments/admin/:assessmentId/assignments` | Manager/Admin | 30/60s | List assignments for an assessment |
| GET | `/api/assessments/admin/assignments/:assignmentId` | Manager/Admin | 30/60s | Get assignment details |
| PUT | `/api/assessments/admin/assignments/:assignmentId` | Manager/Admin | 20/60s | Update assignment settings (deadline, retake policy) |
| DELETE | `/api/assessments/admin/assignments/:assignmentId` | Manager/Admin | 10/60s | Remove an assignment |

## Candidate Attempts

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessments/attempts` | Candidate | 10/60s | Start a new attempt (creates snapshot, returns attempt ID) |
| GET | `/api/assessments/attempts/:attemptId` | Candidate | 30/60s | Get attempt details with questions |
| GET | `/api/assessments/attempts/:attemptId/questions` | Candidate | 30/60s | Get snapshot questions for an in-progress attempt |
| POST | `/api/assessments/attempts/:attemptId/answers` | Candidate | 30/60s | Save answers for one or more questions |
| POST | `/api/assessments/attempts/:attemptId/submit` | Candidate | 5/60s | Submit the attempt for scoring (enforces deadline) |
| GET | `/api/assessments/attempts/:attemptId/deadline` | Candidate | 30/60s | Get deadline and remaining time |
| GET | `/api/assessments/attempts/active` | Candidate | 15/60s | List active (in-progress) attempts for the candidate |
| GET | `/api/assessments/attempts/:attemptId/result` | Candidate | 30/60s | Get scored result for a submitted attempt |

## Results

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/results` | Candidate | 15/60s | Get paginated result history for the candidate |
| GET | `/api/assessments/results/:attemptId/detail` | Candidate | 30/60s | Get per-question detail for a specific attempt |

## Performance and Leaderboards

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/performance` | Candidate | 15/60s | Get aggregated performance report |
| GET | `/api/assessments/leaderboard/:assessmentId` | Candidate | 15/60s | Get leaderboard for a specific assessment |
| GET | `/api/assessments/leaderboard/:assessmentId/rank` | Candidate | 15/60s | Get the current candidate's rank on the leaderboard |
| POST | `/api/assessments/leaderboard/opt-in` | Candidate | 10/60s | Opt in to the leaderboard with a display alias |
| POST | `/api/assessments/leaderboard/opt-out` | Candidate | 10/60s | Opt out of the leaderboard (immediate removal) |
| GET | `/api/assessments/leaderboard/status` | Candidate | 30/60s | Get current leaderboard opt-in status and alias |

## Retakes

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/retakes/:assignmentId/eligibility` | Candidate | 15/60s | Check retake eligibility (cooldown, attempt limit) |
| POST | `/api/assessments/retakes/:assignmentId/start` | Candidate | 10/60s | Start a retake attempt |

## Certificates

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/certificates` | Candidate | 15/60s | List certificates for the authenticated candidate |
| GET | `/api/assessments/certificates/:certificateId` | Candidate | 30/60s | Get certificate details and download URL |
| GET | `/api/assessments/certificates/:certificateId/download` | Candidate | 10/60s | Download the certificate PDF |
| POST | `/api/assessments/certificates/:attemptId/issue` | Candidate | 5/60s | Request certificate issuance for a passed attempt |

## Public Certificate Verification

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/public/verify/:verificationCode` | None | 10/60s | Verify a certificate by its SHA-256 verification code |

## Management GET Endpoints (Assessment Listing and Preview)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/assessments/admin` | Manager/Admin | 30/60s | List all assessments with status filters and pagination |
| GET | `/api/assessments/admin/:assessmentId` | Manager/Admin | 30/60s | Get assessment details for editing/preview |
| GET | `/api/assessments/admin/:assessmentId/sections` | Manager/Admin | 30/60s | List sections for an assessment |
| GET | `/api/assessments/admin/:assessmentId/sections/:sectionId` | Manager/Admin | 30/60s | Get section details with questions |
| GET | `/api/assessments/admin/:assessmentId/assignments` | Manager/Admin | 30/60s | List assignments for an assessment |
| GET | `/api/assessments/admin/assignments/:assignmentId` | Manager/Admin | 30/60s | Get assignment details |
| GET | `/api/assessments/admin/questions` | Manager/Admin | 30/60s | List all questions with filters (category, type, pagination) |
| GET | `/api/assessments/admin/questions/:questionId` | Manager/Admin | 30/60s | Get question details |
| GET | `/api/assessments/admin/categories` | Manager/Admin | 30/60s | List all categories |
| GET | `/api/assessments/admin/categories/:categoryId` | Manager/Admin | 30/60s | Get category details |
