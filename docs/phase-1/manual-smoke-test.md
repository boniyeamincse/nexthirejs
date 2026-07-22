# Phase 1 Manual Smoke Test

## Prerequisites

```bash
corepack enable
pnpm install
pnpm infra:up
pnpm --filter @nexthire/api prisma:migrate
pnpm --filter @nexthire/api prisma:seed
pnpm dev
```

- API: http://localhost:4000
- Web: http://localhost:3000
- Mailpit: http://localhost:8025
- MinIO Console: http://localhost:9001

## Scenario A — New Candidate

1. Visit `/register`, fill form with new email/password, submit.
2. Check Mailpit for verification email, click link.
3. Login at `/login` with registered credentials.
4. Fill basic profile at `/profile`: name, headline, summary, DOB.
5. Check `/dashboard` shows partial completion.

## Scenario B — Full Profile and Privacy

1. Complete all profile sections (preferences, education, experience, skills, languages, certifications, training, achievements, professional links).
2. Verify `/dashboard` shows 100% completion.
3. Visit `/settings/privacy`, set overall to LINK_ONLY, hide some sections.
4. Visit `/profile/preview` — verify hidden sections are absent.
5. Share link — copy from `/profile/preview`, open in incognito.
6. Verify hidden sections absent in shared view.
7. Verify `/p/[publicId]` returns 404 when discoverability is LINK_ONLY.

## Scenario C — Session Security

1. Login in two separate browsers.
2. In browser 1, visit `/settings/security/sessions`, revoke browser 2 session.
3. In browser 2, attempt to access `/dashboard` — should redirect to login.
4. Change password in browser 1.
5. Verify browser 1 can still access dashboard (current session preserved).
6. Verify any other active sessions are revoked.

## Scenario D — Password Reset

1. Visit `/forgot-password`, enter email.
2. Check Mailpit for reset link, open it.
3. Set new password.
4. Verify old password no longer works.
5. Verify old refresh token no longer works.
6. Attempt to reuse the reset token — should fail.

## Scenario E — Data Export

1. Visit `/settings/account`, click "Request Data Export".
2. Wait for status to change to READY (worker runs in-process, near-instant).
3. Click download, inspect the JSON file.
4. Verify excluded: password hashes, token hashes, audit logs, IPs, session IDs.

## Scenario F — Deactivation

1. Visit `/settings/account`, scroll to deactivation section.
2. Enter current password, type `DEACTIVATE`, confirm.
3. Verify redirected to `/login?deactivated=true`.
4. Attempt to login with same credentials — should fail with account unavailable.
5. Visit `http://localhost:3000/p/[previous-public-id]` — should 404.
6. In database: verify `User.status = 'DELETED'`, `deactivatedAt` is set, sessions are REVOKED.
