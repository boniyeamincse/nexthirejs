# NextHire API

## Purpose

Backend API for the NextHire career readiness and hiring platform.

## Technology

- NestJS 11 with TypeScript (strict mode)
- Express (NestJS platform-express)
- Swagger / OpenAPI documentation
- Helmet security headers
- Environment-based configuration via @nestjs/config

## Prerequisites

- Node.js 22 LTS
- pnpm 10

## Environment Setup

Copy the root `.env.example` to `.env` and configure as needed. The API reads `../../.env` (repository root) and `.env` (project root) during local development.

Key variables:

| Variable              | Default                 | Description                     |
| --------------------- | ----------------------- | ------------------------------- |
| `API_HOST`            | `0.0.0.0`               | Bind address                    |
| `API_PORT`            | `3001`                  | Listen port                     |
| `API_GLOBAL_PREFIX`   | `api`                   | URL prefix                      |
| `API_DEFAULT_VERSION` | `1`                     | Default API version             |
| `API_CORS_ORIGINS`    | `http://localhost:3000` | Comma-separated allowed origins |
| `API_DOCS_ENABLED`    | `true`                  | Enable Swagger UI               |
| `API_BODY_LIMIT`      | `1mb`                   | Request body size limit         |

## Local Start

```bash
pnpm --filter @nexthire/api dev
```

## Build

```bash
pnpm --filter @nexthire/api build
```

## Unit Tests

```bash
pnpm --filter @nexthire/api test
```

## E2E Tests

```bash
pnpm --filter @nexthire/api test:e2e
```

## Type Check

```bash
pnpm --filter @nexthire/api typecheck
```

## API Base URL

```text
http://localhost:3001/api/v1
```

## Health URL

```text
http://localhost:3001/api/v1/health
```

## Swagger URL

```text
http://localhost:3001/api/docs
```

## Current Limitations

- Database and authentication are not implemented yet.
- No PostgreSQL or Redis connection.
- No business modules.
