# NextHire

NextHire is a planned career-readiness, learning, portfolio, assessment, and hiring platform for candidates, trainers, and companies.

## Current Phase

Phase 1: Identity and Candidate Foundation — COMPLETED. See `docs/phase-1/overview.md` for the full scope and `docs/task/status.md` for task tracking.

## Monorepo Structure

```text
apps/
  web/           Next.js web frontend (Phase 1 candidate flows)
  api/           NestJS backend API (Phase 1 identity + profile)
  mobile/        Planned Flutter mobile application
packages/
  types/         Shared TypeScript types (auth, candidates, audit, config)
  validation/    Shared Zod validation schemas (auth, profile sections, pagination)
  constants/     Shared constants (auth errors, countries, languages, currencies)
  api-client/    Planned shared API client
  eslint-config/ Planned shared lint configuration package
  tsconfig/      Shared TypeScript configuration
infrastructure/
  docker/        Local Docker Compose (PostgreSQL, Redis, Mailpit, MinIO)
  nginx/         Planned edge and reverse-proxy configuration
  monitoring/    Planned observability configuration
  scripts/       Repository and infrastructure scripts
docs/
  architecture/  Architecture notes
  api/           API documentation
  phase-1/       Phase 1 documentation (overview, API inventory, security, smoke test, limitations)
  database/      Database documentation
  task/          Task tracking and implementation instructions
  privacy/       Data export privacy documentation
  security/      Account deactivation security documentation
```

## Applications

- `apps/web`: candidate web experience (register, login, profile management, settings)
- `apps/api`: backend REST API (candidate identity, profile CRUD, privacy, completion, data export)
- `apps/mobile`: Flutter mobile application for future phases

## Core Technology

- Next.js 15 with TypeScript for the web frontend
- NestJS with TypeScript for the backend API
- PostgreSQL with Prisma (v7) for persistent data
- Redis and BullMQ for background jobs (email queue, data export)
- Docker Compose for local infrastructure (PostgreSQL, Redis, Mailpit, MinIO)
- Turborepo and pnpm workspaces for monorepo orchestration
- Zod for shared validation schemas

## Local Prerequisites

- Git
- Node.js 22 LTS
- Corepack
- pnpm 10

## Initial Setup

```bash
corepack enable
pnpm install
```

## Development Workflow

This repository uses pnpm workspaces and Turborepo at the root. Foundation commands are available before application packages are created:

```bash
pnpm build
pnpm dev
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm test
pnpm typecheck
pnpm clean
pnpm ci:check
```

Application-specific commands:

```bash
pnpm --filter @nexthire/api dev
pnpm --filter @nexthire/api build
pnpm --filter @nexthire/api test
pnpm --filter @nexthire/api test:e2e
pnpm --filter @nexthire/api typecheck

pnpm --filter @nexthire/web dev
pnpm --filter @nexthire/web build
pnpm --filter @nexthire/web lint
pnpm --filter @nexthire/web test
pnpm --filter @nexthire/web test:e2e
pnpm --filter @nexthire/web typecheck
```

- API runs locally.
- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs
- PostgreSQL, Redis, MinIO, and Mailpit run through Docker.
- API connects to PostgreSQL and Redis via Prisma and ioredis.
- Redis: `localhost:6379`
- Queue test (development only): `POST http://localhost:3001/api/v1/system/queue/ping`

## Test Accounts

The following test accounts are available for local development and testing. You must run `pnpm --filter @nexthire/api db:seed` to create them in your local database.

| Role      | Email                   | Password       | Notes                      |
| --------- | ----------------------- | -------------- | -------------------------- |
| Candidate | `candidate@example.com` | `Password123!` | Standard candidate account |

## Documentation

Planning and implementation documents live under `docs/`, with task tracking in `docs/task/`.

Code quality standards (ESLint, Prettier, commit conventions, hooks) and the CI pipeline are documented in [docs/development/code-quality.md](docs/development/code-quality.md).

## Security Rule

Secrets must never be committed. Use environment files locally and commit only safe example files such as `.env.example`.
