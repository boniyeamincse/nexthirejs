# 👑 SUPERADMIN — Complete Menu & Sub-Menu Structure

## Mandatory Roles (4)
1. **CANDIDATE** — Job seekers, learners, career builders
2. **EXPERT** — Trainers, mentors, interview coaches
3. **COMPANY** — Organizations hiring talent
4. **SUPER_ADMIN** — Platform administrators

*Note: SuperAdmin can create additional custom roles (COMPANY_ADMIN, RECRUITER, SUPPORT_AGENT, FINANCE_ADMIN, CONTENT_MODERATOR, etc.)*

---

# 📊 1. DASHBOARD

## Overview
**Route:** `/admin`

### Sub-Menu Items:
- **Platform Overview** → `/admin`
  - KPI Cards
    - Total Users (Candidates/Experts/Companies)
    - Active Users (Last 30 Days)
    - Total Revenue (This Month)
    - Pending Verifications (Experts/Companies)
    - Active Jobs
    - Platform Health Status
  - Quick Stats Widgets
  - Recent Activity Feed
  - System Alerts & Notifications
  - Quick Action Buttons

- **Growth Analytics** → `/admin/analytics/growth`
  - User Growth (Daily/Weekly/Monthly)
  - Platform Adoption Rate
  - Role-wise Distribution
    - Candidates
    - Experts
    - Companies
  - Country-wise User Distribution
  - Monthly Active Users (MAU) Trends
  - User Retention Analysis
  - Registration Funnel

- **Revenue Analytics** → `/admin/analytics/revenue`
  - Revenue Trends (Daily/Weekly/Monthly)
  - Payment Success/Failure Rate
  - Commission Collection Summary
  - Refund Analytics
  - Revenue by Service Type
  - Revenue by Country
  - Revenue by Company (Job Postings)
  - Revenue by Expert (Sessions)

- **Performance Monitoring** → `/admin/analytics/performance`
  - API Response Times (p95, p99)
  - Queue Processing Status
  - Error Rates by Endpoint
  - System Load & Resource Usage
  - Database Performance
  - Cache Hit/Miss Ratio
  - Service Uptime

---

# 👥 2. USER MANAGEMENT

## All Users
**Route:** `/admin/users`

### Sub-Menu Items:
- **User List** → `/admin/users`
  - Advanced Search & Filter
    - By Role (Candidate/Expert/Company/Custom)
    - By Status (Active/Suspended/Inactive)
    - By Verification Status
    - By Country
    - By Registration Date
  - User Table with Pagination
  - Bulk Actions (Suspend/Activate/Delete)
  - Export Users (CSV/Excel/PDF)
  - User Status Management

- **User Detail** → `/admin/users/[id]`
  - Complete User Profile
  - Account Information
  - Role Assignment
  - Account Status
  - Activity History
  - Security Events Log
  - Login History (IP, Device, Location)
  - Actions:
    - Suspend/Activate User
    - Change Password (Admin)
    - Force Logout
    - Delete User (with reason)
  - Audit Trail

- **Suspended Accounts** → `/admin/users/suspended`
  - All Suspended Users List
  - Suspension Reason
  - Suspension Date & Duration
  - Suspended By (Admin)
  - Activate User
  - Suspension History

- **Account Verification** → `/admin/users/verification`
  - Pending Verifications
  - Verified Accounts
  - Rejected Accounts
  - Verify/Reject Actions
  - Verification History

---

## Roles & Permissions
**Route:** `/admin/roles`

### Sub-Menu Items:
- **Role List** → `/admin/roles`
  - All System Roles
  - Default Roles (Candidate, Expert, Company, SuperAdmin)
  - Custom Roles (Created by SuperAdmin)
    - COMPANY_ADMIN
    - COMPANY_RECRUITER
    - COMPANY_INTERVIEWER
    - COMPANY_VIEWER
    - SUPPORT_AGENT
    - FINANCE_ADMIN
    - CONTENT_MODERATOR
  - Create New Role
    - Role Name
    - Role Description
    - Select Permissions
    - Assign Users (Optional)
  - Edit Role
  - Delete Role (with user reassignment)
  - Role Usage Statistics

- **Permission Management** → `/admin/permissions`
  - All System Permissions
  - Permission Groups
    - User Management
    - Content Management
    - Finance Operations
    - System Settings
    - Security & Audit
    - Moderation
    - Company Management
    - Expert Management
    - Candidate Management
  - Create Custom Permission
  - Assign Permission to Role
  - Permission Matrix View

- **User Role Assignment** → `/admin/users/roles`
  - Assign Role to User
  - Remove Role from User
  - Bulk Role Assignment
  - Role Change History
  - User Role Audit

---

# 🎓 3. CANDIDATE MANAGEMENT

## All Candidates
**Route:** `/admin/candidates`

### Sub-Menu Items:
- **Candidate List** → `/admin/candidates`
  - Search & Filter
    - By Name/Email
    - By Country
    - By Career Level
    - By Readiness Level
    - By Skill
    - By Status
  - Candidate Cards/Table
  - Profile Completion Status
  - Career Readiness Score
  - Activity Status (Active/Inactive)
  - Bulk Actions

- **Candidate Detail** → `/admin/candidates/[id]`
  - Full Profile Information
  - Career Passport View
  - CV History & Versions
  - Project Portfolio
  - Assessment Results
  - Session History (Expert Sessions)
  - Application History (Jobs Applied)
  - Career Progress Timeline
  - Privacy Settings Audit
  - Account Actions:
    - Suspend/Activate
    - Force Profile Update
    - Delete Account

- **Skill Verification** → `/admin/candidates/skills`
  - Pending Skill Verifications
  - Verify Skills (Admin/Expert)
  - Reject Verification (with reason)
  - Verification History
  - Verified Skills Summary

- **Readiness Levels** → `/admin/candidates/readiness`
  - Distribution by Readiness Level
    - Getting Started
    - Learning
    - Developing
    - Interview Ready
    - Job Ready
    - Industry Ready
    - Top Talent
  - Career Progress Tracking
  - Skill Gap Analysis
  - Job Readiness Reports

- **Candidate Reports** → `/admin/candidates/reports`
  - Registration Trends
  - Profile Completion Analytics
  - Readiness Improvement
  - Country-wise Distribution
  - Skill Distribution
  - Export Reports

---

# 🎯 4. EXPERT MANAGEMENT

## All Experts
**Route:** `/admin/experts`

