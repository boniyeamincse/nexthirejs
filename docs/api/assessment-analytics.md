# Assessment Analytics API

## Endpoints

### GET /api/v1/candidates/me/assessment-performance
Returns performance report with summary, trend, and breakdowns.
- Rate limit: 30 req/min
- Filters: dateFrom, dateTo, assessmentType, difficulty, category

### GET /api/v1/candidates/me/leaderboard-settings
Returns leaderboard participation settings.
- Rate limit: 60 req/min

### PUT /api/v1/candidates/me/leaderboard-settings
Updates leaderboard participation settings.
- Rate limit: 10 per 15 min
- Body: `{ enabled: boolean, displayName?: string | null }`

### GET /api/v1/assessment-leaderboards/assessments/:idOrSlug
Returns assessment-specific leaderboard.
- Rate limit: 60 req/min
- Query: page (default 1), pageSize (default 25, max 100)

### GET /api/v1/assessment-leaderboards/categories/:idOrSlug
Returns category leaderboard.
- Rate limit: 60 req/min
- Query: page (default 1), pageSize (default 25, max 100)

## Error Codes
- 400: ASSESSMENT_PERFORMANCE_QUERY_INVALID, LEADERBOARD_SETTINGS_VALIDATION_FAILED
- 404: ASSESSMENT_LEADERBOARD_NOT_FOUND, CATEGORY_LEADERBOARD_NOT_FOUND
- 429: ASSESSMENT_REPORT_RATE_LIMITED
