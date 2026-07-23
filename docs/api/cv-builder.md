# CV Builder API (NH-M06)

Base prefix `/api/v1`. All endpoints require an authenticated candidate (Bearer token,
`RolesGuard` + `RequireRoles('candidate')`).

## CVs

| Method | Path                     | Purpose                                       | Notes                                                   |
| ------ | ------------------------ | --------------------------------------------- | ------------------------------------------------------- |
| POST   | `/cvs`                   | Create a CV `{ title, template? }`            | Max 10 per candidate; first CV becomes default          |
| GET    | `/cvs`                   | List own CVs                                  | Default first, then newest                              |
| GET    | `/cvs/:cvId`             | Get one CV                                    | 404 for missing or cross-user (no existence leak)       |
| PUT    | `/cvs/:cvId`             | Update `{ title?, template?, visibility? }`   |                                                         |
| POST   | `/cvs/:cvId/set-default` | Set as default                                | 204                                                     |
| POST   | `/cvs/:cvId/duplicate`   | Duplicate with a new title                    | Copies sections; independent content                    |
| DELETE | `/cvs/:cvId`             | Delete                                        | 400 if it is the default CV (set another default first) |
| GET    | `/cvs/:cvId/readiness`   | `{ ready, missingSections, completionScore }` | Also refreshes `completionScore`                        |
| GET    | `/cvs/:cvId/export/html` | Escaped HTML preview (for the in-app iframe)  | All interpolated values are HTML-escaped                |

## Sections

`GET/PUT /cvs/:cvId/sections[/:sectionType]`, `PATCH /cvs/:cvId/sections/order`,
`PATCH /cvs/:cvId/sections/:sectionType/toggle` — unchanged from the original implementation,
now returning `404` (not `400`) for cross-user access.

`POST /cvs/:cvId/sections/:sectionType/import-from-profile` — snapshots the candidate's
current verified profile records (`education`, `work_experience`, `skills`, `projects`,
`certifications`, `languages`, `achievements`) into that CV's independent section content.
The `personal_info` section is populated automatically at export time from the live profile
and is not imported. Later edits to the source profile do not retroactively change the CV
until the section is re-imported.

## Asynchronous PDF export

| Method | Path                                    | Purpose                                    | Notes                                                                                         |
| ------ | --------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| POST   | `/cvs/:cvId/exports`                    | Queue a PDF export                         | 400 `CV_NOT_READY_FOR_EXPORT` if the summary is missing; 409 if 3 exports are already pending |
| GET    | `/cvs/:cvId/exports`                    | Export history (newest first, last 20)     |                                                                                               |
| GET    | `/cvs/:cvId/exports/:exportId`          | Poll status (`PENDING → GENERATING → READY | FAILED`)                                                                                      |     |
| POST   | `/cvs/:cvId/exports/:exportId/download` | Get a download URL for a `READY` export    | 409 if not ready                                                                              |
| GET    | `/cvs/:cvId/exports/:exportId/file`     | Stream the PDF bytes                       | Owner-only, bearer-authenticated; `Cache-Control: private, no-store`                          |

Generation runs on a BullMQ worker (`cv-exports` queue, mirrors the assessment-certificate
worker). The worker renders the PDF with `pdfkit` (not HTML-to-PDF, so there is no script/CSS
injection surface) using the CV's sections and template accent color, uploads it via
`CvStorageService` (S3/MinIO when configured, local filesystem in dev), and updates the
`CvExport` row's status.

The download flow intentionally skips a separate short-lived signed URL: the `/file` endpoint
itself requires the caller's bearer token and re-verifies ownership on every request, which is
at least as strong as a time-limited signature and avoids a token appearing in a URL.