### Sub-Menu Items:
- **Expert List** → `/admin/experts`
  - Search & Filter
    - By Name/Email
    - By Expertise
    - By Country
    - By Verification Status
    - By Rating
    - By Activity Status
  - Expert Cards/Table
  - Performance Metrics
  - Earnings Summary
  - Rating & Reviews
  - Bulk Actions

- **Expert Detail** → `/admin/experts/[id]`
  - Complete Profile
  - Verification Documents (View)
  - Services & Pricing
  - Availability & Schedule
  - Bookings History
  - Earnings & Payouts
  - Reviews & Ratings
  - Complaints & Disputes
  - Session History
  - Account Actions:
    - Suspend/Activate
    - Force Profile Update
    - Delete Account

- **Verification Queue** → `/admin/experts/verification`
  - Pending Applications
    - Expert Name
    - Submitted Documents
    - Submission Date
    - Urgency Status
  - Review Documents
    - Identity Documents
    - Professional Evidence
    - Certifications
  - Actions:
    - Approve (with approval note)
    - Reject (with reason)
    - Request Changes (with specific feedback)
  - Verification History
  - Re-verification Queue

- **Performance Metrics** → `/admin/experts/performance`
  - Top Performing Experts
  - Booking Conversion Rate
  - Rating Trends
  - Earnings Leaderboard
  - Service Performance
  - No-Show Rates
  - Completion Rates

- **Expert Complaints** → `/admin/experts/complaints`
  - All Complaints List
  - Complaint Detail
    - Complainant Info
    - Description
    - Evidence
  - Resolution Actions
    - Investigation
    - Warning/Notice
    - Suspension
    - Resolution
  - Complaint History

- **Expert Reports** → `/admin/experts/reports`
  - Registration Trends
  - Verification Success Rate
  - Booking Analytics
  - Earnings Analytics
  - Service Popularity
  - Country-wise Distribution

---

# 🏢 5. COMPANY MANAGEMENT

## All Companies
**Route:** `/admin/companies`

### Sub-Menu Items:
- **Company List** → `/admin/companies`
  - Search & Filter
    - By Name/Email
    - By Industry
    - By Country
    - By Verification Status
    - By Subscription Status
  - Company Cards/Table
  - Job Activity Status
  - Team Size
  - Bulk Actions

- **Company Detail** → `/admin/companies/[id]`
  - Complete Profile
  - Verification Documents (View)
  - Team Members Management
  - Job Posts History
  - Hiring Activity
  - Candidate Search History
  - Subscription Status
  - Account Actions:
    - Suspend/Activate
    - Force Profile Update
    - Delete Account

- **Verification Queue** → `/admin/companies/verification`
  - Pending Applications
    - Company Name
    - Legal Documents
    - Registration Number
    - Submission Date
  - Review Documents
    - Business Registration
    - Tax Documents
    - Additional Verification
  - Actions:
    - Approve (with approval note)
    - Reject (with reason)
    - Request Changes
  - Verification History

- **Subscription Management** → `/admin/companies/subscriptions`
  - All Subscriptions
  - Active Subscriptions
  - Expired/Expiring Subscriptions
  - Subscription Plans
    - Free Trial
    - Starter
    - Growth
    - Enterprise
  - Manage Plan Limits
    - Max Jobs
    - Max Team Members
    - Max Candidate Views
    - Feature Access
  - Upgrade/Downgrade
  - Subscription History

- **Company Team Management** → `/admin/companies/team`
  - All Company Members
  - Role Management
    - COMPANY_ADMIN
    - COMPANY_RECRUITER
    - COMPANY_INTERVIEWER
    - COMPANY_VIEWER
  - Member Activity
  - Permission Audit
  - Bulk Actions

- **Company Activity** → `/admin/companies/activity`
  - Job Posting Analytics
  - Candidate Search Activity
  - Hiring Funnel Analytics
  - Interview Scheduling
  - Offer Management
  - Company Performance Reports

---

# 💼 6. JOB MANAGEMENT

## All Jobs
**Route:** `/admin/jobs`

### Sub-Menu Items:
- **Job List** → `/admin/jobs`
  - Search & Filter
    - By Title
    - By Company
    - By Category
    - By Location
    - By Status (Draft/Pending/Published/Closed/Archived)
    - By Date Range
  - Job Cards/Table
  - Application Count
  - Featured Status
  - Bulk Actions

- **Job Detail** → `/admin/jobs/[id]`
  - Complete Job Post
  - Company Information
  - Application List
  - Status Management
  - Featured Status Toggle
  - Edit/Update Job
  - Delete Job

- **Moderation Queue** → `/admin/jobs/pending`
  - Pending Reviews
    - Job Title
    - Company
    - Submitted Date
    - Priority
  - Review Content
    - Job Description
    - Requirements
    - Salary Range
    - Company Details
  - Actions:
    - Approve (with approval note)
    - Reject (with reason)
    - Request Changes
  - Moderation History

- **Reported Jobs** → `/admin/jobs/reported`
  - All Reports List
  - Report Detail
    - Reporter Info
    - Report Reason
    - Description
  - Review Content
  - Actions:
    - Close Report (No Action)
    - Remove Job (Policy Violation)
    - Warn Company
  - Report Resolution History

- **Job Analytics** → `/admin/jobs/analytics`
  - Job Posting Trends
  - Application Rates
  - Industry Distribution
  - Salary Range Analysis
  - Top Employers
  - Job Category Popularity
  - Featured Job Performance
  - Company-wise Job Distribution

- **Job Categories** → `/admin/jobs/categories`
  - Manage Categories
    - Add/Edit/Delete
    - Category Name
    - Category Description
    - Slug
  - Sub-Categories
  - Industry Mapping
  - Category Usage Stats
  - Bulk Operations

---

# 📝 7. ASSESSMENT MANAGEMENT

## All Assessments
**Route:** `/admin/assessments`

### Sub-Menu Items:
- **Assessment List** → `/admin/assessments`
  - Search & Filter
    - By Name
    - By Category
    - By Difficulty
    - By Status (Draft/Published/Archived)
  - Assessment Cards/Table
  - Attempt Count
  - Average Score
  - Bulk Actions

- **Assessment Detail** → `/admin/assessments/[id]`
  - Assessment Information
  - Sections Management
  - Questions Management
  - Settings:
    - Duration
    - Attempt Limit
    - Passing Score
    - Randomization
  - Status Management
  - Publish/Unpublish
  - Edit/Delete

