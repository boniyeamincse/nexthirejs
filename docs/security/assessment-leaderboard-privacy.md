# Assessment Leaderboard Privacy

## Data Exposure
Leaderboard entries expose only:
- Rank (1-based)
- Display name (user-set alias or generated safe alias)
- Avatar URL (null, reserved for future)
- Score/percentage statistics
- No email, phone, date of birth, location, or private profile data

## Opt-In Model
- Participation is disabled by default
- Enabling requires explicit action via settings page
- Disabling immediately removes candidate from all leaderboards
- Preference changes are audited without recording identity text

## Safe Alias Generation
When no display name is set:
- Uses `Candidate-{shortId}` where shortId is first 4 hex chars of user UUID
- Stable for the same user (deterministic from userId)
- Not linkable to candidate database ID

## Identity Mapping
- Leaderboard identity is resolved from `CandidateProfilePrivacy.leaderboardDisplayName`
- No reverse lookup from display name to candidate profile
- Private profiles never expose real name on leaderboards
