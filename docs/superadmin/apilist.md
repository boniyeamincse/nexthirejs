# 👑 SUPERADMIN — Complete API List

## API Base Path: `/api/v1/admin`

---

# 📊 1. DASHBOARD APIs

## Platform Overview
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Get platform KPI statistics |
| GET | `/admin/dashboard/overview` | Get complete dashboard overview |
| GET | `/admin/dashboard/activity` | Get recent platform activity |
| GET | `/admin/dashboard/alerts` | Get system alerts and notifications |

## Growth Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/growth/users` | Get user growth analytics |
| GET | `/admin/analytics/growth/roles` | Get role-wise distribution |
| GET | `/admin/analytics/growth/countries` | Get country-wise distribution |
| GET | `/admin/analytics/growth/retention` | Get user retention analysis |
| GET | `/admin/analytics/growth/funnel` | Get registration funnel data |

## Revenue Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/revenue/trends` | Get revenue trends |
| GET | `/admin/analytics/revenue/sources` | Get revenue by source |
| GET | `/admin/analytics/revenue/countries` | Get revenue by country |
| GET | `/admin/analytics/revenue/payments` | Get payment success/failure rate |
| GET | `/admin/analytics/revenue/commission` | Get commission collection summary |
| GET | `/admin/analytics/revenue/refunds` | Get refund analytics |

## Performance Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/performance/api` | Get API performance metrics |
| GET | `/admin/analytics/performance/queue` | Get queue processing status |
| GET | `/admin/analytics/performance/errors` | Get error rates by endpoint |
| GET | `/admin/analytics/performance/system` | Get system resource usage |
| GET | `/admin/analytics/performance/database` | Get database performance |
| GET | `/admin/analytics/performance/uptime` | Get service uptime status |

---

# 👥 2. USER MANAGEMENT APIs

## All Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users with filters |
| GET | `/admin/users/:id` | Get user details |
| PUT | `/admin/users/:id/status` | Update user status (suspend/activate) |
| PUT | `/admin/users/:id/password` | Change user password (admin) |
| POST | `/admin/users/:id/logout` | Force logout user |
| DELETE | `/admin/users/:id` | Delete user account |
| POST | `/admin/users/bulk` | Bulk user operations |
| GET | `/admin/users/export` | Export users data |

## Suspended Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users/suspended` | Get all suspended users |
| PUT | `/admin/users/suspended/:id/activate` | Activate suspended user |
| GET | `/admin/users/suspended/history` | Get suspension history |

## Account Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users/verification/pending` | Get pending verifications |
| GET | `/admin/users/verification/verified` | Get verified accounts |
| GET | `/admin/users/verification/rejected` | Get rejected accounts |
| PUT | `/admin/users/verification/:id/verify` | Verify user account |
| PUT | `/admin/users/verification/:id/reject` | Reject verification |
| GET | `/admin/users/verification/history` | Get verification history |

## Roles & Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/roles` | Get all roles |
| POST | `/admin/roles` | Create new role |
| GET | `/admin/roles/:id` | Get role details |
| PUT | `/admin/roles/:id` | Update role |
| DELETE | `/admin/roles/:id` | Delete role |
| GET | `/admin/permissions` | Get all permissions |
| POST | `/admin/permissions` | Create custom permission |
| GET | `/admin/roles/:id/permissions` | Get role permissions |
| PUT | `/admin/roles/:id/permissions` | Update role permissions |
| GET | `/admin/users/:id/roles` | Get user roles |
| POST | `/admin/users/:id/roles` | Assign role to user |
| DELETE | `/admin/users/:id/roles/:roleId` | Remove role from user |
| POST | `/admin/users/roles/bulk` | Bulk role assignment |
| GET | `/admin/roles/audit` | Get role change history |

---

# 🎓 3. CANDIDATE MANAGEMENT APIs