- **Create/Edit Assessment** → `/admin/assessments/create`
  - Basic Information
    - Title
    - Description
    - Category
    - Difficulty Level
  - Sections
    - Add/Edit/Delete Sections
    - Section Name
    - Section Description
  - Questions Assignment
    - Select from Question Bank
    - Create New Questions
  - Settings
    - Duration (Minutes)
    - Attempt Limit
    - Passing Score
    - Question Randomization
    - Timed Mode
  - Publish Options

- **Question Bank** → `/admin/assessments/questions`
  - All Questions
  - Create/Edit/Delete Questions
    - Question Text
    - Question Type (MCQ/True-False/Multiple Select/Written)
    - Answer Options
    - Correct Answer
    - Explanation
    - Category
    - Difficulty Level
    - Tags
  - Bulk Import/Export (Excel/CSV)
  - Question Search
  - Question Filter

- **Assessment Results** → `/admin/assessments/results`
  - All Attempts
  - Candidate Scores
  - Pass/Fail Distribution
  - Score Distribution Charts
  - Detailed Reports
  - Export Results
  - Candidate Performance

- **Assessment Categories** → `/admin/assessments/categories`
  - Manage Categories
    - Add/Edit/Delete
    - Category Name
    - Description
  - Skills Mapping
  - Industry Relevance
  - Category Usage

- **Assessment Certificates** → `/admin/assessments/certificates`
  - Certificate Templates
    - Create/Edit/Delete
    - Template Design
  - Issued Certificates
    - All Issued
    - Verification Status
  - Certificate Verification

---

# 📚 8. LEARNING MANAGEMENT

## All Courses
**Route:** `/admin/courses`

### Sub-Menu Items:
- **Course List** → `/admin/courses`
  - Search & Filter
    - By Name
    - By Category
    - By Instructor
    - By Difficulty
    - By Status
  - Course Cards/Table
  - Enrollment Count
  - Completion Rate
  - Bulk Actions

- **Course Detail** → `/admin/courses/[id]`
  - Course Information
  - Modules & Lessons
  - Instructor Info
  - Enrollments
  - Progress Reports
  - Status Management
  - Edit/Delete

- **Create/Edit Course** → `/admin/courses/create`
  - Basic Information
    - Title
    - Description
    - Category
    - Difficulty Level
    - Estimated Duration
    - Language
  - Course Content
    - Modules
    - Lessons
      - Video/Article Content
      - Resources
      - Quizzes
      - Assignments
    - Module Order
  - Prerequisites
  - Pricing (Free/Paid)
  - Thumbnail/Preview
  - Publish Options

- **Course Content Management** → `/admin/courses/content`
  - Module Management
    - Add/Edit/Delete Modules
    - Module Order
  - Lesson Management
    - Add/Edit/Delete Lessons
    - Lesson Type (Video/Article/Quiz/Assignment)
    - Lesson Content
    - Lesson Order
  - Resource Management
    - Upload/Delete Resources
    - Resource Type (PDF/Video/Audio/Document)
  - Content Editor

- **Course Analytics** → `/admin/courses/analytics`
  - Enrollment Rates
  - Course Completion Rates
  - Popular Courses
  - Instructor Performance
  - Student Progress
  - Engagement Metrics
  - Drop-off Analysis

- **Learning Categories** → `/admin/courses/categories`
  - Manage Categories
    - Add/Edit/Delete
    - Category Name
    - Description
  - Sub-Categories
  - Category Usage

- **Learning Certificates** → `/admin/courses/certificates`
  - Certificate Templates
  - Issued Certificates
  - Certificate Verification

---

# 🔧 9. CATALOG MANAGEMENT

## Master Catalog
**Route:** `/admin/catalog`

### Sub-Menu Items:
- **Skills Catalog** → `/admin/catalog/skills`
  - All Skills
  - Add/Edit/Delete Skills
    - Skill Name
    - Category
    - Description
    - Tags
  - Bulk Import/Export
  - Skill Categories
  - Skill Usage Statistics
  - Verification Status

- **Expertise Areas** → `/admin/catalog/expertise`
  - All Expertise Areas
  - Add/Edit/Delete
    - Name
    - Category
    - Description
  - Expertise Categories
  - Service Mapping
  - Usage Statistics

- **Industries** → `/admin/catalog/industries`
  - All Industries
  - Add/Edit/Delete
    - Name
    - Slug
    - Description
  - Sub-Industries
  - Job Mapping
  - Company Mapping
  - Usage Statistics

- **Countries** → `/admin/catalog/countries`
  - All Countries
  - Add/Edit/Delete
    - Country Name
    - Country Code
    - Phone Code
    - Currency
    - Currency Symbol
    - Timezone
  - Enable/Disable Country
  - Country Settings

- **Languages** → `/admin/catalog/languages`
  - All Languages
  - Add/Edit/Delete
    - Language Name
    - Language Code
    - Native Name
    - RTL Support
  - Proficiency Levels
  - Enable/Disable Language

- **Currencies** → `/admin/catalog/currencies`
  - All Currencies
  - Add/Edit/Delete
    - Currency Name
    - Currency Code
    - Symbol
    - Decimal Places
    - Exchange Rate
  - Currency Settings
  - Enable/Disable Currency

- **Job Categories** → `/admin/catalog/job-categories`
  - All Categories
  - Add/Edit/Delete
    - Category Name
    - Slug
    - Description
    - Parent Category
  - Category Hierarchy
  - Industry Mapping
  - Usage Statistics

- **Company Categories** → `/admin/catalog/company-categories`
  - Company Size Ranges
  - Company Types
  - Industry Sectors
  - Add/Edit/Delete

---

# 📧 10. TEMPLATE MANAGEMENT

## All Templates
**Route:** `/admin/templates`

### Sub-Menu Items:
- **Email Templates** → `/admin/templates/email`
  - All Email Templates
  - Create/Edit/Delete
    - Template Name
    - Template Slug
    - Subject
    - Content (HTML/Text)
    - Variables Helper
    - Preview
    - Test Send
    - Default Template Setting

- **SMS Templates** → `/admin/templates/sms`
  - All SMS Templates
  - Create/Edit/Delete
    - Template Name
    - Template Slug
    - Content
    - Variables Helper
    - Test Send
    - Default Template Setting

- **Notification Templates** → `/admin/templates/notification`
  - All Notification Templates
  - Create/Edit/Delete
    - Template Name
    - Template Slug
    - Title
    - Content
    - Variables Helper
    - Preview
    - Default Template Setting

- **CV Templates** → `/admin/templates/cv`
  - All CV Templates
  - Upload/Edit/Delete
    - Template Name
    - Template Type (Professional/Modern/Creative/ATS-Friendly)
    - Preview Image
    - Template File (HTML/CSS)
  - Set Default
  - Premium/Free Toggle
  - Preview
  - Template Categories

