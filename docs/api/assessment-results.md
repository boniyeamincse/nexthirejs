# Assessment Results API

## List Candidate Attempt History

```
GET /v1/candidates/me/assessment-results
```

Authenticated active candidate only.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (min: 1, default: 1) |
| pageSize | number | Items per page (max: 50, default: 12) |
| search | string | Search in snapshot title/slug (max 100 chars) |
| resultStatus | enum | PASSED, FAILED |
| finalizationReason | enum | CANDIDATE_SUBMITTED, DEADLINE_REACHED |
| assessmentType | enum | PRACTICE, CERTIFICATION, SCREENING, SKILL_CHECK |
| difficulty | enum | BEGINNER, INTERMEDIATE, ADVANCED, EXPERT |
| dateFrom | string | ISO date (YYYY-MM-DD) |
| dateTo | string | ISO date (YYYY-MM-DD) |

### Success Response (200)

```json
{
  "items": [
    {
      "attemptId": "uuid",
      "assessment": {
        "id": "uuid",
        "slug": "my-assessment",
        "title": "My Assessment",
        "categoryName": null,
        "type": "PRACTICE",
        "difficulty": "INTERMEDIATE",
        "publicationVersion": 1
      },
      "result": {
        "scoreEarned": 10,
        "scorePossible": 30,
        "percentage": 33.33,
        "status": "FAILED",
        "correctCount": 1,
        "incorrectCount": 0,
        "unansweredCount": 1,
        "questionCount": 2
      },
      "finalizationReason": "CANDIDATE_SUBMITTED",
      "startedAt": "2026-07-22T12:00:00.000Z",
      "submittedAt": "2026-07-22T13:00:00.000Z",
      "durationSeconds": 3600
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 1,
    "totalPages": 1
  },
  "filters": {
    "resultStatuses": ["PASSED", "FAILED"],
    "finalizationReasons": ["CANDIDATE_SUBMITTED", "DEADLINE_REACHED"],
    "assessmentTypes": ["PRACTICE", "CERTIFICATION", "SCREENING", "SKILL_CHECK"],
    "difficulties": ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
  }
}
```

## Get Detailed Result

```
GET /v1/assessment-results/:attemptId
```

Candidate owner only.

### Success Response (200)

```json
{
  "attempt": {
    "id": "uuid",
    "assessmentId": "uuid",
    "title": "My Assessment",
    "slug": "my-assessment",
    "publicationVersion": 1,
    "finalizationReason": "CANDIDATE_SUBMITTED",
    "startedAt": "2026-07-22T12:00:00.000Z",
    "submittedAt": "2026-07-22T13:00:00.000Z",
    "durationSeconds": 3600
  },
  "result": {
    "scoreEarned": 10,
    "scorePossible": 30,
    "percentage": 33.33,
    "resultStatus": "FAILED",
    "passingScorePercentage": 70,
    "correctCount": 1,
    "incorrectCount": 0,
    "unansweredCount": 1,
    "questionCount": 2,
    "scoringVersion": 1
  },
  "sections": [
    {
      "id": "uuid",
      "title": "Section 1",
      "sortOrder": 1,
      "scoreEarned": 10,
      "scorePossible": 30,
      "correctCount": 1,
      "incorrectCount": 0,
      "unansweredCount": 1,
      "questions": [
        {
          "id": "uuid",
          "number": 1,
          "type": "SINGLE_CHOICE",
          "prompt": "Question text?",
          "pointsPossible": 10,
          "pointsAwarded": 10,
          "outcome": "CORRECT",
          "candidateAnswer": { "kind": "OPTIONS", "optionIds": ["opt-uuid"] },
          "correctAnswer": { "kind": "OPTIONS", "optionIds": ["opt-uuid"] },
          "explanation": "Explanation text",
          "options": [
            {
              "id": "opt-uuid",
              "label": "Option A",
              "sortOrder": 1,
              "selectedByCandidate": true,
              "isCorrect": true
            }
          ]
        }
      ]
    }
  ]
}
```

### Controlled Errors

| Code | Status | Error Code |
|------|--------|------------|
| Invalid query | 400 | ASSESSMENT_RESULT_QUERY_INVALID |
| Unauthorized | 401 | AUTH_ACCESS_TOKEN_INVALID |
| Forbidden | 403 | CANDIDATE_ROLE_REQUIRED |
| Forbidden | 403 | AUTH_ACCOUNT_UNAVAILABLE |
| Access denied | 403 | ASSESSMENT_RESULT_ACCESS_DENIED |
| Not found | 404 | ASSESSMENT_RESULT_NOT_FOUND |
| Not finalized | 409 | ASSESSMENT_RESULT_NOT_FINALIZED |
| Inconsistent | 409 | ASSESSMENT_RESULT_INCONSISTENT |
| Rate limited | 429 | ASSESSMENT_RESULT_RATE_LIMITED |