## All Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/candidates` | Get all candidates |
| GET | `/admin/candidates/:id` | Get candidate details |
| GET | `/admin/candidates/:id/profile` | Get candidate full profile |
| GET | `/admin/candidates/:id/passport` | Get candidate career passport |
| GET | `/admin/candidates/:id/cvs` | Get candidate CV history |
| GET | `/admin/candidates/:id/projects` | Get candidate projects |
| GET | `/admin/candidates/:id/assessments` | Get candidate assessment results |
| GET | `/admin/candidates/:id/sessions` | Get candidate session history |
| GET | `/admin/candidates/:id/applications` | Get candidate job applications |
| GET | `/admin/candidates/:id/activity` | Get candidate activity timeline |
| PUT | `/admin/candidates/:id/status` | Update candidate status |
| DELETE | `/admin/candidates/:id` | Delete candidate account |
| POST | `/admin/candidates/bulk` | Bulk candidate operations |

## Skill Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/candidates/skills/pending` | Get pending skill verifications |
| PUT | `/admin/candidates/skills/:id/verify` | Verify candidate skill |
| PUT | `/admin/candidates/skills/:id/reject` | Reject skill verification |
| GET | `/admin/candidates/skills/verified` | Get verified skills summary |
| GET | `/admin/candidates/skills/history` | Get verification history |

## Readiness Levels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/candidates/readiness/distribution` | Get readiness level distribution |
| GET | `/admin/candidates/readiness/progress` | Get career progress tracking |
| GET | `/admin/candidates/readiness/gaps` | Get skill gap analysis |
| GET | `/admin/candidates/readiness/reports` | Get job readiness reports |

## Candidate Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/candidates/reports/registration` | Get registration trends |
| GET | `/admin/candidates/reports/completion` | Get profile completion analytics |
| GET | `/admin/candidates/reports/readiness` | Get readiness improvement |
| GET | `/admin/candidates/reports/countries` | Get country-wise distribution |
| GET | `/admin/candidates/reports/skills` | Get skill distribution |
| GET | `/admin/candidates/reports/export` | Export candidate reports |

---

# 🎯 4. EXPERT MANAGEMENT APIs

## All Experts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/experts` | Get all experts |
| GET | `/admin/experts/:id` | Get expert details |
| GET | `/admin/experts/:id/profile` | Get expert full profile |
| GET | `/admin/experts/:id/services` | Get expert services |
| GET | `/admin/experts/:id/bookings` | Get expert bookings history |
| GET | `/admin/experts/:id/earnings` | Get expert earnings |
| GET | `/admin/experts/:id/payouts` | Get expert payouts |
| GET | `/admin/experts/:id/reviews` | Get expert reviews |
| GET | `/admin/experts/:id/complaints` | Get expert complaints |
| PUT | `/admin/experts/:id/status` | Update expert status |
| DELETE | `/admin/experts/:id` | Delete expert account |
| POST | `/admin/experts/bulk` | Bulk expert operations |

## Verification Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/experts/verification/pending` | Get pending expert verifications |
| GET | `/admin/experts/verification/:id` | Get verification details |
| GET | `/admin/experts/verification/:id/documents` | Get verification documents |
| PUT | `/admin/experts/verification/:id/approve` | Approve expert verification |
| PUT | `/admin/experts/verification/:id/reject` | Reject expert verification |
| PUT | `/admin/experts/verification/:id/request-changes` | Request changes for verification |
| GET | `/admin/experts/verification/history` | Get verification history |
| PUT | `/admin/experts/verification/:id/reverify` | Request re-verification |

## Performance Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/experts/performance/top` | Get top performing experts |
| GET | `/admin/experts/performance/bookings` | Get booking conversion rate |
| GET | `/admin/experts/performance/ratings` | Get rating trends |
| GET | `/admin/experts/performance/earnings` | Get earnings leaderboard |
| GET | `/admin/experts/performance/services` | Get service performance |
| GET | `/admin/experts/performance/no-shows` | Get no-show rates |
| GET | `/admin/experts/performance/completion` | Get completion rates |

