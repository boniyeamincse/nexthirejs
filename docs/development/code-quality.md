# Code Quality Standards

## 1. Purpose

This document defines the repository-wide code quality standards for the NextHire monorepo. All code contributed to this repository must follow these standards unless a specific exemption is documented.

---

## 2. ESLint Architecture

The repository uses a shared ESLint flat config package:

- **`packages/eslint-config/base.mjs`** — Base preset with recommended rules, TypeScript support, and Prettier integration.
- **`packages/eslint-config/node.mjs`** — Extends base with Node.js and NestJS support.
- **`packages/eslint-config/next.mjs`** — Extends base with Next.js Core Web Vitals and TypeScript rules.

Applications import the relevant shared preset and add only application-specific overrides:

| Application     | Import                         |
| --------------- | ------------------------------ |
| `apps/api`      | `@nexthire/eslint-config/node` |
| `apps/web`      | `@nexthire/eslint-config/next` |
| Shared packages | `@nexthire/eslint-config/base` |

---

## 3. Prettier Rules

| Setting         | Value  |
| --------------- | ------ |
| Semicolons      | Always |
| Quotes          | Single |
| Trailing commas | All    |
| Tab width       | 2      |
| Tabs            | No     |
| Print width     | 100    |
| Bracket spacing | Yes    |
| Arrow parens    | Always |
| End of line     | LF     |

---

## 4. Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm lint`         | Run ESLint on all packages via Turborepo |
| `pnpm lint:fix`     | Run ESLint with auto-fix via Turborepo   |
| `pnpm format`       | Format all files with Prettier           |
| `pnpm format:check` | Check formatting without writing         |
| `pnpm lint:staged`  | Run lint-staged on staged files          |

Per-package lint commands:

```bash
pnpm --filter @nexthire/api lint
pnpm --filter @nexthire/web lint
pnpm --filter @nexthire/constants lint
pnpm --filter @nexthire/validation lint
pnpm --filter @nexthire/types lint
```

---

## 5. Automatic Staged Checks

Before every commit, the pre-commit hook runs `lint-staged`, which:

1. Lints and formats staged `.js`, `.ts`, `.jsx`, and `.tsx` files with ESLint (`--fix`) and Prettier.
2. Formats staged `.json`, `.yml`, `.yaml`, `.css`, and `.md` files with Prettier.

Only files staged for commit are checked. Unstaged changes are not modified.

---

## 6. Conventional Commit Format

All commits must follow the Conventional Commits format:

```
type(scope): subject
```

### Allowed Types

| Type       | Usage                        |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `docs`     | Documentation                |
| `style`    | Formatting, whitespace       |
| `refactor` | Code restructuring           |
| `perf`     | Performance improvement      |
| `test`     | Adding or fixing tests       |
| `build`    | Build system or dependencies |
| `ci`       | CI configuration             |
| `chore`    | Repository maintenance       |
| `revert`   | Revert a previous change     |

### Valid Examples

```
feat(auth): add email verification flow
fix(api): handle unavailable redis connection
docs(tasks): add phase zero task status
chore(repo): configure prettier and commit hooks
```

### Invalid Examples

```
updated files
New Feature
fix
```

---

## 7. Bypassing Hooks Policy

- `git commit --no-verify` (or `-n`) must not be used routinely.
- A hook may be bypassed only for a documented emergency.
- The branch must still pass all repository checks (lint, typecheck, test, build) before merge.
- Bypass decisions should be documented in the commit message or a linked issue.

---

## 8. Troubleshooting

### ESLint type-aware rules fail

Ensure the file is included in the TypeScript project referenced by `projectService`. If the file is a test file, ensure it's covered by the test file overrides.

### Prettier and ESLint conflict

The shared base preset includes `eslint-config-prettier` as the last entry, which disables formatting rules that may conflict with Prettier.

### Husky hooks not running

Ensure `.husky/pre-commit` and `.husky/commit-msg` are executable:

```bash
chmod +x .husky/pre-commit .husky/commit-msg
```

Run `pnpm exec husky` to reinitialize hooks.

---

## 9. Adding Lint Configuration to Future Packages

1. Add `@nexthire/eslint-config` as a devDependency in the package's `package.json`.
2. Create an `eslint.config.mjs` that imports the appropriate shared preset:

   ```js
   // For Node.js / NestJS packages
   import node from '@nexthire/eslint-config/node';
   export default [...node];

   // For web / React packages
   import next from '@nexthire/eslint-config/next';
   export default [...next];

   // For pure TypeScript packages
   import base from '@nexthire/eslint-config/base';
   export default [...base];
   ```

3. Add `lint` and `lint:fix` scripts to `package.json`.
4. Generated files must not be manually reformatted.
5. Lint rules must not be disabled without a narrow code-level reason.
