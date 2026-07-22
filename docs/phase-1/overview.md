# Phase 1 — Identity and Candidate Foundation

## Scope

Phase 1 delivers the candidate identity and profile foundation:

- **Registration** — email + strong-password registration
- **Email verification** — token-based verification and resend
- **Login/session management** — JWT access tokens + refresh-token rotation
- **Password reset** — email-triggered reset with session revocation
- **Account security** — password change, session listing/revocation
- **Profile sections** — basics, preferences, education, experience, skills, languages, certifications, training, achievements, professional links
- **Privacy** — section-level visibility, share-link, public profile
- **Profile completion** — scored dashboard (100 possible points)
- **Data export** — async BullMQ worker generates JSON archive
- **Account deactivation** — password+confirmation, revoke all sessions

## Architecture

- **Backend:** NestJS (REST API, BullMQ queue, Prisma ORM + PostgreSQL)
- **Frontend:** Next.js 15 App Router, React 19, TypeScript
- **Infrastructure:** Docker Compose (PostgreSQL, Redis, Mailpit, MinIO)
- **Shared packages:** `@nexthire/types`, `@nexthire/validation`, `@nexthire/constants`

## Environment Variables

Key variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Redis connection
- `JWT_SECRET` — HS256 signing key
- `API_CORS_ORIGINS` — credentialed CORS allowlist
- `MAIL_HOST` / `MAIL_PORT` — SMTP (Mailpit)
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — MinIO for exports

## Migrations

17 migrations applied in order (2026-07-21/22). Run `pnpm --filter @nexthire/api prisma:migrate` to apply.

## Seed

Run `pnpm --filter @nexthire/api prisma:seed` to create:

- `candidate` system role
- Test user `candidate@example.com` / `Password123!` (ACTIVE, verified)
- Countries: Bangladesh (BD), Pakistan (PK), India (IN)

## Testing

- **Unit/integration:** `pnpm test` — 90 API + 69 validation + 10 constants + ~177 web tests
- **Mailpit:** http://localhost:8025 (SMTP on 1025)
- **MinIO:** http://localhost:9001 (console), API on 9000

## Limitations

See `docs/phase-1/known-limitations.md`.