## Expert Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/experts/complaints` | Get all expert complaints |
| GET | `/admin/experts/complaints/:id` | Get complaint details |
| PUT | `/admin/experts/complaints/:id/resolve` | Resolve complaint |
| PUT | `/admin/experts/complaints/:id/warn` | Issue warning to expert |
| PUT | `/admin/experts/complaints/:id/suspend` | Suspend expert |
| POST | `/admin/experts/complaints/:id/notes` | Add internal notes |

## Expert Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/experts/reports/registration` | Get registration trends |
| GET | `/admin/experts/reports/verification` | Get verification success rate |
| GET | `/admin/experts/reports/bookings` | Get booking analytics |
| GET | `/admin/experts/reports/earnings` | Get earnings analytics |
| GET | `/admin/experts/reports/services` | Get service popularity |
| GET | `/admin/experts/reports/countries` | Get country-wise distribution |
| GET | `/admin/experts/reports/export` | Export expert reports |

---

# 🏢 5. COMPANY MANAGEMENT APIs

## All Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/companies` | Get all companies |
| GET | `/admin/companies/:id` | Get company details |
| GET | `/admin/companies/:id/profile` | Get company full profile |
| GET | `/admin/companies/:id/team` | Get company team members |
| GET | `/admin/companies/:id/jobs` | Get company job posts |
| GET | `/admin/companies/:id/hiring` | Get company hiring activity |
| GET | `/admin/companies/:id/candidates` | Get company candidate searches |
| GET | `/admin/companies/:id/subscription` | Get company subscription status |
| PUT | `/admin/companies/:id/status` | Update company status |
| DELETE | `/admin/companies/:id` | Delete company account |
| POST | `/admin/companies/bulk` | Bulk company operations |

## Verification Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/companies/verification/pending` | Get pending company verifications |
| GET | `/admin/companies/verification/:id` | Get verification details |
| GET | `/admin/companies/verification/:id/documents` | Get verification documents |
| PUT | `/admin/companies/verification/:id/approve` | Approve company verification |
| PUT | `/admin/companies/verification/:id/reject` | Reject company verification |
| PUT | `/admin/companies/verification/:id/request-changes` | Request changes |
| GET | `/admin/companies/verification/history` | Get verification history |

## Subscription Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/companies/subscriptions` | Get all subscriptions |
| GET | `/admin/companies/subscriptions/active` | Get active subscriptions |
| GET | `/admin/companies/subscriptions/expiring` | Get expiring subscriptions |
| PUT | `/admin/companies/:id/subscription` | Update company subscription |
| GET | `/admin/companies/subscriptions/plans` | Get subscription plans |
| PUT | `/admin/companies/subscriptions/plans/:id` | Update subscription plan |
| GET | `/admin/companies/subscriptions/history` | Get subscription history |

## Company Team Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/companies/:id/team` | Get company team members |
| GET | `/admin/companies/:id/team/:memberId` | Get team member details |
| PUT | `/admin/companies/:id/team/:memberId/role` | Update team member role |
| DELETE | `/admin/companies/:id/team/:memberId` | Remove team member |
| POST | `/admin/companies/:id/team/invite` | Invite team member |
| GET | `/admin/companies/:id/team/permissions` | Get team permissions audit |

## Company Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/companies/:id/activity/jobs` | Get job posting activity |
| GET | `/admin/companies/:id/activity/search` | Get candidate search activity |
| GET | `/admin/companies/:id/activity/hiring` | Get hiring funnel analytics |
| GET | `/admin/companies/:id/activity/interviews` | Get interview scheduling |
| GET | `/admin/companies/:id/activity/offers` | Get offer management |
| GET | `/admin/companies/:id/activity/performance` | Get company performance reports |

---

# 💼 6. JOB MANAGEMENT APIs

## All Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/jobs` | Get all jobs |
| GET | `/admin/jobs/:id` | Get job details |
| GET | `/admin/jobs/:id/applications` | Get job applications |
| PUT | `/admin/jobs/:id/status` | Update job status |
| PUT | `/admin/jobs/:id/featured` | Toggle job featured status |
| POST | `/admin/jobs/:id/featured` | Make job featured |
| DELETE | `/admin/jobs/:id` | Delete job |
| POST | `/admin/jobs/bulk` | Bulk job operations |