- **Certificate Templates** → `/admin/templates/certificate`
  - All Certificate Templates
  - Create/Edit/Delete
    - Template Name
    - Template Design
    - Preview
    - Variables Helper
  - Set Default
  - Download Template

- **Job Post Templates** → `/admin/templates/job`
  - All Job Post Templates
  - Create/Edit/Delete
    - Template Name
    - Template Content
    - Variables Helper
  - Set Default
  - Preview

---

# 💳 11. PAYMENT MANAGEMENT

## All Payments
**Route:** `/admin/payments`

### Sub-Menu Items:
- **Transactions** → `/admin/payments/transactions`
  - All Transactions
  - Search & Filter
    - By User (Candidate/Expert/Company)
    - By Date Range
    - By Gateway
    - By Status
    - By Type
  - Transaction List
  - Transaction Detail
    - Amount
    - Currency
    - Gateway
    - Status
    - User Info
  - Export Reports (CSV/Excel/PDF)

- **Payment Orders** → `/admin/payments/orders`
  - All Orders
  - Search & Filter
    - By User
    - By Date
    - By Type (Booking/Course/Subscription/Featured Job)
    - By Status
  - Order Detail
    - Order Items
    - Payment Status
    - User Details
    - Tracking
  - Failure Analysis
  - Retry Payment (Manual)

- **Refunds** → `/admin/payments/refunds`
  - Refund List
  - Search & Filter
    - By User
    - By Order
    - By Status
    - By Date
  - Refund Detail
    - Amount
    - Reason
    - Order Details
  - Process Refund
    - Full Refund
    - Partial Refund
    - Refund Reason
  - Reject Refund (with reason)
  - Refund History
  - Refund Analytics

- **Webhook Logs** → `/admin/payments/webhooks`
  - All Webhook Events
  - Search & Filter
    - By Date
    - By Gateway
    - By Event Type
    - By Status (Success/Failed)
  - Webhook Detail
    - Request Payload
    - Response
    - Processing Time
  - Failed Webhooks
    - Error Details
    - Retry Processing
  - Webhook Simulation
    - Test Gateway Integration
    - Simulate Events

- **Payment Gateway Settings** → `/admin/payments/gateways`
  - Gateway List
  - Configure Gateway
    - Bangladesh Gateways
      - aamarpay
      - bKash
      - Nagad
      - Rocket
    - Pakistan Gateways
      - JazzCash
      - Easypaisa
      - HBL
    - India Gateways
      - Razorpay
      - Paytm
      - PhonePe
    - International
      - Stripe
      - PayPal
      - 2Checkout
  - Gateway Status
    - Enable/Disable
    - Sandbox/Live Mode
  - Credentials Management
  - Gateway Priority
  - Test Connection
  - Transaction Fee Settings

---

# 💰 12. FINANCE OPERATIONS

## Finance Management
**Route:** `/admin/finance`

### Sub-Menu Items:
- **Commission Settings** → `/admin/finance/commission`
  - Platform Commission
    - Default Rate (%)
    - Service Type Rates
    - Country-Specific Rates
    - Expert Commission
    - Company Commission (Job Posting)
  - Payment Gateway Fee
    - Fee Structure
    - Country-Specific
  - Tax Settings
    - VAT/GST Rate
    - Country-Specific Tax
    - Tax Exemptions
  - Commission Rules
    - Booking Commission
    - Course Commission
    - Assessment Commission
    - Subscription Commission
    - Featured Job Commission
  - Special Cases
    - Promotional Rates
    - Volume Discounts
  - Commission History

- **Payout Management** → `/admin/finance/payouts`
  - Payout Requests
    - All Requests
    - Filter by Status
    - Filter by Expert
  - Payout Detail
    - Expert Info
    - Amount
    - Account Details
    - Request Date
  - Process Payout
    - Approve/Reject
    - Add Notes
    - Batch Processing
  - Batch Payout
    - Select Payouts
    - Process Together
    - Mark Paid
  - Failed Payouts
    - Error Details
    - Retry Payout
  - Payout History

- **Earnings Management** → `/admin/finance/earnings`
  - All Earnings
  - Expert Earnings
    - Available Balance
    - Pending Balance
    - Total Earned
  - Company Earnings (Revenue from Jobs)
    - Total Revenue
    - Pending Payments
  - Withheld Amounts
    - Dispute Holds
    - Refund Holds
  - Detailed Reports
    - By Expert
    - By Company
    - By Service
    - By Date
  - Manual Adjustments
    - Add Earnings
    - Remove Earnings
    - Reason Recording

- **Reconciliation** → `/admin/finance/reconciliation`
  - Payment vs Booking
    - Verify Payments
    - Missing Payments
    - Overpayments
  - Commission Collection
    - Calculated vs Collected
    - Discrepancies
  - Company Revenue Reconciliation
    - Job Posting Payments
    - Featured Job Payments
    - Subscription Payments
  - Discrepancy Reports
    - By Date
    - By Expert
    - By Company
    - By Gateway
  - Manual Adjustments
    - Approve/Reject
    - Audit Trail

- **Financial Reports** → `/admin/finance/reports`
  - Revenue Reports
    - Daily/Weekly/Monthly
    - By Service Type
    - By Country
    - By Company
    - By Expert
  - Commission Reports
    - By Expert
    - By Service
  - Payout Reports
    - By Date
    - By Expert
    - By Gateway
  - Tax Reports
    - VAT/GST Collected
    - Tax Paid
  - Export Reports
    - PDF/Excel/CSV

---

# 📄 13. INVOICE MANAGEMENT

## All Invoices
**Route:** `/admin/invoices`

### Sub-Menu Items:
- **Invoice List** → `/admin/invoices`
  - All Invoices
  - Search & Filter
    - By User (Candidate/Expert/Company)
    - By Date
    - By Status
  - Invoice Detail
    - Recipient Info
    - Items
    - Total Amount
    - Status
  - Generate Invoice
    - Select Order
    - Manual Invoice
  - Resend Invoice
  - Download Invoice
  - Invoice History

- **Invoice Settings** → `/admin/invoices/settings`
  - Invoice Number Format
    - Prefix
    - Sequence
    - Suffix
  - Company Details
    - Company Name
    - Address
    - VAT/Tax Number
    - Contact Info
  - Tax Information
    - VAT/GST Rate
    - Tax ID
  - Logo Upload
  - Invoice Terms & Conditions

---

