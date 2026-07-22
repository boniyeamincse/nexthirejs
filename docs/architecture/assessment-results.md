# Assessment Results Architecture

## Overview

The assessment results module provides authenticated candidates with:
1. A paginated, filterable history of their finalized assessment attempts
2. A detailed per-question result review including scores, candidate answers, correct answers, and explanations

All review data comes from immutable attempt snapshot records, not live source data.

## Architecture

```
CandidateAssessmentResultsController
├── AssessmentResultHistoryService
│   ├── AssessmentResultRepository
│   ├── AssessmentResultMapperService
│   └── AuditService
└── AssessmentResultDetailService
    ├── AssessmentResultRepository
    ├── AssessmentResultMapperService
    ├── AssessmentResultConsistencyService
    └── AuditService
```

### Controller
- `GET /v1/candidates/me/assessment-results` — list history with filters/pagination
- `GET /v1/assessment-results/:attemptId` — get detailed result review
- Both protected by AuthGuard + RolesGuard (requires `candidate` role)
- Rate limited: 60 requests/minute per endpoint

### History Service
- Filters by: result status, finalization reason, assessment type, difficulty, date range, search (title/slug)
- Returns only finalized (SUBMITTED/EXPIRED) attempts with scoring completed
- Ordered by submittedAt descending, then attemptId descending
- Pagination: default 12, max 50, min page 1
- Date range limited to 5 years

### Detail Service
- Enforces candidate ownership (returns 404 for cross-user access)
- Enforces finalized status (returns 409 if not finalized/scored)
- Runs consistency checks before returning data
- Returns structured result with sections, questions, options, candidate/correct answers, explanations

### Consistency Service
Validates before returning detailed review:
- Scoring is complete
- Question count matches snapshot
- Correct + incorrect + unanswered = question count
- Score is within valid bounds
- Per-question awarded points don't exceed possible
- Selected options belong to the question
- Short-text questions have accepted-answer snapshot data

### Mapper Service
Maps Prisma attempt data to API response DTOs:
- Uses snapshot fields for title, slug, prompt, options, explanations
- Maps candidate answers from persisted answer records
- Maps correct answers from snapshot option correctness data
- Calculates section summaries from per-question data
- Excludes all internal source fields

## Security
- Cross-user access returns 404 (not 403) to avoid leaking attempt existence
- Snapshot data prevents source edits from altering historical results
- Audit metadata excludes answers, correctness data, and explanation text