## Moderation Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/jobs/pending` | Get pending job reviews |
| GET | `/admin/jobs/pending/:id` | Get job review details |
| PUT | `/admin/jobs/pending/:id/approve` | Approve job post |
| PUT | `/admin/jobs/pending/:id/reject` | Reject job post |
| PUT | `/admin/jobs/pending/:id/request-changes` | Request job changes |
| GET | `/admin/jobs/pending/history` | Get moderation history |

## Reported Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/jobs/reported` | Get reported jobs |
| GET | `/admin/jobs/reported/:id` | Get report details |
| PUT | `/admin/jobs/reported/:id/resolve` | Resolve report (no action) |
| PUT | `/admin/jobs/reported/:id/remove` | Remove reported job |
| PUT | `/admin/jobs/reported/:id/warn` | Warn company |
| GET | `/admin/jobs/reported/history` | Get report resolution history |

## Job Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/jobs/analytics/trends` | Get job posting trends |
| GET | `/admin/jobs/analytics/applications` | Get application rates |
| GET | `/admin/jobs/analytics/industries` | Get industry distribution |
| GET | `/admin/jobs/analytics/salaries` | Get salary range analysis |
| GET | `/admin/jobs/analytics/employers` | Get top employers |
| GET | `/admin/jobs/analytics/categories` | Get job category popularity |
| GET | `/admin/jobs/analytics/featured` | Get featured job performance |
| GET | `/admin/jobs/analytics/companies` | Get company-wise distribution |

## Job Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/jobs/categories` | Get all job categories |
| POST | `/admin/jobs/categories` | Create job category |
| GET | `/admin/jobs/categories/:id` | Get category details |
| PUT | `/admin/jobs/categories/:id` | Update category |
| DELETE | `/admin/jobs/categories/:id` | Delete category |
| GET | `/admin/jobs/categories/:id/subcategories` | Get sub-categories |
| GET | `/admin/jobs/categories/usage` | Get category usage stats |
| POST | `/admin/jobs/categories/bulk` | Bulk category operations |

---

# 📝 7. ASSESSMENT MANAGEMENT APIs

## All Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments` | Get all assessments |
| POST | `/admin/assessments` | Create assessment |
| GET | `/admin/assessments/:id` | Get assessment details |
| PUT | `/admin/assessments/:id` | Update assessment |
| DELETE | `/admin/assessments/:id` | Delete assessment |
| PUT | `/admin/assessments/:id/publish` | Publish assessment |
| PUT | `/admin/assessments/:id/unpublish` | Unpublish assessment |
| PUT | `/admin/assessments/:id/status` | Update assessment status |
| GET | `/admin/assessments/:id/sections` | Get assessment sections |
| GET | `/admin/assessments/:id/questions` | Get assessment questions |

## Create/Edit Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/assessments/:id/sections` | Add section to assessment |
| PUT | `/admin/assessments/:id/sections/:sectionId` | Update section |
| DELETE | `/admin/assessments/:id/sections/:sectionId` | Delete section |
| POST | `/admin/assessments/:id/questions` | Add question to assessment |
| PUT | `/admin/assessments/:id/questions/:questionId` | Update question |
| DELETE | `/admin/assessments/:id/questions/:questionId` | Delete question |

## Question Bank
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments/questions` | Get all questions |
| POST | `/admin/assessments/questions` | Create question |
| GET | `/admin/assessments/questions/:id` | Get question details |
| PUT | `/admin/assessments/questions/:id` | Update question |
| DELETE | `/admin/assessments/questions/:id` | Delete question |
| POST | `/admin/assessments/questions/import` | Import questions (Excel/CSV) |
| GET | `/admin/assessments/questions/export` | Export questions |
| GET | `/admin/assessments/questions/categories` | Get question categories |
| GET | `/admin/assessments/questions/search` | Search questions |

## Assessment Results
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments/results` | Get all assessment attempts |
| GET | `/admin/assessments/:id/results` | Get assessment results |
| GET | `/admin/assessments/:id/results/:attemptId` | Get attempt details |
| GET | `/admin/assessments/:id/results/statistics` | Get score distribution |
| GET | `/admin/assessments/:id/results/candidates` | Get candidate performance |
| GET | `/admin/assessments/results/export` | Export results |

