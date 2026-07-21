# NextHire Web

## Purpose

Web frontend for the NextHire career readiness and hiring platform.

## Technology

- Next.js 16 with TypeScript
- App Router with `src/` directory
- Tailwind CSS
- Vitest and Playwright for testing

## Prerequisites

- Node.js 22 LTS
- pnpm 10

## Environment Variables

Copy the root `.env.example` to `.env`. Key public variables:

| Variable                   | Default                      | Description            |
| -------------------------- | ---------------------------- | ---------------------- |
| `NEXT_PUBLIC_APP_NAME`     | NextHire                     | Application name       |
| `NEXT_PUBLIC_APP_URL`      | http://localhost:3000        | Public application URL |
| `NEXT_PUBLIC_API_BASE_URL` | http://localhost:3001/api/v1 | API base URL           |

## Development

```bash
pnpm --filter @nexthire/web dev
```

## Build

```bash
pnpm --filter @nexthire/web build
```

## Lint

```bash
pnpm --filter @nexthire/web lint
```

## Type Check

```bash
pnpm --filter @nexthire/web typecheck
```

## Unit Tests

```bash
pnpm --filter @nexthire/web test
```

## E2E Tests

```bash
pnpm --filter @nexthire/web test:e2e
```

## Local URLs

```text
Web: http://localhost:3000
Status: http://localhost:3000/status
API baseline: http://localhost:3001/api/v1
```

## Current Limitations

- The web app does not call the API yet.
- Authentication and business features are not implemented.
- Docker is used only for supporting local infrastructure.
