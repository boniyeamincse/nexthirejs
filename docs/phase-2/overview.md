# Phase 2: Assessment and Evaluation Overview

## Assessment Architecture

The assessment system is built around five core entities:

- **Categories** - Top-level grouping for questions (e.g., "JavaScript", "System Design"). Categories are reusable across assessments.
- **Questions** - Individual test items belonging to a category. Each question has a type, prompt, options, correct answers, and a point value.
- **Sections** - Named groupings within an assessment that contain one or more questions. Sections define the structure and flow of an assessment.
- **Assignments** - The link between an assessment and a candidate. Assignments carry deadline, retake policy, and status information.
- **Snapshots** - Immutable copies of assessment questions and settings captured when a candidate starts an attempt. This ensures grading consistency even if the source assessment is later modified.

## Question Types Supported

The system supports four question types:

| Type | Enum Value | Description |
|------|-----------|-------------|
| Single Choice | `SINGLE_CHOICE` | One correct option from a list |
| Multiple Choice | `MULTIPLE_CHOICE` | One or more correct options |
| True/False | `TRUE_FALSE` | Boolean true/false selection |
| Short Text | `SHORT_TEXT` | Free-text answer, exact match required |

## Publication Lifecycle

Assessments follow a three-stage lifecycle:

```
DRAFT --> PUBLISHED --> ARCHIVED
                     --> RETIRED
```

- **DRAFT** - Initial state. Assessment is editable and invisible to candidates.
- **PUBLISHED** - Visible in the assessment catalog. Candidates can be assigned and attempt. Editing is restricted (only metadata changes allowed).
- **ARCHIVED** - Read-only state. No new attempts allowed. Existing results remain accessible for review.
- **RETIRED** - Hidden from all views. Used for assessments that should no longer be accessible.

## Snapshot Model

When a candidate starts an attempt, the system creates an immutable **snapshot** containing:

- A copy of all questions, options, correct answers, and point values
- The passing score threshold at the time of start
- The assessment version identifier

This ensures that grading is deterministic and unaffected by subsequent edits to the assessment. All scoring uses snapshot data exclusively.

## Deadline Policy

Deadlines are **server-authoritative**. The system calculates deadlines based on `estimatedDurationMinutes`:

- `startedAt + estimatedDurationMinutes` = deadline
- Deadlines are enforced on submission - any submission after the deadline is rejected with a `410 GONE` status
- The server clock determines deadline compliance; client-side timers are advisory only

## Scoring Version

- Scoring is **deterministic** and **automatic** - no human grading required
- A `scoringVersion` field is recorded in each snapshot for audit trail
- Pass/fail is determined by: `scorePercentage >= passingScoreSnapshot`
- No partial credit or negative marking is applied

## Result Review

- **Paginated history** - Candidates can view their attempt history with pagination
- **Per-question detail** - Each attempt result shows per-question scores, correct answers, and the candidate's response
- Results are immutable after submission

## Analytics and Ranking

- **Performance reports** - Candidates can view aggregated performance metrics (total attempts, pass/fail counts, average score)
- **Leaderboard** - Shows ranked candidates by average score. Includes pagination and filtering by assessment.

## Leaderboard Privacy

- Participation is **opt-in only** via a dedicated field in the candidate profile
- Candidates must set a **display alias** to appear on the leaderboard
- **Immediate removal** on opt-out - no caching delay
- Non-opted-in candidates and those without an alias are excluded from rankings

## Retake Policy

- **Cooldown** - Configurable minimum wait period between attempts (in hours)
- **Attempt limits** - Maximum number of attempts configurable per assignment (0 = unlimited)
- **Attempt numbering** - Each attempt is numbered sequentially (1, 2, 3, ...)
- Retake eligibility is determined by: (maxAttempts == 0 OR attempts < maxAttempts) AND cooldown elapsed

## Certificate Issuance

The certificate system follows a four-state workflow:

```
PENDING --> GENERATING --> READY
                       --> FAILED
```

- **PENDING** - Initial state after passing attempt
- **GENERATING** - BullMQ worker picks up the job and begins PDF generation
- **READY** - PDF stored in MinIO/S3, available for download
- **FAILED** - Generation error occurred

Infrastructure details:
- **BullMQ worker** processes certificate generation jobs asynchronously
- **MinIO/S3** stores generated PDF files
- **PDF generation** uses `pdfkit` with `svg-to-pdfkit`

## Public Verification

- Each certificate has a **SHA-256 hashed verification code**
- Verification is via a public endpoint that accepts the hash and returns certificate metadata
- **Anti-enumeration** - The hash is the primary lookup key, preventing sequential guessing
- **Minimal data exposure** - Only candidate name, assessment title, and issue date are returned
- No personally identifiable information beyond the candidate name is exposed

## Queue Infrastructure

BullMQ with Redis is used for asynchronous job processing. Three queues:

| Queue Name | Purpose |
|-----------|---------|
| `system-health` | Health check and monitoring jobs |
| `data-export` | Data export jobs |
| `assessment-certificates` | Certificate generation jobs |

## Storage

| Environment | Storage Backend |
|------------|----------------|
| Development | Local filesystem |
| Production | MinIO (S3-compatible) |

## Environment Variables

The following environment variables are required for certificates and retakes:

```
# Certificate Storage
CERTIFICATE_UPLOAD_DIR=./uploads/certificates
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_CERTIFICATES=nexthire-certificates
MINIO_REGION=us-east-1

# Retake Configuration
DEFAULT_RETAKE_COOLDOWN_HOURS=24
DEFAULT_MAX_ATTEMPTS=3

# BullMQ / Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Base URL for certificate links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