## Assessment Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments/categories` | Get assessment categories |
| POST | `/admin/assessments/categories` | Create category |
| PUT | `/admin/assessments/categories/:id` | Update category |
| DELETE | `/admin/assessments/categories/:id` | Delete category |
| GET | `/admin/assessments/categories/usage` | Get category usage |

## Assessment Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assessments/certificates` | Get all certificates |
| GET | `/admin/assessments/certificates/templates` | Get certificate templates |
| POST | `/admin/assessments/certificates/templates` | Create template |
| PUT | `/admin/assessments/certificates/templates/:id` | Update template |
| DELETE | `/admin/assessments/certificates/templates/:id` | Delete template |
| GET | `/admin/assessments/certificates/issued` | Get issued certificates |
| PUT | `/admin/assessments/certificates/:id/verify` | Verify certificate |

---

# 📚 8. LEARNING MANAGEMENT APIs

## All Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/courses` | Get all courses |
| POST | `/admin/courses` | Create course |
| GET | `/admin/courses/:id` | Get course details |
| PUT | `/admin/courses/:id` | Update course |
| DELETE | `/admin/courses/:id` | Delete course |
| PUT | `/admin/courses/:id/publish` | Publish course |
| PUT | `/admin/courses/:id/unpublish` | Unpublish course |
| PUT | `/admin/courses/:id/featured` | Toggle featured status |

## Course Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/courses/:id/modules` | Add module to course |
| PUT | `/admin/courses/:id/modules/:moduleId` | Update module |
| DELETE | `/admin/courses/:id/modules/:moduleId` | Delete module |
| PUT | `/admin/courses/:id/modules/reorder` | Reorder modules |
| POST | `/admin/courses/:id/modules/:moduleId/lessons` | Add lesson |
| PUT | `/admin/courses/:id/modules/:moduleId/lessons/:lessonId` | Update lesson |
| DELETE | `/admin/courses/:id/modules/:moduleId/lessons/:lessonId` | Delete lesson |
| PUT | `/admin/courses/:id/modules/:moduleId/lessons/reorder` | Reorder lessons |
| POST | `/admin/courses/:id/modules/:moduleId/resources` | Add resource |
| DELETE | `/admin/courses/:id/modules/:moduleId/resources/:resourceId` | Delete resource |

## Course Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/courses/analytics/enrollments` | Get enrollment rates |
| GET | `/admin/courses/analytics/completion` | Get completion rates |
| GET | `/admin/courses/analytics/popular` | Get popular courses |
| GET | `/admin/courses/analytics/instructors` | Get instructor performance |
| GET | `/admin/courses/analytics/progress` | Get student progress |
| GET | `/admin/courses/analytics/engagement` | Get engagement metrics |
| GET | `/admin/courses/analytics/dropoff` | Get drop-off analysis |

## Learning Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/courses/categories` | Get learning categories |
| POST | `/admin/courses/categories` | Create category |
| PUT | `/admin/courses/categories/:id` | Update category |
| DELETE | `/admin/courses/categories/:id` | Delete category |

## Learning Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/courses/certificates` | Get learning certificates |
| GET | `/admin/courses/certificates/templates` | Get certificate templates |
| POST | `/admin/courses/certificates/templates` | Create template |
| PUT | `/admin/courses/certificates/templates/:id` | Update template |
| DELETE | `/admin/courses/certificates/templates/:id` | Delete template |
| PUT | `/admin/courses/certificates/:id/verify` | Verify certificate |

---

