# @nexthire/validation

Shared validation schemas for NextHire monorepo.

## Purpose

Provides reusable Zod validation schemas that can be used across API and web applications. Schemas derive from shared constants to avoid duplicating literal lists.

## Public Exports

All schemas are exported from `src/index.ts`:

- **Common Schemas** (`./common`):
  - `uuidSchema` - UUID validation
  - `emailSchema` - Normalized email validation
  - `nonEmptyTrimmedStringSchema` - Non-empty trimmed string
  - `countryCodeSchema` - Country code validation
  - `currencyCodeSchema` - Currency code validation
  - `languageCodeSchema` - Language code validation

- **Pagination Schemas** (`./pagination`):
  - `cursorPaginationQuerySchema` - Cursor-based pagination query validation

## Example Import

```typescript
import { emailSchema, cursorPaginationQuerySchema } from '@nexthire/validation';
import type { z } from 'zod';

type EmailInput = z.infer<typeof emailSchema>;
type PaginationInput = z.infer<typeof cursorPaginationQuerySchema>;
```

## Build Command

```bash
pnpm --filter @nexthire/validation build
```

## Type-check Command

```bash
pnpm --filter @nexthire/validation typecheck
```

## Test Command

```bash
pnpm --filter @nexthire/validation test
```

## Scope Limitations

This package does NOT include:

- Authentication DTOs
- Business entity validation
- Framework-specific decorators
- Database entity validation
- React form validation

## Framework Independence

This package is portable TypeScript and does not import:

- NestJS
- Next.js
- Prisma
- React
- Node-specific APIs