# 🔐 14. SECURITY & AUDIT

## Security Management
**Route:** `/admin/security`

### Sub-Menu Items:
- **Security Overview** → `/admin/security`
  - Security Score
  - Recent Threats
  - Alerts Summary
  - Active Sessions
  - Login Anomalies
  - Failed Login Attempts
  - Security Breach Alerts

- **User Sessions** → `/admin/security/sessions`
  - All Active Sessions
  - Search & Filter
    - By User
    - By Device
    - By IP
    - By Date
  - Session Detail
    - User Info
    - Device Info
    - IP Address
    - Location
    - Login Time
    - Last Activity
  - Session Revocation
    - Individual
    - Bulk Actions
    - Force Logout

- **IP Management** → `/admin/security/ip`
  - Blocked IPs
    - Add IP to Blocklist
    - Remove from Blocklist
    - Block Reason
    - Block Duration
  - IP Whitelist
    - Add IP to Whitelist
    - Remove from Whitelist
  - Rate Limit Rules
    - Login Attempts
    - API Requests
    - Per User/Per IP
  - Suspicious IPs
    - Detection
    - Auto-block Rules

- **MFA Management** → `/admin/security/mfa`
  - MFA Status Report
    - Users with MFA
    - Users without MFA
  - Enforce MFA
    - By Role
    - By User
  - Recovery Code Management
    - Reset Recovery Codes
    - Generate New Codes
  - Trusted Device Management
    - View Devices
    - Revoke Trust

- **Security Settings** → `/admin/security/settings`
  - Password Policy
    - Minimum Length
    - Special Characters
    - Expiry Days
    - History Count
  - Session Settings
    - Session Timeout
    - Concurrent Sessions
    - Remember Me Duration
  - Login Settings
    - Max Attempts
    - Lockout Duration
    - Captcha Requirement
  - Security Headers
    - HSTS
    - CSP
    - X-Frame-Options
  - API Security
    - Rate Limiting
    - CORS Settings

---

# 📋 15. AUDIT LOGS

## Audit Management
**Route:** `/admin/audit`

### Sub-Menu Items:
- **All Logs** → `/admin/audit/logs`
  - Log List
  - Advanced Search
    - By User
    - By Action
    - By Resource
    - By Date Range
    - By IP Address
  - Log Detail
    - User Information
    - Action Description
    - Resource Details
    - Metadata
    - IP & Location
    - Timestamp
  - Export Logs
    - CSV/Excel/PDF
    - Date Range Selection
  - Real-time Filtering

- **User Activity** → `/admin/audit/users`
  - Per User Activity
  - Login History
    - Successful Logins
    - Failed Logins
  - Resource Access
    - Viewed/Edited/Deleted
  - Permission Changes
  - Account Actions
  - Session Tracking

- **Security Events** → `/admin/audit/security`
  - Failed Login Attempts
  - Suspicious Activity
    - Multiple Failures
    - Unusual Locations
    - Unusual Times
  - Permission Changes
    - Role Changes
    - Permission Updates
  - Account Lockouts
  - Password Changes
  - MFA Events

- **Admin Actions** → `/admin/audit/admins`
  - All Admin Activities
  - Sensitive Actions
    - User Management
    - Role Changes
    - Financial Operations
    - System Configuration
  - Configuration Changes
    - Settings Updates
    - Feature Toggles
  - Export Audit Trail

---

# 🎫 16. SUPPORT MANAGEMENT

## Support Tickets
**Route:** `/admin/support`

### Sub-Menu Items:
- **All Tickets** → `/admin/support/tickets`
  - Ticket List
  - Search & Filter
    - By User (Candidate/Expert/Company)
    - By Category
    - By Priority
    - By Status
    - By Date
  - Priority Management
    - Low/Medium/High/Urgent
  - Assignment
    - Auto-assign Rules
    - Manual Assignment
  - Status Management
    - Open
    - In Progress
    - Resolved
    - Closed
    - On Hold

- **Ticket Detail** → `/admin/support/tickets/[id]`
  - Ticket Information
    - Subject
    - Description
    - Category
    - Priority
    - Status
  - User Info
    - User Details
    - Contact Info
    - User Role
  - Conversation View
    - Messages
    - Replies
    - Attachments
    - Timeline
  - Internal Notes
  - Actions
    - Assign Agent
    - Change Priority
    - Change Status
    - Add Note
    - Reply to User
    - Close Ticket
  - Resolution Details

- **Pending Tickets** → `/admin/support/pending`
  - Unassigned Tickets
  - High Priority Queue
  - Response SLA Breaches
  - Overdue Tickets

- **Support Categories** → `/admin/support/categories`
  - Manage Categories
    - Add/Edit/Delete
    - Category Name
    - Description
  - SLA Settings
    - First Response Time
    - Resolution Time
  - Assignment Rules
    - Agent Specialization
    - Auto-assignment

- **Support Analytics** → `/admin/support/analytics`
  - Ticket Volume Trends
  - Response Time
  - Resolution Time
  - Customer Satisfaction
  - Agent Performance
  - Category Distribution
  - User Type Distribution

---

# 🛡️ 17. CONTENT MODERATION

## Moderation Center
**Route:** `/admin/moderation`

### Sub-Menu Items:
- **Moderation Overview** → `/admin/moderation`
  - Queue Summary
    - Pending Count
    - Priority Items
    - Aging Items
  - Recent Actions
  - Reported Content Summary
  - Moderation Statistics

- **Reported Profiles** → `/admin/moderation/profiles`
  - Candidate Profiles
    - Reports List
    - Report Detail
    - Content Review
    - Actions:
      - Approve
      - Request Changes
      - Remove
      - Warn User
  - Expert Profiles
    - Reports List
    - Content Review
    - Actions
  - Company Profiles
    - Reports List
    - Content Review
    - Actions
  - Resolve Reports

- **Reported Projects** → `/admin/moderation/projects`
  - All Reports
  - Project Content Review
    - Description
    - Code Repo
    - Media
  - Actions:
    - Approve
    - Request Changes
    - Remove
    - Verify/Unverify
  - Resolve Reports
  - Report History

- **Reported Jobs** → `/admin/moderation/jobs`
  - All Reports
  - Job Content Review
    - Description
    - Requirements
    - Salary
  - Actions:
    - Approve
    - Request Changes
    - Remove
    - Warn Company
  - Resolve Reports

- **Reported Reviews** → `/admin/moderation/reviews`
  - All Reports
  - Review Content Review
    - Rating
    - Content
  - Actions:
    - Keep Review
    - Remove Review
    - Warn User
  - Resolve Reports