# 🔧 9. CATALOG MANAGEMENT APIs

## Skills Catalog
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/skills` | Get all skills |
| POST | `/admin/catalog/skills` | Create skill |
| GET | `/admin/catalog/skills/:id` | Get skill details |
| PUT | `/admin/catalog/skills/:id` | Update skill |
| DELETE | `/admin/catalog/skills/:id` | Delete skill |
| POST | `/admin/catalog/skills/import` | Import skills (Excel/CSV) |
| GET | `/admin/catalog/skills/export` | Export skills |
| GET | `/admin/catalog/skills/categories` | Get skill categories |
| GET | `/admin/catalog/skills/usage/:id` | Get skill usage statistics |

## Expertise Areas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/expertise` | Get expertise areas |
| POST | `/admin/catalog/expertise` | Create expertise |
| GET | `/admin/catalog/expertise/:id` | Get expertise details |
| PUT | `/admin/catalog/expertise/:id` | Update expertise |
| DELETE | `/admin/catalog/expertise/:id` | Delete expertise |
| GET | `/admin/catalog/expertise/categories` | Get expertise categories |
| GET | `/admin/catalog/expertise/usage/:id` | Get usage statistics |

## Industries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/industries` | Get all industries |
| POST | `/admin/catalog/industries` | Create industry |
| GET | `/admin/catalog/industries/:id` | Get industry details |
| PUT | `/admin/catalog/industries/:id` | Update industry |
| DELETE | `/admin/catalog/industries/:id` | Delete industry |
| GET | `/admin/catalog/industries/subindustries` | Get sub-industries |
| GET | `/admin/catalog/industries/usage/:id` | Get usage statistics |

## Countries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/countries` | Get all countries |
| POST | `/admin/catalog/countries` | Create country |
| GET | `/admin/catalog/countries/:code` | Get country details |
| PUT | `/admin/catalog/countries/:code` | Update country |
| DELETE | `/admin/catalog/countries/:code` | Delete country |
| PUT | `/admin/catalog/countries/:code/status` | Enable/disable country |

## Languages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/languages` | Get all languages |
| POST | `/admin/catalog/languages` | Create language |
| GET | `/admin/catalog/languages/:code` | Get language details |
| PUT | `/admin/catalog/languages/:code` | Update language |
| DELETE | `/admin/catalog/languages/:code` | Delete language |
| PUT | `/admin/catalog/languages/:code/status` | Enable/disable language |
| GET | `/admin/catalog/languages/levels` | Get proficiency levels |

## Currencies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/currencies` | Get all currencies |
| POST | `/admin/catalog/currencies` | Create currency |
| GET | `/admin/catalog/currencies/:code` | Get currency details |
| PUT | `/admin/catalog/currencies/:code` | Update currency |
| DELETE | `/admin/catalog/currencies/:code` | Delete currency |
| PUT | `/admin/catalog/currencies/:code/rate` | Update exchange rate |
| PUT | `/admin/catalog/currencies/:code/status` | Enable/disable currency |

## Job Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/job-categories` | Get job categories |
| POST | `/admin/catalog/job-categories` | Create job category |
| GET | `/admin/catalog/job-categories/:id` | Get category details |
| PUT | `/admin/catalog/job-categories/:id` | Update category |
| DELETE | `/admin/catalog/job-categories/:id` | Delete category |
| GET | `/admin/catalog/job-categories/hierarchy` | Get category hierarchy |
| GET | `/admin/catalog/job-categories/usage/:id` | Get usage statistics |

## Company Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/catalog/company-categories` | Get company categories |
| POST | `/admin/catalog/company-categories` | Create category |
| PUT | `/admin/catalog/company-categories/:id` | Update category |
| DELETE | `/admin/catalog/company-categories/:id` | Delete category |
| GET | `/admin/catalog/company-categories/sizes` | Get company size ranges |
| PUT | `/admin/catalog/company-categories/sizes/:id` | Update size range |

---

# 📧 10. TEMPLATE MANAGEMENT APIs

