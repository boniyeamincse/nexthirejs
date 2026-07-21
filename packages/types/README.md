# @nexthire/types

Shared TypeScript types for NextHire monorepo.

## Purpose

Provides foundational TypeScript types that are shared across API and web applications. This package focuses on infrastructure and generic types without introducing business-domain entities.

## Public Exports

All types are exported from `src/index.ts`:

- **API Response Types** (`./api`):
  - `ApiSuccessResponse<TData, TMeta>`
  - `ApiErrorDetail`
  - `ApiErrorResponse`
  - `ApiResponse<TData, TMeta>`

- **Pagination Types** (`./pagination`):
  - `CursorPaginationMeta`
  - `CursorPaginatedData<TItem>`

- **Utility Types** (`./utility`):
  - `Nullable<T>`
  - `Optional<T>`
  - `ValueOf<TObject>`

## Example Import

```typescript
import type { ApiResponse } from '@nexthire/types';
import type { CursorPaginationMeta } from '@nexthire/types/pagination';
```

## Build Command

```bash
pnpm --filter @nexthire/types build
```

## Type-check Command

```bash
pnpm --filter @nexthire/types typecheck
```

## Scope Limitations

This package does NOT include:

- Candidate types
- Trainer types
- Company types
- Job types
- Booking types
- Payment types
- CV types
- Course types
- Authentication DTOs
- Database entities

Business-domain types must be added only when their respective feature modules are developed.

## Framework Independence

This package is framework-agnostic and does not depend on NestJS, Next.js, Prisma, or React types.