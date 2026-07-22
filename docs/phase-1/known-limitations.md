# Phase 1 Known Limitations

## Functional Gaps

1. **NH-P0-T009** (environment validation + secrets) — PLANNED, not implemented.
2. **NH-P0-T010** (CI pipeline + baseline tests) — PLANNED, not implemented.
3. **NH-P1-T005** (MFA/2FA) — deferred from Phase 1 scope.
4. **Session listing** — implemented but partial admin capabilities deferred.
5. **Frontend E2E tests** — Playwright tests not yet created.
6. **CI pipeline** — no automated CI runner configured.

## Technical Debt

1. **Web test failures** — 10 tests fail in pre-existing test files (home-page, register-page, login-page, profile-preferences-page, languages, skills) due to React 19 / Vite 7 rendering differences. These are not regressions from Phase 1 changes.
2. **API lint errors** — ~20 pre-existing ESLint errors in audit service and storage service (unused variables, `any` types, unsafe member access). None are security-critical.
3. **Web lint errors** — ~15 pre-existing errors including unescaped entities, `any` types, and setState-in-effect patterns.
4. **Build warnings** — `next.config.ts` includes experimental `turbo` config that causes build warnings.
5. **TypeScript strictness** — Several pre-existing `any` casts and unsafe member accesses that were part of earlier task deliveries.

## Security Notes

1. **MinIO integration** — uses local filesystem `StorageService` in development; production should switch to S3-compatible `StorageService`.
2. **Email delivery** — Mailpit used for development; production requires a real SMTP provider.
3. **Token in URL** — verification and reset tokens are delivered via URL query params; no persistent logging of URLs in production infrastructure has been verified.
4. **Rate limiting** — global rate limit (100/min) is a single shared counter; per-user or per-IP limits may be needed at scale.
5. **Session pruning** — expired sessions are not automatically cleaned; a periodic job is needed.

## Phase 2 Handoff Notes

1. Assessment domain (NH-P2-T001 onward) will add trainer/company flows.
2. Career Passport, CV builder, and job matching are Phase 3+.
3. Social login and MFA are Phase 4+.
4. The shared packages (`@nexthire/types`, `@nexthire/validation`, `@nexthire/constants`) should continue to be the single source of truth for cross-domain contracts.
