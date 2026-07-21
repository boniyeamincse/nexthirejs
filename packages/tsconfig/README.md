# @nexthire/tsconfig

Shared TypeScript configurations for NextHire monorepo.

## Purpose

This package provides reusable TypeScript compiler options that can be extended by API and web applications. The configurations maintain consistent strictness settings across the codebase while allowing framework-specific customization.

## Public Exports

- `base.json` - Base strict TypeScript configuration
- `nestjs.json` - NestJS-specific configuration with decorators support
- `nextjs.json` - Next.js-specific configuration

## Usage

### For NestJS API

```json
{
  "extends": "@nexthire/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### For Next.js Web

```json
{
  "extends": "@nexthire/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

## Build Command

```bash
pnpm --filter @nexthire/tsconfig typecheck
```

## Scope Limitations

This package only provides TypeScript compiler configurations. It does not include:

- ESLint configuration
- Prettier configuration
- Build outputs
- Runtime validation

## Maintainer Notes

When updating these configurations:

- Do not weaken strictness settings
- Ensure compatibility with current Node.js LTS
- Test both NestJS and Next.js applications after changes
- Avoid introducing framework-specific coupling where possible
