# Database & Prisma Configuration

## Overview

This project uses **PostgreSQL 16** as the database engine and **Prisma 7** as the ORM with the PostgreSQL driver adapter (`@prisma/adapter-pg`).

## Prisma Client

Prisma Client is generated to `apps/api/src/generated/prisma/` using the `prisma-client` generator provider:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

The generated client is excluded from version control (`.gitignore`) and must be re-generated after schema changes.

## Configuration

### Environment Variables

| Variable                     | Default                                                                | Description                                   |
| ---------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`               | `postgresql://nexthire:nexthire@localhost:5432/nexthire?schema=public` | PostgreSQL connection string                  |
| `DATABASE_HEALTH_TIMEOUT_MS` | `5000`                                                                 | Timeout (ms) for the database readiness check |

### Prisma Config (`apps/api/prisma.config.ts`)

The Prisma configuration file uses `defineConfig` from `@prisma/config` and loads the `DATABASE_URL` from the environment via `dotenv`:

```ts
require('dotenv').config({ path: '../../.env' });

module.exports = require('@prisma/config').defineConfig({
  earlyAccess: true,
  schema: require('path').join(__dirname, 'prisma', 'schema.prisma'),
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
});
```

## Schema

The schema file lives at `apps/api/prisma/schema.prisma`. The initial schema contains only the datasource and generator configuration with no business models. Models will be added incrementally as features are implemented.

## Scripts

| Script              | Description                                |
| ------------------- | ------------------------------------------ |
| `db:format`         | Format the Prisma schema file              |
| `db:validate`       | Validate the Prisma schema                 |
| `db:generate`       | Generate the Prisma Client                 |
| `db:migrate:dev`    | Create a new migration from schema changes |
| `db:migrate:deploy` | Apply pending migrations to the database   |
| `db:migrate:status` | Check migration status                     |
| `db:studio`         | Open Prisma Studio to browse data          |

Prisma Client is automatically generated via the `postinstall` script and before `build`.

## Database Module Architecture

The database layer is organized as follows:

```
src/database/
├── database.module.ts    — NestJS module exporting PrismaService
├── database.types.ts     — Shared database types
├── prisma.service.ts     — Wraps PrismaClient with adapter
└── prisma.service.spec.ts
```

### PrismaService

`PrismaService` extends `PrismaClient` and is injected as a NestJS provider. It uses the `PrismaPg` adapter to connect to PostgreSQL.

Key methods:

- **`checkConnection()`** — Runs `SELECT 1` and returns `{ status: 'up' }`. Used by the readiness health check.
- **`onModuleDestroy()`** — Disconnects the Prisma Client when the module is destroyed (graceful shutdown).

### Health Check Integration

The readiness endpoint (`GET /api/v1/health/ready`) uses `PrismaService.checkConnection()` to verify database connectivity. If the check fails or times out (configurable via `DATABASE_HEALTH_TIMEOUT_MS`), the endpoint returns a `503 Service Unavailable` response.

## Tests

- **Unit tests** cover `PrismaService.checkConnection`, `PrismaService.onModuleDestroy`, and error handling (missing `DATABASE_URL`, query failures).
- **E2E tests** mock `PrismaService.checkConnection` to verify the full HTTP readiness endpoint.
