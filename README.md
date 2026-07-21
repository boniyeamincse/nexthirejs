# NextHire

NextHire is a planned career-readiness, learning, portfolio, assessment, and hiring platform for candidates, trainers, and companies.

## Current Phase

Phase 0: Foundation. This repository currently contains only the monorepo foundation and planning documentation. Application initialization will happen in later tasks.

## Monorepo Structure

```text
apps/
  web/           Next.js web frontend
  api/           NestJS backend API
  mobile/        Planned Flutter mobile application
packages/
  types/         Planned shared TypeScript types
  validation/    Planned shared validation schemas
  constants/     Planned shared constants
  api-client/    Planned shared API client
  eslint-config/ Planned shared lint configuration package
  tsconfig/      Planned shared TypeScript configuration package
infrastructure/
  docker/        Planned local container infrastructure files
  nginx/         Planned edge and reverse-proxy configuration
  monitoring/    Planned observability configuration
  scripts/       Planned repository and infrastructure scripts
docs/
  architecture/  Architecture notes
  api/           API documentation
  database/      Database documentation
  task/          Task tracking and implementation instructions
```

## Planned Applications

- `apps/web`: candidate, trainer, company, and admin web experience
- `apps/api`: backend API and business logic services
- `apps/mobile`: Flutter mobile application for future phases

## Planned Core Technology

- Next.js with TypeScript for the web frontend
- NestJS with TypeScript for the backend API
- PostgreSQL with Prisma for persistent data
- Redis and BullMQ for caching and background jobs
- Socket.IO for real-time features
- Docker for local infrastructure
- Turborepo and pnpm workspaces for monorepo orchestration

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

## Documentation

Planning and implementation documents live under `docs/`, with task tracking in `docs/task/`.

Code quality standards (ESLint, Prettier, commit conventions, hooks) and the CI pipeline are documented in [docs/development/code-quality.md](docs/development/code-quality.md).

## Security Rule

Secrets must never be committed. Use environment files locally and commit only safe example files such as `.env.example`.
