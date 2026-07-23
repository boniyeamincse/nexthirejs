# CV Builder Security Notes (NH-M06)

## Fixed during this module

- **IDOR / existence leak**: every CV, section, and export service method previously did
  `findUnique` → 404 if missing, then a separate `if (cv.userId !== userId) throw
BadRequestException('Unauthorized')` (400) check. That let a caller distinguish "this CV
  doesn't exist" (404) from "this CV exists but isn't yours" (400) — an IDOR information leak.
  Collapsed to a single `NotFoundException('CV_NOT_FOUND')` (404) for both cases across
  `cv.service.ts`, `cv-section.service.ts`, `cv-export.service.ts`, and the new export/readiness
  services. Verified by E2E tests asserting identical 404s for cross-user and nonexistent IDs.
- **Stored/self-XSS in the HTML preview**: `cv-export.service.ts`'s `buildHtmlTemplate` and
  `renderSection` interpolated the CV title, profile fields, and arbitrary candidate-authored
  section JSON directly into an HTML string returned as `text/html`. A candidate could store
  `<script>...</script>` in their own CV title or summary and have it execute when the preview
  HTML is rendered (e.g. in an iframe or a new tab). Fixed by escaping every interpolated value
  (`escapeHtml`) before insertion; section content is rendered as escaped text, never raw HTML.
  Verified by an E2E test that stores `<script>`/`<img onerror>` payloads and asserts the raw
  tags never appear in the response while their escaped form does.
- **Missing role scoping**: `CvController` and `CvSectionController` only required
  authentication (`AuthGuard`), not the `candidate` role, unlike every sibling candidate-profile
  controller. Added `RolesGuard` + `RequireRoles('candidate')` for consistency.

## New surface (PDF export)

- PDF generation uses `pdfkit` (a drawing API), not HTML-to-PDF rendering, so there is no
  script/CSS execution surface in the generated file itself.
- Export files are stored in a private bucket/prefix (`nexthire-cv-exports`) with opaque,
  random storage keys; never a public bucket.
- `GET /cvs/:cvId/exports/:exportId/file` is owner-checked on every request (session-derived
  identity, not a client-supplied ID) before any bytes are read from storage.
- Audit events: `cv.export.requested`, `cv.export.ready`, `cv.export.failed`,
  `cv.export.downloaded`, `cv.section_imported_from_profile`. No file contents, storage keys, or
  candidate PII in audit metadata beyond counts and IDs.
- Export requests are capped at 3 concurrent PENDING/GENERATING jobs per CV and rate-limited
  (10 export requests/hour, 30 downloads/hour) to bound worker and storage load.
