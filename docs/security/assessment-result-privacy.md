# Assessment Result Privacy

## Principles
1. Only authenticated active candidates can access result history and detail APIs
2. Candidates can only see their own attempts (cross-user access → 404)
3. Result data comes from immutable snapshot records, not live source data
4. Audit metadata must not contain answers, correctness data, or explanation text

## Data Protection
- Candidate answers (selected option IDs, short text) are never logged
- Correct answers and accepted answers are never logged
- Explanation text is never logged
- Question prompts are never logged
- Result pages use `cache: no-store` to prevent caching
- Result data is not persisted in browser storage
- Result pages use `noindex` to prevent indexing

## Access Control
| Scenario | Response |
|----------|----------|
| Unauthenticated | 401 |
| Non-candidate role | 403 |
| Suspended account | Depends on auth guard enforcement |
| Cross-user attempt access | 404 |
| In-progress attempt | 409 |
| Inconsistent scoring data | 409 |
| Rate limited | 429 (ThrottlerGuard) |

## Immutable Snapshot
Historical result display is unaffected by source assessment edits because all display data comes from:
- `AssessmentAttempt` snapshot fields (title, slug, instructions)
- `AssessmentAttemptQuestion` snapshot fields (prompt, explanation, accepted answers)
- `AssessmentAttemptQuestionOption` snapshot fields (label, isCorrect)
- `AssessmentAttemptAnswer` persisted records (selected options, short text, awarded points, isCorrect)
