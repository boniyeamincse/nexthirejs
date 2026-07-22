# Phase 2: Known Limitations

The following limitations exist in the current Phase 2 implementation. These are acknowledged as gaps and may be addressed in future phases.

## Notifications

- **No assessment notifications** - The system does not send email or in-app notifications for:
  - Assessment invitations when a candidate is assigned
  - Deadline reminders before an attempt expires
  - Certificate ready notifications after generation completes
  - Retake eligibility notifications after cooldown expires
- Candidates must manually check the catalog and results dashboard.

## Management Dashboard

- **No manager dashboard** - There is no aggregated view for managers to see:
  - Candidate performance across assessments
  - Completion rates, pass/fail statistics
  - Assessment-level analytics (average score, time spent)
  - Assignment status overview

## Certificate Management (Admin)

- **No admin certificate management** - There is no interface for administrators to:
  - Revoke issued certificates
  - Re-issue failed certificate generation jobs
  - View all certificates across all candidates
  - Manually trigger certificate generation

## Webhook / Event System

- **No webhooks** - The assessment system does not emit webhook events for:
  - Attempt started, submitted, or scored
  - Certificate issued or failed
  - Assignment created or expired
- External integrations cannot react to assessment events in real time.

## Search

- **No full-text search** - The assessment catalog endpoint does not support full-text search across assessment titles or descriptions. Candidates must paginate through the catalog or rely on filtering by status only.

## Templates

- **No assessment templates** - There is no mechanism to create reusable assessment templates or duplicate existing assessments. Each assessment must be created from scratch.

## Retake Scheduling

- **No calendar integration** - Retake scheduling is limited to a cooldown-based model. There is no calendar integration for scheduling specific retake dates or time slots.

## Mobile

- **No mobile-optimized workspace** - The candidate attempt workspace is not optimized for mobile devices. Layout, touch interactions, and responsive design are not implemented for small screens.

## Offline Support

- **No browser offline support** - Attempts require a continuous internet connection. There is no service worker or local caching to support offline work during an attempt.

## Frontend Test Coverage

- **Limited frontend tests** - Assessment-related frontend pages have minimal test coverage. The following pages are not adequately covered:
  - Candidate attempt workspace (timer, answer saving, submission)
  - Certificate download and verification views
  - Leaderboard display
  - Manager assessment builder (category, question, section management)

## Manager Certificate Revocation UI

- **No revocation UI** - Managers cannot revoke certificates from the UI even though the data model may support a revoked state. Any revocation must be performed directly in the database.
