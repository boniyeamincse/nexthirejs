# Assessment Performance Architecture

## Overview
The performance reporting and leaderboard system provides authenticated candidates with:
- Aggregated performance reports across finalized attempts
- Score trends, category/type/difficulty breakdowns
- Privacy-safe leaderboards with deterministic ranking

## Key Decisions
1. **Query-time aggregation** - No materialized views; aggregates on read from `AssessmentAttempt` snapshot fields.
2. **Immutable snapshots** - All report calculations use finalized snapshot fields (`scorePercentage`, `correctCount`, etc.).
3. **Privacy-first** - Leaderboard participation is opt-in; private profiles use safe aliases.

## Data Flow
```
Candidate Profile Privacy → Opt-in settings (leaderboardParticipationEnabled)
AssessmentAttempt → Snapshot fields for aggregation
Leaderboard Service → Query-time aggregation → Privacy-safe DTO → Response
```

## Leaderboard Ranking
- Assessment: Best attempt percentage → score earned → fewer unanswered → duration → submission time → attempt ID
- Category: Average percentage → unique assessment count → pass rate → best percentage → latest submission → candidate ID