## Email Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/email` | Get email templates |
| POST | `/admin/templates/email` | Create email template |
| GET | `/admin/templates/email/:id` | Get template details |
| PUT | `/admin/templates/email/:id` | Update template |
| DELETE | `/admin/templates/email/:id` | Delete template |
| PUT | `/admin/templates/email/:id/default` | Set as default |
| POST | `/admin/templates/email/:id/test` | Test send email |
| GET | `/admin/templates/email/:id/preview` | Preview template |

## SMS Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/sms` | Get SMS templates |
| POST | `/admin/templates/sms` | Create SMS template |
| GET | `/admin/templates/sms/:id` | Get template details |
| PUT | `/admin/templates/sms/:id` | Update template |
| DELETE | `/admin/templates/sms/:id` | Delete template |
| PUT | `/admin/templates/sms/:id/default` | Set as default |
| POST | `/admin/templates/sms/:id/test` | Test send SMS |

## Notification Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/notification` | Get notification templates |
| POST | `/admin/templates/notification` | Create template |
| GET | `/admin/templates/notification/:id` | Get template details |
| PUT | `/admin/templates/notification/:id` | Update template |
| DELETE | `/admin/templates/notification/:id` | Delete template |
| PUT | `/admin/templates/notification/:id/default` | Set as default |

## CV Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/cv` | Get CV templates |
| POST | `/admin/templates/cv` | Upload CV template |
| GET | `/admin/templates/cv/:id` | Get template details |
| PUT | `/admin/templates/cv/:id` | Update template |
| DELETE | `/admin/templates/cv/:id` | Delete template |
| PUT | `/admin/templates/cv/:id/default` | Set as default |
| PUT | `/admin/templates/cv/:id/premium` | Toggle premium status |
| GET | `/admin/templates/cv/:id/preview` | Preview template |

## Certificate Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/certificate` | Get certificate templates |
| POST | `/admin/templates/certificate` | Create template |
| GET | `/admin/templates/certificate/:id` | Get template details |
| PUT | `/admin/templates/certificate/:id` | Update template |
| DELETE | `/admin/templates/certificate/:id` | Delete template |
| PUT | `/admin/templates/certificate/:id/default` | Set as default |
| GET | `/admin/templates/certificate/:id/preview` | Preview template |

## Job Post Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/templates/job` | Get job post templates |
| POST | `/admin/templates/job` | Create job template |
| GET | `/admin/templates/job/:id` | Get template details |
| PUT | `/admin/templates/job/:id` | Update template |
| DELETE | `/admin/templates/job/:id` | Delete template |
| PUT | `/admin/templates/job/:id/default` | Set as default |

---

# 💳 11. PAYMENT MANAGEMENT APIs

## Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/payments/transactions` | Get all transactions |
| GET | `/admin/payments/transactions/:id` | Get transaction details |
| GET | `/admin/payments/transactions/export` | Export transactions |
| GET | `/admin/payments/transactions/statistics` | Get transaction statistics |
| POST | `/admin/payments/transactions/:id/refund` | Initiate refund |
| PUT | `/admin/payments/transactions/:id/status` | Update transaction status |

## Payment Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/payments/orders` | Get payment orders |
| GET | `/admin/payments/orders/:id` | Get order details |
| GET | `/admin/payments/orders/failed` | Get failed orders |
| POST | `/admin/payments/orders/:id/retry` | Retry failed payment |
| GET | `/admin/payments/orders/statistics` | Get order statistics |

## Refunds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/payments/refunds` | Get all refunds |
| GET | `/admin/payments/refunds/pending` | Get pending refunds |
| GET | `/admin/payments/refunds/:id` | Get refund details |
| PUT | `/admin/payments/refunds/:id/process` | Process refund |
| PUT | `/admin/payments/refunds/:id/reject` | Reject refund |
| GET | `/admin/payments/refunds/history` | Get refund history |
| GET | `/admin/payments/refunds/analytics` | Get refund analytics |

## Webhook Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/payments/webhooks` | Get