- **Reported Messages** → `/admin/moderation/messages`
  - All Reports
  - Message Content Review
    - Text
    - Attachments
  - Actions:
    - Remove Message
    - Warn User
    - Block User
  - Resolve Reports

- **Appeals** → `/admin/moderation/appeals`
  - Appeal Requests
    - User Info
    - Content Info
    - Appeal Reason
  - Review Appeal
    - Evidence
    - Context
  - Decision
    - Accept Appeal
    - Reject Appeal
    - Modify Decision
  - Communicate Decision
  - Appeal History

---

# ⚠️ 18. COMPLAINTS MANAGEMENT

## All Complaints
**Route:** `/admin/complaints`

### Sub-Menu Items:
- **All Complaints** → `/admin/complaints`
  - Complaint List
  - Search & Filter
    - By User (Candidate/Expert/Company)
    - By Type
    - By Priority
    - By Status
    - By Date
  - Complaint Detail
    - Complainant Info
    - Subject
    - Description
    - Evidence
  - Priority Assignment
    - Low/Medium/High/Critical
  - Status Management
    - Open
    - Under Investigation
    - Resolved
    - Closed

- **Complaint Resolution** → `/admin/complaints/[id]`
  - Investigation
    - Evidence Review
    - User Statements
  - Actions:
    - Add Internal Notes
    - Assign Investigator
    - Request Additional Info
    - Resolve Complaint
    - Close Complaint
  - Resolution Types
    - No Violation
    - Warning Issued
    - Account Suspension
    - Account Termination
    - Financial Adjustment
  - Resolution History

- **Complaint Categories** → `/admin/complaints/categories`
  - Manage Categories
    - Add/Edit/Delete
    - Category Name
    - Description
  - Escalation Rules
    - Auto-escalation
    - Priority Mapping

---

# 📈 19. REPORTS & ANALYTICS

## Reports Center
**Route:** `/admin/reports`

### Sub-Menu Items:
- **General Reports** → `/admin/reports/general`
  - Platform Overview
    - Total Users
    - Active Users
    - User Growth
    - Engagement Metrics
  - Custom Date Range
    - Daily/Weekly/Monthly/Yearly
    - Custom Range
  - Export Reports
    - PDF/Excel/CSV
    - Scheduled Reports

- **User Reports** → `/admin/reports/users`
  - Registration Trends
    - By Date
    - By Country
    - By Role
  - User Demographics
    - Age Distribution
    - Location Distribution
    - Language Distribution
  - User Activity
    - Logins
    - Engagement
    - Retention
  - Retention Analysis
    - Cohort Analysis
    - Churn Rate

- **Financial Reports** → `/admin/reports/finance`
  - Revenue Reports
    - Total Revenue
    - Revenue by Source (Bookings/Courses/Subscriptions/Featured Jobs)
    - Revenue by Country
  - Commission Reports
    - Platform Commission
    - Expert Commission
    - Gateway Fees
  - Payout Reports
    - Total Payouts
    - Payout by Expert
    - Payout by Gateway
  - Tax Reports
    - Tax Collected
    - Tax Paid
  - Profit & Loss
  - Cash Flow

- **Performance Reports** → `/admin/reports/performance`
  - Platform Performance
    - API Response Times
    - Uptime
    - Error Rates
  - Expert Performance
    - Top Experts
    - Booking Rates
    - Earnings
  - Company Performance
    - Top Companies
    - Job Posting Activity
    - Hiring Success
  - Candidate Success
    - Profile Completion
    - Job Applications
    - Hires

- **Custom Reports** → `/admin/reports/custom`
  - Build Custom Reports
    - Select Metrics
    - Select Dimensions
    - Filters
  - Saved Reports
  - Scheduled Reports
    - Daily/Weekly/Monthly
    - Email Delivery

---

# ⚙️ 20. PLATFORM SETTINGS

## System Configuration
**Route:** `/admin/settings`

### Sub-Menu Items:
- **General Settings** → `/admin/settings/general`
  - Platform Name
  - Platform Description
  - Logo Upload
  - Favicon Upload
  - Contact Information
    - Email
    - Phone
    - Address
  - Social Links
    - Facebook
    - Twitter
    - LinkedIn
    - YouTube
  - SEO Settings
    - Meta Tags
    - Analytics ID

- **Booking Settings** → `/admin/settings/booking`
  - Cancellation Policy
    - Cancellation Window
    - Refund Policy
  - Reschedule Policy
    - Reschedule Window
    - Reschedule Limit
  - Dispute Window
  - No-Show Policy
  - Meeting Settings
    - Provider Configuration
    - Meeting Duration Limits

- **Payment Settings** → `/admin/settings/payment`
  - Currency Configuration
    - Default Currency
    - Supported Currencies
  - Payment Gateway Priority
  - Transaction Fees
  - Tax Settings
    - VAT/GST Rate
    - Tax Exemptions
  - Invoice Settings
    - Prefix
    - Number Format

- **Notification Settings** → `/admin/settings/notifications`
  - Default Preferences
    - By Role
    - By Channel
  - Channel Configuration
    - Email
    - SMS
    - Push
    - In-App
  - Digest Settings
    - Frequency
    - Content

- **Privacy Settings** → `/admin/settings/privacy`
  - Data Retention
    - User Data
    - Transaction Data
    - Log Data
  - Consent Management
    - Default Consents
    - Consent Versions
  - GDPR/Privacy Policy
    - Policy Version
    - Last Updated
  - Cookie Settings

- **Security Settings** → `/admin/settings/security`
  - Password Policy
    - Minimum Length
    - Special Characters
    - Expiry Days
    - History Count
  - Session Management
    - Session Timeout
    - Concurrent Sessions
    - Remember Me Duration
  - MFA Requirements
    - Enforce MFA by Role
    - Recovery Code Settings
  - IP Restrictions
    - Whitelist
    - Blocklist
  - Security Headers

---

# 🚩 21. FEATURE FLAGS

## Feature Management
**Route:** `/admin/features`

### Sub-Menu Items:
- **All Features** → `/admin/features`
  - Feature List
  - Enable/Disable
  - Rollout Percentage
  - User Whitelist
    - Add Users
    - Remove Users
  - Feature Settings
  - Feature Status

- **Create Feature** → `/admin/features/create`
  - Feature Name
  - Feature Description
  - Category
    - Platform
    - Candidate
    - Expert
    - Company
  - Default Status
    - Enabled/Disabled
  - Rollout Strategy
    - Percentage
    - Gradual Rollout

