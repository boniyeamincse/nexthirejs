# Phase 2: Security Invariants

This document enumerates all cross-feature security invariants for the Assessment and Evaluation system.

## Authentication and Authorization

1. **All assessment management endpoints require Manager or Admin role.** Unauthorized requests receive a `403 Forbidden` response.

2. **All candidate attempt endpoints require the Candidate role.** Manager/Admin accounts cannot take assessments.

3. **All attempt and result operations are scoped to the authenticated user.** A candidate can only access their own attempts, results, and certificates. Accessing another user's data returns `404 Not Found` (not `403`) to avoid leaking user existence.

4. **Certificate download endpoints verify ownership.** Only the certificate owner can download the PDF.

## Attempt Integrity

5. **Snapshots are immutable once created.** No API endpoint allows modification of a snapshot after an attempt has started.

6. **Answers can only be saved while the attempt is in progress.** Once submitted or past the deadline, the answers endpoint rejects further saves.

7. **Submit is a one-time operation.** Calling submit on an already-submitted attempt returns a `409 Conflict` response.

8. **Deadline is enforced server-side on submission.** Even if the client sends a delayed submission, the server checks `now() <= startedAt + estimatedDurationMinutes`. Late submissions receive `410 Gone`.

9. **The attempt answers endpoint validates question ownership.** Answers can only be saved for questions that belong to the attempt's snapshot. Orphan questions are rejected.

## Data Isolation

10. **Manager endpoints return all assessments they created.** Admin endpoints return all assessments across all managers.

11. **The assessment catalog only returns PUBLISHED assessments.** DRAFT, ARCHIVED, and RETIRED assessments are invisible to candidates.

12. **Correct answers are stripped from snapshot questions when returned to an in-progress attempt.** Candidates cannot see the correct answers until after submission.

13. **After submission, the result endpoint reveals correct answers and scores only for the submitted attempt.** No cross-attempt answer leaking.

## Retake Policy

14. **Retake eligibility is always verified server-side.** A client cannot bypass the cooldown or attempt limit by calling the start endpoint directly.

15. **The cooldown period is enforced using server time, not client-reported time.**

16. **Attempt numbering is sequential and gapless.** If an attempt is abandoned (not submitted) it still counts toward the attempt limit.

## Leaderboard Privacy

17. **Candidates who have not opted in are excluded from all leaderboard queries.** Their scores are never exposed in rankings.

18. **Candidates without a display alias cannot opt in.** The alias must be set before the opt-in request succeeds.

19. **Opt-out results in immediate removal from the leaderboard.** No caching or eventual consistency delay.

20. **A candidate can only see their own rank on the leaderboard.** Other candidates' ranks are not exposed in personal queries.

## Certificate Integrity

21. **Certificate issuance is only triggered for PASSED attempts.** Failed or unscored attempts cannot generate certificates.

22. **A certificate cannot be issued more than once per attempt.** Duplicate issuance requests return `409 Conflict`.

23. **Certificate generation is asynchronous via BullMQ.** The API returns immediately after enqueuing the job; the client polls for status.

24. **PDF generation failure does not destroy the certificate record.** The status transitions to FAILED; re-issuance can be requested.

## Public Verification

25. **The public verification endpoint requires no authentication.** It is deliberately open to allow third-party verification.

26. **Verification codes are SHA-256 hashes, not sequential IDs.** This prevents enumeration and guessing.

27. **The verification endpoint returns only minimal data:** candidate name, assessment title, and issue date. No email, user ID, or score is exposed.

28. **Verification of non-existent codes returns a generic `404 Not Found`.** No distinction between "invalid code" and "no certificate" to prevent oracle attacks.

## Rate Limiting

29. **All assessment endpoints have rate limits enforced.** Limits vary by sensitivity (submission endpoints have stricter limits than read endpoints).

30. **Rate limit headers are returned on all responses** (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`), allowing clients to back off appropriately.
