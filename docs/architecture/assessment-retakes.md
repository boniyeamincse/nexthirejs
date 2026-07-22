# Assessment Retakes

## Overview
Candidates can retake eligible assessments according to server-enforced limits and cooldowns.

## Key Concepts
- **Retake Policy**: Configurable per-assessment settings (enabled, max attempts, cooldown)
- **Eligibility**: Server-authoritative check before any attempt start
- **Attempt Numbering**: Sequential, immutable, concurrency-safe

## Retake Policy
- `retakeEnabled` (default false)
- `maximumAttempts`: null (unlimited) or 1-100
- `retakeCooldownHours`: 0-8760

## Eligibility Rules
1. Authenticated active candidates only
2. One active attempt per candidate/assessment
3. Finalized attempts count toward limit
4. First attempt is included in max
5. Cooldown starts at previous attempt finalization
6. Server time controls cooldown

## Endpoints
- `GET /v1/assessments/:id/retake-eligibility` - Check eligibility
- `PUT /v1/manage/assessments/:id/retake-certificate-policy` - Update policy

## Audit Events
- `assessment.retake_eligibility.viewed`
- `assessment.retake.started`
- `assessment.retake.blocked`
- `assessment.retake_certificate_policy.updated`