- **Feature Analytics** → `/admin/features/analytics`
  - Usage Stats
  - User Impact
  - Performance Impact
  - Engagement Metrics
  - A/B Test Results

---

# 🔧 22. MAINTENANCE MODE

## System Maintenance
**Route:** `/admin/maintenance`

### Sub-Menu Items:
- **Maintenance Settings** → `/admin/maintenance`
  - Enable/Disable Maintenance Mode
  - Scheduled Maintenance
    - Start Time
    - End Time
    - Estimated Duration
  - Message Configuration
    - Maintenance Message
    - Estimated Completion Time
  - IP Whitelist
    - Add IPs
    - Remove IPs
  - Maintenance History

- **System Status** → `/admin/maintenance/status`
  - Service Status
    - Web Application
    - API
    - Database
    - Cache
    - Queue
  - Database Status
    - Connection
    - Performance
    - Replication
  - Cache Status
    - Redis Connection
    - Cache Hit Rate
  - Queue Status
    - Queue Length
    - Worker Status

- **Health Checks** → `/admin/maintenance/health`
  - All Services
  - Endpoint Health
    - Response Times
    - Success Rates
  - Error Rates
  - Memory Usage
  - CPU Usage

---

# 📋 23. SYSTEM LOGS

## Log Management
**Route:** `/admin/logs`

### Sub-Menu Items:
- **Application Logs** → `/admin/logs/app`
  - Real-time Logs
  - Filter by Level
    - Info
    - Warning
    - Error
    - Critical
  - Search
  - Download
  - Log Retention Settings

- **Error Logs** → `/admin/logs/errors`
  - All Errors
  - Stack Traces
  - Frequency Analysis
  - Error Trends
  - Resolution Status

- **Access Logs** → `/admin/logs/access`
  - API Access
  - Admin Access
  - IP Analysis
  - User Agent Analysis
  - Request Patterns

---

# 🏆 24. GAMIFICATION MANAGEMENT

## Gamification
**Route:** `/admin/gamification`

### Sub-Menu Items:
- **Overview** → `/admin/gamification`
  - XP Distribution
    - Total XP Earned
    - Average XP per User
    - XP by Role
  - Leaderboard
    - Global
    - By Category
    - Monthly
    - Top Users
  - Badge Statistics
    - Total Badges Issued
    - Badge Distribution
  - Active Challenges

- **XP Rules** → `/admin/gamification/xp-rules`
  - Add/Edit/Delete Rules
    - Event Type
    - XP Amount
    - Frequency Limit
    - Role Eligibility
  - XP Amounts
    - Profile Completion
    - CV Creation
    - Project Publication
    - Course Completion
    - Assessment Pass
    - Session Completion
    - Job Application
    - Daily Login
  - Idempotency Keys
  - Rule Version History

- **Badges** → `/admin/gamification/badges`
  - All Badges
  - Create/Edit/Delete
    - Badge Name
    - Badge Image
    - Description
    - Criteria
    - XP Bonus
  - Award Manually
    - Select User
    - Reason
  - Badge Status
  - Badge Category

- **Challenges** → `/admin/gamification/challenges`
  - Create/Edit/Delete
    - Challenge Name
    - Description
    - Criteria
    - Rewards
    - Time Period (Start/End)
    - User Eligibility
  - Challenge Status
  - Participation Stats
  - Completion Stats

- **Leaderboard** → `/admin/gamification/leaderboard`
  - Global Leaderboard
    - All Users
    - By Role
  - Category Leaderboards
    - Learning
    - Assessment
    - Sessions
    - Jobs
  - Reset/Manage
    - Monthly Reset
    - Manual Reset
  - Exclusion Management
    - Remove Users
    - Ban Users

---

# 📱 25. MOBILE CONFIGURATION (Future)

## Mobile App Management
**Route:** `/admin/mobile`

### Sub-Menu Items:
- **App Settings** → `/admin/mobile/settings`
  - App Version
    - Android Version
    - iOS Version
  - Force Update
    - Enable/Disable
    - Minimum Version
  - Feature Toggles
    - Push Notifications
    - Biometric Login
    - Offline Mode

- **Push Notifications** → `/admin/mobile/push`
  - Send Push
    - Select Audience (All/By Role/By Country/By Segment)
    - Title
    - Message
    - Action
    - Schedule
  - Scheduled Push
    - List
    - Edit/Delete
  - Campaigns
    - Create Campaign
    - Analytics
  - Push History

- **App Analytics** → `/admin/mobile/analytics`
  - Downloads
    - Android
    - iOS
  - Active Users
    - Daily/Weekly/Monthly
  - Device Analysis
    - Device Type
    - OS Version
  - App Performance
    - Crash Reports
    - App Start Time

---

# 🤖 26. AI SERVICES (Future)

## AI Configuration
**Route:** `/admin/ai`

### Sub-Menu Items:
- **AI Settings** → `/admin/ai/settings`
  - Enable/Disable AI Services
  - Service Configuration
    - CV Analysis API
    - Job Matching API
    - Interview Practice API
    - Recommendation Engine
  - API Keys
    - Key Management
    - Key Rotation

- **AI Features** → `/admin/ai/features`
  - CV Analysis
    - Parsing
    - Scoring
    - Suggestions
  - Job Matching
    - Algorithm
    - Matching Score
    - Weight Settings
  - Interview Practice
    - Question Generation
    - Answer Analysis
    - Feedback Generation
  - Recommendation Engine
    - Job Recommendations
    - Course Recommendations
    - Expert Recommendations

- **AI Usage** → `/admin/ai/usage`
  - API Calls
    - Total Calls
    - By Feature
    - By User
  - Costs
    - Total Cost
    - Cost per Feature
    - Cost Trends
  - Performance
    - Response Times
    - Success Rates
    - Error Rates
  - Usage Limits
    - Per User
    - Per Day
    - Overall

---

# 📊 SUPERADMIN MENU HIERARCHY SUMMARY

