# Profile Completion Dashboard (NH-P1-T015)

## Architecture

```
GET /api/v1/candidates/me/profile-completion
         │
         ▼
  AuthGuard + RolesGuard (candidate)
         │
         ▼
  ProfileCompletionDashboardService
         │
         ├──► User status check
         ├──► Profile data loader (parallel)
         ├──► CandidateProfileCompletionService.calculateCompletion()
         ├──► ProfileSectionStatusService.getAllSectionStatuses()
         ├──► ProfileCompletionActionService.getActions()
         ├──► Summary computation
         └──► Audit event (candidate.profile_completion.viewed)
```

## Services

### `ProfileSectionStatusService`

- Loads all profile data in parallel (prisma)
- Calculates earned points per section matching completion service weights
- Maps to NOT_STARTED / IN_PROGRESS / COMPLETED
- Generates missing-item descriptions (max 3 per section)

### `ProfileCompletionActionService`

- Maps `missingFields` from completion service to actionable items
- Each action has: section, title, description, route, priority, pointsAvailable
- Max 10 actions, sorted by priority then points

### `ProfileCompletionDashboardService`

- Orchestrator: delegates to completion, section-status, and action services
- Checks user status (SUSPENDED/DELETED → 403)
- Audits dashboard view (best-effort, safe metadata only)

## Sections & Weights

| Section                  | Possible Points |
| ------------------------ | --------------- |
| BASIC_PROFILE            | 30              |
| LOCATION_AND_PREFERENCES | 18              |
| EDUCATION                | 11              |
| WORK_EXPERIENCE          | 10              |
| SKILLS                   | 8               |
| LANGUAGES                | 5               |
| CERTIFICATIONS           | 5               |
| TRAINING                 | 3               |
| ACHIEVEMENTS             | 5               |
| PROFESSIONAL_LINKS       | 5               |
| PRIVACY_AND_SHARING      | 0               |
| **Total**                | **100**         |

## Frontend

- Route: `/dashboard` (authenticated group)
- API client: `getMyProfileCompletionDashboard()`
- States: auth-loading, data-loading, error+retry, empty, partial, 100%
- Accessibility: aria-progressbar, heading hierarchy, text-based statuses

## Security

- Requires `candidate` role
- No sensitive fields in response (email, userId, password, token)
- Audit logs exclude profile values from metadata
- Privacy changes do not affect completion score