```
📊 1. DASHBOARD
   ├── Platform Overview
   ├── Growth Analytics
   ├── Revenue Analytics
   └── Performance Monitoring

👥 2. USER MANAGEMENT
   ├── All Users
   ├── User Detail
   ├── Suspended Accounts
   ├── Account Verification
   ├── Roles & Permissions
   │   ├── Role List
   │   ├── Permission Management
   │   └── User Role Assignment

🎓 3. CANDIDATE MANAGEMENT
   ├── All Candidates
   ├── Candidate Detail
   ├── Skill Verification
   ├── Readiness Levels
   └── Candidate Reports

🎯 4. EXPERT MANAGEMENT
   ├── All Experts
   ├── Expert Detail
   ├── Verification Queue
   ├── Performance Metrics
   ├── Expert Complaints
   └── Expert Reports

🏢 5. COMPANY MANAGEMENT
   ├── All Companies
   ├── Company Detail
   ├── Verification Queue
   ├── Subscription Management
   ├── Company Team Management
   └── Company Activity

💼 6. JOB MANAGEMENT
   ├── All Jobs
   ├── Job Detail
   ├── Moderation Queue
   ├── Reported Jobs
   ├── Job Analytics
   └── Job Categories

📝 7. ASSESSMENT MANAGEMENT
   ├── All Assessments
   ├── Assessment Detail
   ├── Create/Edit Assessment
   ├── Question Bank
   ├── Assessment Results
   ├── Assessment Categories
   └── Assessment Certificates

📚 8. LEARNING MANAGEMENT
   ├── All Courses
   ├── Course Detail
   ├── Create/Edit Course
   ├── Course Content Management
   ├── Course Analytics
   ├── Learning Categories
   └── Learning Certificates

🔧 9. CATALOG MANAGEMENT
   ├── Skills Catalog
   ├── Expertise Areas
   ├── Industries
   ├── Countries
   ├── Languages
   ├── Currencies
   ├── Job Categories
   └── Company Categories

📧 10. TEMPLATE MANAGEMENT
    ├── Email Templates
    ├── SMS Templates
    ├── Notification Templates
    ├── CV Templates
    ├── Certificate Templates
    └── Job Post Templates

💳 11. PAYMENT MANAGEMENT
    ├── Transactions
    ├── Payment Orders
    ├── Refunds
    ├── Webhook Logs
    └── Payment Gateway Settings

💰 12. FINANCE OPERATIONS
    ├── Commission Settings
    ├── Payout Management
    ├── Earnings Management
    ├── Reconciliation
    └── Financial Reports

📄 13. INVOICE MANAGEMENT
    ├── Invoice List
    └── Invoice Settings

🔐 14. SECURITY & AUDIT
    ├── Security Overview
    ├── User Sessions
    ├── IP Management
    ├── MFA Management
    └── Security Settings

📋 15. AUDIT LOGS
    ├── All Logs
    ├── User Activity
    ├── Security Events
    └── Admin Actions

🎫 16. SUPPORT MANAGEMENT
    ├── All Tickets
    ├── Ticket Detail
    ├── Pending Tickets
    ├── Support Categories
    └── Support Analytics

🛡️ 17. CONTENT MODERATION
    ├── Moderation Overview
    ├── Reported Profiles
    ├── Reported Projects
    ├── Reported Jobs
    ├── Reported Reviews
    ├── Reported Messages
    └── Appeals

⚠️ 18. COMPLAINTS MANAGEMENT
    ├── All Complaints
    ├── Complaint Resolution
    └── Complaint Categories

📈 19. REPORTS & ANALYTICS
    ├── General Reports
    ├── User Reports
    ├── Financial Reports
    ├── Performance Reports
    └── Custom Reports

⚙️ 20. PLATFORM SETTINGS
    ├── General Settings
    ├── Booking Settings
    ├── Payment Settings
    ├── Notification Settings
    ├── Privacy Settings
    └── Security Settings

🚩 21. FEATURE FLAGS
    ├── All Features
    ├── Create Feature
    └── Feature Analytics

🔧 22. MAINTENANCE MODE
    ├── Maintenance Settings
    ├── System Status
    └── Health Checks

📋 23. SYSTEM LOGS
    ├── Application Logs
    ├── Error Logs
    └── Access Logs

🏆 24. GAMIFICATION MANAGEMENT
    ├── Overview
    ├── XP Rules
    ├── Badges
    ├── Challenges
    └── Leaderboard

📱 25. MOBILE CONFIGURATION (Future)
    ├── App Settings
    ├── Push Notifications
    └── App Analytics

🤖 26. AI SERVICES (Future)
    ├── AI Settings
    ├── AI Features
    └── AI Usage
```

---

# PERMISSION MATRIX

| Module | SuperAdmin | Finance Admin | Support Agent | Content Moderator |
|--------|------------|---------------|---------------|-------------------|
| Dashboard | ✅ Full | ✅ Limited | ✅ Limited | ✅ Limited |
| User Management | ✅ Full | ❌ | ✅ Read | ❌ |
| Candidate Management | ✅ Full | ❌ | ✅ Read | ✅ Limited |
| Expert Management | ✅ Full | ❌ | ✅ Read | ✅ Limited |
| Company Management | ✅ Full | ❌ | ✅ Read | ✅ Limited |
| Job Management | ✅ Full | ❌ | ❌ | ✅ Full |
| Assessment Management | ✅ Full | ❌ | ❌ | ✅ Limited |
| Course Management | ✅ Full | ❌ | ❌ | ✅ Limited |
| Catalog Management | ✅ Full | ❌ | ❌ | ❌ |
| Template Management | ✅ Full | ❌ | ❌ | ❌ |
| Payment Management | ✅ Full | ✅ Full | ❌ | ❌ |
| Finance Operations | ✅ Full | ✅ Full | ❌ | ❌ |
| Invoice Management | ✅ Full | ✅ Full | ❌ | ❌ |
| Security & Audit | ✅ Full | ✅ Limited | ❌ | ❌ |
| Audit Logs | ✅ Full | ✅ Limited | ❌ | ❌ |
| Support Management | ✅ Full | ❌ | ✅ Full | ❌ |
| Content Moderation | ✅ Full | ❌ | ❌ | ✅ Full |
| Complaints Management | ✅ Full | ❌ | ✅ Limited | ✅ Limited |
| Reports & Analytics | ✅ Full | ✅ Full | ❌ | ❌ |
| Platform Settings | ✅ Full | ❌ | ❌ | ❌ |
| Feature Flags | ✅ Full | ❌ | ❌ | ❌ |
| Maintenance Mode | ✅ Full | ❌ | ❌ | ❌ |
| System Logs | ✅ Full | ❌ | ❌ | ❌ |
| Gamification | ✅ Full | ❌ | ❌ | ❌ |
| Mobile Configuration | ✅ Full | ❌ | ❌ | ❌ |
| AI Configuration | ✅ Full | ❌ | ❌ | ❌ |

---

**Note:** This complete SuperAdmin menu structure covers all platform management needs with the 4 mandatory roles (Candidate, Expert, Company, SuperAdmin) and supports custom role creation for additional team members.
