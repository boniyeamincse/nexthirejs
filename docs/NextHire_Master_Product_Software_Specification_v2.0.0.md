# NextHire — Master Product & Software Specification

**Product:** NextHire  
**Domain:** `mnexthire.com`  
**Document Version:** 2.0.0  
**Status:** Master Planning Baseline  
**Prepared for:** Boni Yeamin  
**Target Markets:** Bangladesh, Pakistan, India  
**Primary Product Languages:** English, Bangla, Urdu, Hindi  
**Document Purpose:** This document is the authoritative planning reference for product design, development, testing, deployment, and future expansion.

---

# 1. Product Vision

NextHire is not only a mock interview platform and not only a job portal.

NextHire is a complete **Career Readiness, Learning, Professional Portfolio, Interview Practice, Talent Discovery, and Hiring Platform** where a user can:

1. Select a career goal.
2. Follow structured learning paths.
3. Practise job-specific questions.
4. Book live sessions with professional trainers.
5. Build multiple professional CVs.
6. Create a verified project portfolio.
7. complete assessments.
8. Receive expert evaluations.
9. Improve a measurable job-readiness profile.
10. Apply to jobs.
11. Become discoverable to verified companies.
12. Attend company interviews.
13. Receive job offers and get hired.

Companies can:

1. Create verified company profiles.
2. Publish jobs.
3. Search the NextHire talent pool.
4. Review candidate CVs, projects, assessments, trainer evaluations, and interview performance.
5. Invite suitable candidates.
6. Manage complete hiring pipelines.
7. Conduct interviews and assessments.
8. Issue offers and mark candidates as hired.

The core product principle is:

> **Learn → Practise → Build → Prove → Apply → Get Discovered → Get Hired**

---

# 2. Product Positioning

NextHire combines the capabilities of:

- Career development platform
- Learning management system
- Interview preparation platform
- Professional trainer marketplace
- CV builder
- Project portfolio platform
- Skills and assessment platform
- Job marketplace
- Verified talent marketplace
- Applicant tracking and hiring platform
- Company recruitment portal

## 2.1 Product Promise for Candidates

NextHire helps candidates become job-ready through guided learning, practical work, professional presentation, expert feedback, and direct access to hiring companies.

## 2.2 Product Promise for Trainers

NextHire helps trainers monetize professional expertise through interview sessions, CV reviews, project reviews, mentoring, assessments, courses, and career-guidance packages.

## 2.3 Product Promise for Companies

NextHire helps companies discover, evaluate, interview, and hire candidates whose skills and readiness are supported by projects, assessments, evaluations, and verified activity.

---

# 3. Target Users

## 3.1 Candidate / Learner

The primary user who learns, builds a career profile, creates CVs, develops projects, practises interviews, applies to jobs, and receives company invitations.

## 3.2 Trainer / Mentor / Reviewer

A verified professional who provides paid or free services such as:

- Mock interview
- Career counselling
- CV review
- Project review
- Portfolio review
- Communication practice
- Technical assessment
- Learning session
- Job-readiness assessment
- Career-roadmap planning

## 3.3 Company Owner / Company Admin

A verified company representative who manages company information, subscriptions, team members, permissions, job posts, candidate search, hiring campaigns, and reports.

## 3.4 Recruiter / HR Member

A company team member who publishes jobs, reviews applications, shortlists candidates, schedules interviews, communicates with candidates, manages stages, and records hiring decisions.

## 3.5 Interviewer / Hiring Manager

A restricted company member who can view assigned candidates, conduct interviews, complete scorecards, and submit recommendations.

## 3.6 Instructor / Content Creator

A trainer or approved creator who can create courses, lessons, quizzes, assignments, learning paths, and learning projects.

## 3.7 Support Agent

An internal platform user who manages user support, disputes, reports, account recovery, and service requests.

## 3.8 Finance Administrator

An internal user who manages payments, refunds, commissions, trainer wallets, payout batches, invoices, reconciliations, and finance reports.

## 3.9 Content Moderator

An internal user who reviews profiles, projects, job posts, reviews, messages reported by users, learning content, and public content.

## 3.10 Super Administrator

The platform owner role with controlled access to all modules, configurations, audit logs, approvals, security, reports, and system operations.

---

# 4. Role and Permission Model

The system must not rely on one fixed `role` column only.

Use a flexible RBAC model:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `company_members`
- `company_member_roles`

A user may hold multiple roles where business rules allow it. For example, a candidate may later become a trainer.

## 4.1 Authorization Layers

Every protected operation must pass:

1. Authentication check
2. Account-status check
3. Role check
4. Permission check
5. Resource-ownership or organization-scope check
6. Business-rule check
7. Audit-log recording for sensitive operations

Frontend menu visibility is not security. Permissions must always be enforced by the backend API.

---

# 5. Complete Candidate Journey

```text
Register
  ↓
Verify Email / Phone
  ↓
Select Country, Language, Career Goal
  ↓
Complete Career Profile
  ↓
Build First CV
  ↓
Add Skills, Education, Experience and Projects
  ↓
Select Learning Path
  ↓
Complete Lessons, Quizzes, Assignments and Assessments
  ↓
Practise Questions and Recorded Answers
  ↓
Book Trainer / Mentor Session
  ↓
Attend Mock Interview / CV Review / Project Review
  ↓
Receive Evaluation and Improvement Plan
  ↓
Improve Career Passport and Job-Readiness Profile
  ↓
Search and Apply to Jobs
  ↓
Receive Company Invitations
  ↓
Complete Assessments and Company Interviews
  ↓
Receive Offer
  ↓
Accept Offer / Mark as Hired
```

---

# 6. Candidate Account and Career Profile

## 6.1 Registration

Support:

- Email and password
- Email verification
- Phone OTP verification
- Google login
- Future Apple login
- Country selection
- Preferred language
- Candidate agreement and privacy consent

## 6.2 Profile Information

Candidate profile includes:

- Full name
- Professional headline
- Profile image
- Date of birth visibility control
- Country
- City
- Current location
- Nationality where legally appropriate
- Phone
- Email
- Professional summary
- Career objective
- Education
- Work experience
- Internships
- Skills
- Tools and technologies
- Certifications
- Training
- Languages
- Achievements
- Preferred job roles
- Preferred industries
- Preferred locations
- Remote, hybrid, or onsite preference
- Expected salary range
- Employment type preference
- Availability / notice period
- LinkedIn
- GitHub
- Portfolio website
- Public profile slug

## 6.3 Profile Completion

The system calculates profile completeness using configured weighted sections.

The user receives:

- Completion percentage
- Missing-section list
- Recommended next actions
- Profile-strength indicator
- Privacy preview
- Company-view preview

---

# 7. NextHire Career Passport

The **Career Passport** is the candidate’s central professional identity.

It combines:

- Professional profile
- Active CV
- Skills
- Verified skills
- Projects
- Verified projects
- Certificates
- Course progress
- Assessment results
- Mock interview history
- Trainer evaluations
- Communication and technical scores
- Job-readiness breakdown
- Badges and achievements
- Public recommendations
- Availability and job preferences

## 7.1 Privacy Controls

Each section supports:

- Private
- Visible to approved trainers
- Visible to companies after access approval
- Visible to verified companies
- Public

## 7.2 Public Career Passport

Example:

`https://mnexthire.com/u/boni-yeamin`

The public page must not expose private contact data unless the user explicitly permits it.

## 7.3 Company Access Request

Companies may request access to restricted CVs, documents, evaluations, or contact details. The candidate can approve, reject, or revoke access.

---

# 8. Professional CV Builder

## 8.1 CV Builder Objectives

The CV builder must allow candidates to create professional, ATS-friendly, reusable, and job-specific CVs without requiring external software.

## 8.2 CV Sections

- Personal information
- Professional headline
- Career objective
- Professional summary
- Education
- Work experience
- Internship
- Skills
- Projects
- Certifications
- Training
- Achievements
- Publications
- Volunteer work
- Languages
- References
- Custom sections
- Social and portfolio links

## 8.3 CV Features

- Multiple CV templates
- ATS-friendly templates
- Country-appropriate templates
- Drag-and-drop section ordering
- Show/hide sections
- Real-time preview
- Auto-save draft
- Duplicate CV
- Multiple CV versions
- Job-specific CV creation
- Import data from Career Passport
- Import selected projects
- Import certificates
- Custom colors with ATS-safe warning
- Page-break control
- Font-size control within safe limits
- PDF export
- Public or private share link
- Expiring share link
- Watermarked preview where required
- CV completeness score
- CV quality checklist
- Spell-check integration
- Grammar suggestion integration
- Version history
- Restore previous version
- Default CV selection
- Selected CV per job application

## 8.4 CV Review Workflow

```text
Candidate submits CV for review
  ↓
Selects trainer package
  ↓
Payment confirmed
  ↓
Trainer reviews CV
  ↓
Trainer adds comments and section-level suggestions
  ↓
Candidate revises CV
  ↓
Trainer optionally marks review completed
  ↓
Reviewed badge is added
```

## 8.5 Future AI CV Features

- CV parsing
- Job-description keyword comparison
- ATS compatibility check
- Missing skill suggestions
- Summary drafting assistance
- Bullet-point improvement
- Duplicate-content detection
- Job-specific tailoring suggestions

AI suggestions must be editable and must never silently modify a candidate’s CV.

---

# 9. Project Portfolio

## 9.1 Project Information

Each project can contain:

- Project title
- Short summary
- Full description
- Problem statement
- Solution
- Candidate contribution
- Team size
- Role in project
- Technology stack
- Skills demonstrated
- Start and completion dates
- Project status
- GitHub repository
- Live URL
- Documentation URL
- Screenshots
- Demo video
- Attachments
- Challenges
- Lessons learned
- Future improvements

## 9.2 Project Visibility

- Private
- Trainer only
- Verified companies only
- Public
- Included in selected CVs
- Included in Career Passport

## 9.3 Project Verification Levels

- Self-submitted
- Identity-confirmed
- Trainer reviewed
- Expert verified
- Company reviewed
- Featured by NextHire

## 9.4 Project Review Scorecard

A reviewer may score:

- Problem understanding
- Solution quality
- Technical implementation
- Code quality
- Documentation
- UI/UX
- Security
- Testing
- Deployment
- Communication
- Originality
- Overall readiness

## 9.5 Project Integrity

The system should support:

- Declaration of ownership
- Team-member attribution
- External-link validation
- Duplicate-content checks
- Report project
- Verification audit trail
- Revocation of verification after policy violation

---

# 10. Skills and Verification

## 10.1 Skill Sources

A skill may be:

- Self-declared
- Added from course completion
- Added from assessment
- Confirmed by trainer
- Demonstrated by project
- Confirmed by company interview
- Imported from certificate

## 10.2 Skill Evidence

A skill record may link to:

- Project
- Assessment
- Course
- Certificate
- Trainer evaluation
- Interview score
- Work experience

## 10.3 Skill Levels

Configurable levels:

- Beginner
- Developing
- Intermediate
- Advanced
- Expert

The platform must clearly distinguish self-declared skills from verified skills.

---

# 11. Learning Management System

## 11.1 Learning Paths

Examples:

- Frontend Developer
- Backend Developer
- Full-Stack Developer
- Mobile Developer
- SOC Analyst
- Cybersecurity Engineer
- Network Engineer
- DevOps Engineer
- Cloud Engineer
- Data Analyst
- Data Scientist
- UI/UX Designer
- Digital Marketer
- HR Professional
- Accountant
- Business Analyst
- General Job Preparation

## 11.2 Learning Structure

```text
Career Track
  └── Learning Path
       └── Course
            └── Module
                 └── Lesson
                      ├── Video
                      ├── Article
                      ├── Resource
                      ├── Quiz
                      ├── Assignment
                      └── Project
```

## 11.3 Course Features

- Free and paid courses
- Recorded and live courses
- Preview lessons
- Prerequisites
- Difficulty level
- Estimated duration
- Course language
- Captions and transcripts
- Downloadable resources
- Progress tracking
- Lesson completion
- Resume last position
- Notes
- Bookmarks
- Quiz
- Assignment
- Project submission
- Instructor feedback
- Course discussion
- Certificate
- Rating and review

## 11.4 Content Approval

Trainer-created courses remain draft or pending until approved according to configured moderation rules.

## 11.5 Live Classes

- Schedule
- Seat limit
- Registration
- Payment
- Meeting room
- Attendance
- Recording link
- Class resources
- Follow-up assignment

---

# 12. Assessment System

## 12.1 Assessment Types

- Multiple-choice quiz
- Multiple-select question
- True/false
- Written answer
- File submission
- Coding challenge
- Practical task
- Case study
- Video response
- Audio response
- Timed test
- Company custom assessment

## 12.2 Assessment Controls

- Duration
- Attempt limit
- Question randomization
- Negative marking
- Passing score
- Scheduled availability
- Proctoring configuration for future phases
- Browser-warning configuration
- Result visibility
- Manual review
- Retake policy

## 12.3 Result Model

- Total score
- Section score
- Skill-level mapping
- Pass/fail
- Percentile
- Feedback
- Evidence link in Career Passport
- Visibility rules
- Expiry date where applicable

---

# 13. Interview Preparation

## 13.1 Interview Modes

- Question-bank practice
- Flashcard practice
- Timed answer practice
- Recorded video answer
- Recorded audio answer
- Self-assessment
- Peer practice
- Trainer mock interview
- AI-assisted mock interview in a future phase
- Company screening interview
- Company technical interview
- Final interview

## 13.2 Question Bank

Question categories:

- HR
- Behavioral
- Communication
- Technical
- Coding
- System design
- Domain-specific
- Government viva
- Banking viva
- University viva
- Leadership
- Management

Question features:

- Difficulty
- Job role
- Country
- Language
- Tags
- Sample answer
- Answer framework
- Trainer explanation
- Bookmark
- Personal note
- Practice history

## 13.3 Recorded Practice

Candidate can:

- Record answer
- Re-record
- Add private notes
- Request trainer review
- Compare attempts
- Track confidence
- Keep recording private
- Share selected attempt

---

# 14. Trainer Marketplace

## 14.1 Trainer Onboarding

```text
Register
  ↓
Verify Email and Phone
  ↓
Complete Professional Profile
  ↓
Upload Identity and Professional Evidence
  ↓
Submit for Review
  ↓
Admin Verification
  ↓
Trainer Approved
  ↓
Create Services and Availability
```

## 14.2 Trainer Profile

- Name
- Headline
- Bio
- Photo
- Country
- Languages
- Expertise
- Industry experience
- Certifications
- Past companies
- Session count
- Average rating
- Reviews
- Verification status
- Response time
- Availability
- Packages
- Courses
- Public content

## 14.3 Trainer Service Types

- HR mock interview
- Technical mock interview
- Coding interview
- CV review
- Project review
- Portfolio review
- Career counselling
- Communication practice
- English practice
- Job-readiness assessment
- Career-roadmap creation
- Live mentoring
- Assignment review
- Company interview preparation

## 14.4 Trainer Package

A package includes:

- Title
- Description
- Service type
- Career domain
- Job role
- Difficulty
- Language
- Number of sessions
- Duration
- Price
- Currency
- Deliverables
- Reschedule policy
- Cancellation policy
- Included CV review
- Included written report
- Included follow-up
- Active status
- Maximum bookings

## 14.5 Availability

- Weekly recurring availability
- Date-specific availability
- Blocked time
- Timezone
- Break between sessions
- Minimum booking notice
- Maximum advance booking
- Reschedule slots
- Calendar synchronization in a future phase

---

# 15. Booking and Session Management

## 15.1 Booking Flow

```text
Candidate selects service
  ↓
Selects available slot
  ↓
System locks slot temporarily
  ↓
Pending booking created
  ↓
Payment initiated
  ↓
Webhook verified
  ↓
Payment completed
  ↓
Booking confirmed
  ↓
Meeting room configured
  ↓
Candidate and trainer notified
```

## 15.2 Booking Rules

- Prevent double booking
- Use database transaction and row locking
- Temporary slot hold during payment
- Automatic release of expired holds
- Configurable cancellation window
- Configurable reschedule limit
- No-show status
- Dispute status
- Admin override with audit log

## 15.3 Booking Statuses

- draft
- pending_payment
- payment_processing
- confirmed
- reschedule_requested
- rescheduled
- cancelled_by_candidate
- cancelled_by_trainer
- cancelled_by_admin
- in_progress
- completed
- no_show_candidate
- no_show_trainer
- disputed
- refunded

## 15.4 Video Session

- Agora or another approved provider
- Short-lived access token
- Scheduled-time validation
- Candidate join tracking
- Trainer join tracking
- Attendance
- Join and leave events
- Session timer
- Network-quality display
- Text notes
- Screen sharing where supported
- Recording only with explicit policy and consent
- Session completion confirmation

---

# 16. Evaluation and Improvement Plan

## 16.1 Evaluation Categories

- Communication
- Technical knowledge
- Confidence
- Problem solving
- English or selected language
- HR readiness
- Role-specific competency
- Presentation
- Professionalism
- Overall readiness

## 16.2 Evaluation Output

- Numerical scores
- Level
- Strengths
- Weaknesses
- Written feedback
- Recommended learning
- Recommended practice
- Recommended next session
- Improvement tasks
- Follow-up date
- Visibility setting

## 16.3 Evaluation Integrity

- Only assigned trainer or interviewer can submit
- One active final evaluation per session
- Revision history
- Candidate dispute process
- Admin review
- Audit trail

---

# 17. Job Marketplace

## 17.1 Company Job Posting

Verified companies can create, edit, preview, publish, schedule, pause, close, duplicate, archive, and renew job posts.

## 17.2 Job Post Fields

- Job title
- Job slug
- Company
- Department
- Industry
- Job category
- Career domain
- Job description
- Responsibilities
- Required skills
- Preferred skills
- Minimum education
- Experience requirement
- Fresh-graduate eligibility
- Certifications
- Employment type
- Work mode
- Office location
- Country
- City
- Salary minimum and maximum
- Currency
- Salary visibility
- Benefits
- Number of vacancies
- Application deadline
- Joining date
- Gender preference only where legally permitted
- Age preference only where legally permitted
- Required languages
- Screening questions
- Required documents
- Required assessments
- Hiring stages
- Contact visibility
- Job visibility
- Featured-job option
- Status

## 17.3 Job Statuses

- draft
- pending_review
- scheduled
- published
- paused
- closed
- expired
- rejected
- archived

## 17.4 Job Visibility

- Public
- Verified candidates only
- Invited candidates only
- Internal campaign
- Country restricted
- Location restricted

## 17.5 Job Moderation

The platform may require moderation for:

- New companies
- Reported companies
- Sensitive categories
- Suspicious salary or contact information
- Duplicate jobs
- Misleading jobs
- Jobs requesting payment from candidates
- Policy violations

## 17.6 Candidate Job Discovery

Candidate features:

- Browse jobs
- Search
- Filter
- Sort
- Save job
- Follow company
- Job alert
- Recommended jobs
- Similar jobs
- Recently viewed
- Application-deadline reminder
- Report job
- Share job

## 17.7 Job Filters

- Keyword
- Job role
- Skill
- Company
- Industry
- Country
- City
- Remote / hybrid / onsite
- Experience
- Education
- Salary
- Employment type
- Date posted
- Verified company
- Career-readiness requirement
- Assessment requirement

---

# 18. Job Application

## 18.1 Application Flow

```text
Candidate opens job
  ↓
Reviews eligibility
  ↓
Selects CV version
  ↓
Selects projects to attach
  ↓
Adds cover letter
  ↓
Answers screening questions
  ↓
Consents to selected Career Passport data
  ↓
Submits application
  ↓
Application confirmation
  ↓
Company pipeline begins
```

## 18.2 Application Data

- Selected CV snapshot
- Cover letter
- Selected projects
- Screening answers
- Salary expectation
- Availability
- Referral source
- Career Passport consent snapshot
- Submission timestamp
- Application source
- Current stage
- Withdrawal status

The system should preserve the submitted CV snapshot even if the candidate later edits the original CV.

## 18.3 Candidate Application Actions

- View status
- Withdraw application
- Respond to company
- Complete assessment
- Select interview slot
- Upload requested document
- Accept or decline offer
- Report inappropriate request

---

# 19. Company Portal

## 19.1 Company Registration and Verification

Company submits:

- Legal name
- Brand name
- Registration number
- Tax information where applicable
- Website
- Industry
- Company size
- Country
- Address
- Contact person
- Official email
- Verification documents
- Company logo
- Company description

Verification statuses:

- draft
- submitted
- under_review
- information_requested
- verified
- rejected
- suspended
- expired

## 19.2 Company Team

Company owner can invite:

- Company admin
- Recruiter
- HR manager
- Interviewer
- Hiring manager
- Viewer
- Finance member

Permissions must be configurable.

## 19.3 Company Profile

Public company profile:

- Logo
- Cover image
- About
- Website
- Industry
- Size
- Locations
- Benefits
- Culture
- Media
- Active jobs
- Verification badge
- Candidate reviews where enabled

---

# 20. Candidate Search and Talent Discovery

Companies can search candidates by:

- Job role
- Skills
- Verified skills
- Country
- Location
- Experience
- Education
- Language
- Assessment score
- Interview score
- Project score
- Readiness level
- Salary expectation
- Availability
- Work preference
- Certification
- Trainer verification
- Profile activity
- Public or company-visible status

## 20.1 Candidate Actions for Company

- Save candidate
- Add to talent pool
- Request CV access
- Request Career Passport access
- Invite to job
- Invite to campaign
- Invite to assessment
- Invite to interview
- Send message
- Add internal tag
- Add private note

Companies must not access private candidate information without permission.

---

# 21. Hiring Campaign and Applicant Tracking

## 21.1 Hiring Campaign

A campaign may link to one or more jobs and includes:

- Campaign name
- Department
- Owner
- Hiring team
- Target number
- Opening and closing date
- Candidate source
- Pipeline
- Assessments
- Interview plan
- Budget
- Status

## 21.2 Default Pipeline

- Applied
- Invited
- Screening
- Assessment
- HR interview
- Technical interview
- Shortlisted
- Final interview
- Offer preparation
- Offer sent
- Offer accepted
- Hired
- Rejected
- Withdrawn
- On hold

Stages must be configurable by company.

## 21.3 Pipeline Features

- Kanban view
- Table view
- Bulk move
- Bulk message
- Tags
- Internal notes
- Assignment to recruiter
- Stage history
- Reason codes
- Due dates
- Candidate comparison
- Duplicate-application detection
- Export under permission control

---

# 22. Company Interviews

## 22.1 Interview Types

- Phone screening
- Video interview
- HR interview
- Technical interview
- Coding interview
- Project presentation
- Panel interview
- Final interview

## 22.2 Interview Features

- Candidate slot selection
- Interviewer assignment
- Calendar event
- Meeting room
- Reminder
- Interview guide
- Custom scorecard
- Private interviewer notes
- Consolidated decision
- Reschedule
- Attendance
- Feedback lock after finalization

---

# 23. Offer Management

Company can:

- Create offer
- Use offer template
- Set position
- Set salary
- Set currency
- Add benefits
- Add probation
- Add joining date
- Add offer expiry
- Upload attachment
- Send offer
- Withdraw offer
- Revise offer
- Record candidate response

Candidate can:

- View offer
- Download offer
- Accept
- Decline
- Request clarification
- Upload signed document where required

Offer statuses:

- draft
- approved
- sent
- viewed
- negotiation
- accepted
- declined
- expired
- withdrawn

---

# 24. Job-Readiness Profile

The platform presents a transparent score breakdown rather than only one unexplained number.

## 24.1 Suggested Dimensions

- Profile completeness
- CV quality
- Learning progress
- Assessment performance
- Technical readiness
- Communication readiness
- Interview readiness
- Project portfolio
- Verified evidence
- Professional activity

## 24.2 Readiness Levels

- Getting Started
- Learning
- Developing
- Interview Ready
- Job Ready
- Industry Ready
- Top Talent

## 24.3 Rules

- Every score must show its contributing evidence.
- Score calculation must be versioned.
- Candidate can see how to improve.
- Companies see only permitted dimensions.
- Scores must not be the sole automated hiring decision.
- Admin can disable or revise a score rule.
- Anti-manipulation controls are required.

---

# 25. Gamification

## 25.1 Gamification Elements

- XP
- Levels
- Badges
- Streaks
- Challenges
- Milestones
- Country leaderboard
- Global leaderboard
- Career-domain leaderboard
- Category leaderboard
- Monthly leaderboard
- Learning leaderboard
- Interview leaderboard

## 25.2 XP Ledger

Every XP change must create an immutable ledger entry containing:

- User
- Event
- Points
- Reference type
- Reference ID
- Idempotency key
- Rule version
- Timestamp
- Metadata

## 25.3 Example XP Events

- Profile completion
- First CV completed
- First project published
- Course completion
- Assessment pass
- Mock interview completion
- Trainer evaluation
- Job application milestone
- Daily or weekly learning streak
- Verified project
- Badge unlock

## 25.4 Anti-Abuse

- No duplicate XP for the same idempotency key
- Daily limits for repeatable actions
- Fraud detection
- Admin reversal with reason
- Audit trail
- Leaderboard exclusion for suspended users

---

# 26. Reviews, Recommendations, and Trust

## 26.1 Candidate Reviews Trainer

After a completed eligible service:

- Rating
- Written review
- Tags
- Anonymous-display option under policy
- Report review

## 26.2 Trainer Feedback to Candidate

Trainer feedback belongs to evaluation and follows configured visibility.

## 26.3 Company and Candidate Trust

Possible future features:

- Company hiring-experience review
- Candidate professionalism score
- Verified recommendation
- Employment confirmation

Public trust features must be designed carefully to prevent defamation and unfair profiling.

---

# 27. Messaging and Collaboration

## 27.1 Conversation Types

- Candidate–trainer
- Candidate–company
- Company hiring team
- Course discussion
- Support ticket conversation

## 27.2 Chat Features

- Real-time message
- Text
- Attachment
- Read receipt
- Typing indicator
- Reply
- Message search
- Mute
- Block
- Report
- Conversation archive
- Retention policy
- Malware scan for attachments

Contact information sharing may be restricted according to platform policy.

---

# 28. Notifications

## 28.1 Channels

- In-app
- Email
- SMS
- Push notification
- Future WhatsApp integration where legally and commercially appropriate

## 28.2 Notification Events

- Verification
- Password reset
- Booking
- Payment
- Session reminder
- Reschedule
- Evaluation
- CV review
- Project review
- Course activity
- Assessment
- Job alert
- Application update
- Interview invitation
- Offer
- Company invitation
- Payout
- Security alert
- Admin announcement

## 28.3 Preferences

Users can configure preferences by category and channel, except mandatory security and legal notices.

---

# 29. Payment, Wallet, Commission, and Payout

## 29.1 Payment Use Cases

- Trainer service purchase
- Course purchase
- Assessment purchase
- Candidate subscription
- Company subscription
- Featured job
- Hiring campaign package
- CV premium template
- Certificate fee where applicable

## 29.2 Payment Gateway Adapter

Use a common gateway interface with country-specific adapters.

Potential gateway groups:

- Bangladesh local gateways
- Pakistan local gateways
- India local gateways
- International card gateway
- PayPal where supported

Specific providers must be finalized after legal, commercial, and technical review.

## 29.3 Payment Tables

- payment_orders
- payment_attempts
- payment_transactions
- payment_webhook_events
- refunds
- invoices
- wallet_accounts
- wallet_ledger
- commissions
- payout_accounts
- payout_batches
- payout_items
- reconciliation_records

## 29.4 Payment Security Rules

- Backend calculates final amount
- Verify signed callback/webhook
- Idempotent webhook processing
- Store provider event ID
- Never trust frontend success page
- Use decimal or minor-unit money representation
- Record full state transition
- Reconcile gateway data
- Audit all manual changes

## 29.5 Trainer Earnings Flow

```text
Candidate pays
  ↓
Platform confirms payment
  ↓
Amount held in clearing state
  ↓
Service completed
  ↓
Evaluation or deliverable submitted
  ↓
Dispute window checked
  ↓
Platform commission calculated
  ↓
Trainer earning becomes available
  ↓
Payout batch created
  ↓
Finance approval or automated rule
  ↓
Payout sent
```

## 29.6 Refunds and Disputes

- Cancellation refund
- Partial refund
- Failed-service refund
- Duplicate-payment refund
- Admin-approved exception
- Evidence collection
- Dispute timeline
- Finance audit trail

---

# 30. Subscription and Monetization

## 30.1 Candidate Plans

Possible tiers:

- Free
- Pro
- Career Plus

Features may include:

- More CV versions
- Premium CV templates
- Advanced analytics
- More practice attempts
- Discounted trainer sessions
- Priority reviews
- AI features in future
- Enhanced Career Passport

## 30.2 Trainer Monetization

- Session commission
- Course revenue share
- Featured trainer listing
- Subscription plan
- Paid content
- Payout fee where legally permitted

## 30.3 Company Plans

- Free trial
- Starter
- Growth
- Enterprise

Limits may include:

- Active jobs
- Team members
- Candidate views
- Invitations
- Talent searches
- Assessments
- Interview rooms
- Reports
- API or ATS integration in future

## 30.4 Coupons and Promotions

- Fixed discount
- Percentage discount
- First-purchase offer
- Country-specific promotion
- Service-specific coupon
- Expiry
- Usage limit
- User limit
- Minimum spend
- Referral promotion

---

# 31. Referral System

Potential referral types:

- Candidate invites candidate
- Trainer invites candidate
- Trainer invites trainer
- Company referral
- Campaign referral

Referral rules require:

- Unique code
- Attribution window
- Reward conditions
- Fraud controls
- Reward ledger
- Expiry
- Admin reporting

---

# 32. Search

## 32.1 Search Domains

- Jobs
- Trainers
- Courses
- Candidates
- Companies
- Projects
- Questions

## 32.2 Initial Search

Use PostgreSQL full-text search and indexed filters for the initial product.

## 32.3 Future Search Scale

Introduce OpenSearch or another approved search engine when data volume and search complexity justify it.

PostgreSQL remains the source of truth.

---

# 33. Administration Platform

## 33.1 Main Dashboard

- Registered users
- Active users
- Candidates
- Trainers
- Companies
- Published jobs
- Applications
- Sessions
- Revenue
- Refunds
- Payouts
- Conversion rates
- Platform health
- Security alerts
- Pending approvals

## 33.2 Administration Menus

### Dashboard

- Overview
- Growth
- Activity
- System health

### Users

- All users
- Candidates
- Trainers
- Company members
- Internal users
- Suspended users
- Deleted accounts
- Login sessions
- Account recovery

### Roles and Permissions

- Roles
- Permissions
- Role assignment
- Company role templates
- Internal access audit

### Trainer Management

- Applications
- Verification
- Packages
- Availability
- Reviews
- Complaints
- Earnings
- Payout accounts

### Company Management

- Companies
- KYC review
- Company members
- Job activity
- Subscriptions
- Violations
- Verification expiry

### Jobs

- All jobs
- Pending review
- Published
- Paused
- Rejected
- Reported
- Expired
- Featured jobs
- Categories
- Skills
- Locations

### Candidates and Career Passport

- Candidate profiles
- CV reports
- Project reports
- Skill evidence
- Readiness configuration
- Privacy complaints

### Learning

- Career tracks
- Learning paths
- Courses
- Modules
- Lessons
- Quizzes
- Assignments
- Projects
- Certificates
- Instructor approvals

### Interview and Sessions

- Bookings
- Sessions
- Video events
- Evaluations
- No-shows
- Disputes
- Recordings where permitted

### Hiring

- Campaigns
- Applications
- Pipeline analytics
- Interviews
- Offers
- Hires

### Payments

- Orders
- Transactions
- Webhooks
- Refunds
- Invoices
- Reconciliation
- Failed payments

### Wallets and Payouts

- Trainer wallets
- Ledger
- Pending earnings
- Payout batches
- Failed payouts
- Commission rules

### Gamification

- XP rules
- Levels
- Badges
- Challenges
- Leaderboards
- Abuse review

### Communication

- Notifications
- Templates
- Broadcasts
- Email logs
- SMS logs
- Push logs
- Reported messages

### Moderation

- Reported profiles
- Reported projects
- Reported jobs
- Reported reviews
- Reported messages
- Content decisions
- Appeals

### Support

- Tickets
- Categories
- Service levels
- Assignments
- Escalations
- Satisfaction

### Reports

- Revenue
- User growth
- Course performance
- Trainer performance
- Job performance
- Hiring conversion
- Country reports
- Payment reports
- Security reports

### Configuration

- Countries
- Currencies
- Languages
- Timezones
- Payment gateways
- Commission rules
- Taxes
- Job categories
- Skills
- Email templates
- SMS templates
- Feature flags
- Maintenance mode

### Audit and Security

- Audit logs
- Admin activities
- Authentication events
- API access
- Suspicious activity
- Data exports
- Data deletion requests

---

# 34. Dashboard Requirements

## 34.1 Candidate Dashboard

- Profile completion
- Career goal
- Active CV
- Readiness breakdown
- Learning progress
- Upcoming sessions
- Recent evaluation
- Recommended next action
- Saved jobs
- Applications
- Interview invitations
- Company invitations
- Badges
- XP
- Notifications

## 34.2 Trainer Dashboard

- Upcoming sessions
- Pending evaluations
- Pending reviews
- Earnings
- Available balance
- Payout history
- Package performance
- Course performance
- Rating
- Reviews
- Availability
- Notifications

## 34.3 Company Dashboard

- Active jobs
- Applications
- Stage summary
- Interviews
- Offers
- Hires
- Candidate invitations
- Saved talent
- Team activity
- Subscription usage
- Job analytics

## 34.4 Admin Dashboard

Must provide role-specific widgets rather than exposing every metric to every internal role.

---

# 35. Localization and Country Configuration

The product targets Bangladesh, Pakistan, and India.

## 35.1 Languages

- English
- Bangla
- Urdu
- Hindi

## 35.2 Country Configuration

Database-driven settings:

- Country code
- Phone code
- Currency
- Timezone
- Date format
- Number format
- Supported languages
- Payment gateways
- Tax configuration
- Job-location hierarchy
- Legal policy versions
- Minimum age
- Feature availability

## 35.3 Technical Rules

- Store timestamps in UTC
- Display in user timezone
- Store currency code with every monetary record
- Never assume one country or one currency
- Support right-to-left layout for Urdu
- Translation keys must not be embedded as raw UI text

---

# 36. Technology Baseline

## 36.1 Web Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- Accessible component system
- TanStack Query
- React Hook Form
- Zod
- Zustand only for necessary local client state
- Internationalization library

## 36.2 Backend API

- NestJS
- TypeScript
- REST API
- OpenAPI / Swagger
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Socket.IO
- Object-storage integration

## 36.3 Mobile

Current planning baseline:

- Flutter
- Dart
- Riverpod
- Dio
- GoRouter
- Secure storage
- Firebase Cloud Messaging
- Agora Flutter SDK

Mobile development begins after the core web and API workflows are stable. The mobile framework can be reviewed at the mobile phase without changing the API-first architecture.

## 36.4 Future AI Services

Use Python and FastAPI for specialized AI services such as:

- CV analysis
- Resume parsing
- Job matching
- Recommendation
- Interview assistance
- Speech analysis
- Project analysis

AI services must remain separate from the transactional core.

---

# 37. Architecture

## 37.1 Initial Architecture

Use a modular monolith.

```text
Next.js Web
Flutter Mobile
      │
      ▼
NestJS REST API
      │
      ├── PostgreSQL
      ├── Redis
      ├── BullMQ Workers
      ├── Object Storage
      ├── Video Provider
      ├── Email Provider
      └── SMS / Push Providers
```

## 37.2 Why Modular Monolith First

- Lower operational complexity
- Easier transactions
- Easier debugging
- Faster development
- Clear domain boundaries
- Modules can later become services

## 37.3 Future Service Extraction

Only when justified by scale:

- Notification service
- Search service
- Video/session service
- Payment service
- Learning service
- Analytics service
- AI service

---

# 38. Development and Docker Strategy

## 38.1 Local Development

Run application code locally for fast hot reload:

- Next.js locally
- NestJS locally
- Flutter on emulator or physical device

Run infrastructure through Docker Compose:

- PostgreSQL
- Redis
- MinIO
- Mailpit
- Optional search engine

## 38.2 Production

Containerize:

- Web
- API
- Worker
- Scheduler
- WebSocket process if separated

Use managed or production-grade:

- PostgreSQL
- Redis
- Object storage
- Load balancer
- CDN
- Backup system
- Monitoring

Do not deploy development tools such as Mailpit in production.

---

# 39. Suggested Repository Structure

```text
nexthire/
├── apps/
│   ├── web/
│   ├── api/
│   └── mobile/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── api-client/
│   ├── constants/
│   ├── eslint-config/
│   └── tsconfig/
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── monitoring/
│   └── scripts/
├── docs/
├── docker-compose.yml
└── README.md
```

---

# 40. Backend Domain Modules

```text
auth
users
roles
permissions
candidate-profiles
career-passports
cv-builder
projects
skills
learning-paths
courses
lessons
quizzes
assignments
assessments
trainers
trainer-services
availability
bookings
sessions
video
evaluations
reviews
companies
company-members
jobs
applications
talent-search
campaigns
pipelines
interviews
offers
payments
refunds
wallets
commissions
payouts
subscriptions
coupons
referrals
gamification
leaderboards
conversations
messages
notifications
files
moderation
support
reports
audit
settings
```

---

# 41. Core Data Entities

## 41.1 Identity and Access

- users
- user_profiles
- user_sessions
- devices
- roles
- permissions
- user_roles
- role_permissions
- verification_tokens
- otp_requests
- security_events

## 41.2 Candidate

- candidate_profiles
- candidate_preferences
- education_records
- experience_records
- certifications
- languages
- candidate_skills
- skill_evidence
- career_passports
- passport_visibility_rules

## 41.3 CV

- cvs
- cv_versions
- cv_sections
- cv_templates
- cv_exports
- cv_share_links
- cv_reviews
- cv_review_comments

## 41.4 Projects

- projects
- project_members
- project_technologies
- project_media
- project_reviews
- project_verifications
- project_reports

## 41.5 Learning

- career_tracks
- learning_paths
- courses
- course_modules
- lessons
- lesson_resources
- enrollments
- lesson_progress
- quizzes
- quiz_questions
- quiz_attempts
- assignments
- assignment_submissions
- certificates

## 41.6 Assessment

- assessments
- assessment_sections
- assessment_questions
- assessment_attempts
- assessment_answers
- assessment_results
- assessment_reviews

## 41.7 Trainer and Sessions

- trainer_profiles
- trainer_verifications
- trainer_services
- trainer_packages
- availability_rules
- availability_slots
- booking_holds
- bookings
- session_rooms
- session_participants
- session_events
- evaluations
- reviews

## 41.8 Company and Jobs

- companies
- company_verifications
- company_members
- company_roles
- jobs
- job_skills
- job_screening_questions
- saved_jobs
- job_alerts
- applications
- application_answers
- application_attachments
- candidate_invitations

## 41.9 Hiring

- hiring_campaigns
- hiring_stages
- campaign_candidates
- candidate_stage_history
- interview_schedules
- interview_panels
- interview_scorecards
- interview_feedback
- offers
- offer_versions
- offer_responses

## 41.10 Finance

- payment_orders
- payment_attempts
- payment_transactions
- payment_webhook_events
- refunds
- invoices
- wallets
- wallet_ledger
- commissions
- payout_accounts
- payout_batches
- payout_items
- subscriptions
- subscription_usage
- coupons
- coupon_redemptions

## 41.11 Engagement and Operations

- xp_ledger
- levels
- badges
- user_badges
- challenges
- leaderboard_snapshots
- conversations
- conversation_participants
- messages
- message_attachments
- message_reads
- notifications
- notification_preferences
- support_tickets
- moderation_reports
- moderation_actions
- audit_logs
- feature_flags
- system_settings

---

# 42. API Design Standards

- Base path: `/api/v1`
- JSON request and response
- OpenAPI documentation
- Cursor pagination for large feeds
- Consistent error format
- Request validation
- Idempotency for critical writes
- API versioning
- Correlation ID
- Rate limiting
- Audit metadata
- UTC timestamps in ISO 8601
- Country and language context
- Permission checks at API level

## 42.1 Main API Groups

- `/auth`
- `/users`
- `/candidates`
- `/career-passports`
- `/cvs`
- `/projects`
- `/skills`
- `/learning`
- `/courses`
- `/assessments`
- `/trainers`
- `/services`
- `/availability`
- `/bookings`
- `/sessions`
- `/evaluations`
- `/companies`
- `/jobs`
- `/applications`
- `/campaigns`
- `/interviews`
- `/offers`
- `/payments`
- `/wallets`
- `/payouts`
- `/subscriptions`
- `/gamification`
- `/leaderboards`
- `/messages`
- `/notifications`
- `/admin`

---

# 43. File and Media Management

Use object storage rather than application local disk.

File categories:

- Profile images
- CV exports
- Resume imports
- Certificates
- Project images
- Project videos
- Company documents
- KYC documents
- Course resources
- Assignment submissions
- Chat attachments
- Invoices
- Offer documents

Rules:

- Presigned upload
- File-size limits
- MIME validation
- Extension validation
- Malware scan
- Private bucket by default
- Signed download URLs
- Access-control check
- Retention policy
- File deletion workflow

---

# 44. Security Requirements

## 44.1 Authentication

- Short-lived access token
- Refresh-token rotation
- Refresh-token hash in database
- Secure HTTP-only cookie for web
- Secure storage for mobile
- Logout current device
- Logout all devices
- Session list
- Suspicious-login alert
- MFA for privileged users

## 44.2 Passwords

- Argon2id or approved strong hashing
- Password policy
- Breached-password check where available
- Rate limiting
- Account lock rules
- Secure reset flow

## 44.3 Application Security

- HTTPS only
- HSTS
- Secure headers
- Input validation
- Output encoding
- CSRF protection where cookie authentication applies
- SQL injection prevention
- XSS protection
- IDOR prevention
- SSRF controls
- Upload security
- Webhook signature verification
- Secrets manager
- Dependency scanning
- Container scanning
- Audit logs
- Least privilege

## 44.4 Privacy

- Consent records
- Privacy settings
- Data export
- Account deletion
- Retention schedule
- Restricted internal access
- Sensitive-document encryption
- Access log for private candidate data
- Legal policy versioning

---

# 45. Non-Functional Requirements

## 45.1 Performance

- Paginate all large lists
- Cache suitable reads
- Optimize database indexes
- Avoid N+1 queries
- Background-process heavy operations
- Use CDN for public static assets
- Establish measurable p95 targets per endpoint category

## 45.2 Scalability

- Stateless API
- Horizontal API scaling
- Separate workers
- Redis for cache and queue
- Read replicas when needed
- Database partitioning for very large event tables
- Search engine when justified
- Event streaming only when justified

## 45.3 Availability

- Health checks
- Readiness and liveness checks
- Automated backups
- Point-in-time recovery
- Restore testing
- Graceful shutdown
- Retry and dead-letter strategy
- Incident runbooks

## 45.4 Accessibility

- WCAG-oriented design
- Keyboard navigation
- Screen-reader labels
- Color contrast
- Caption support
- Reduced-motion option
- Accessible forms and errors

## 45.5 Observability

- Structured logs
- Metrics
- Tracing
- Error reporting
- Audit logs
- Uptime monitoring
- Alerting
- Business KPI monitoring

---

# 46. Testing Strategy

## 46.1 Test Layers

- Unit tests
- Service tests
- API integration tests
- Database integration tests
- Component tests
- End-to-end tests
- Mobile widget tests
- Mobile integration tests
- Payment sandbox tests
- Webhook replay tests
- Load tests
- Security tests
- User acceptance tests

## 46.2 Critical End-to-End Journeys

1. Candidate registration and verification
2. Profile and first CV completion
3. Project publication
4. Course enrollment and completion
5. Trainer onboarding and approval
6. Trainer package booking and payment
7. Session joining and evaluation
8. Trainer earning and payout
9. Company registration and verification
10. Job publishing
11. Candidate job application
12. Company pipeline progression
13. Interview scheduling
14. Offer acceptance
15. Candidate privacy access and revocation
16. Refund and dispute
17. Admin moderation

## 46.3 Security Tests

- Authentication bypass
- Authorization and IDOR
- Privilege escalation
- SQL injection
- XSS
- CSRF
- SSRF
- Malicious upload
- Rate-limit bypass
- Webhook replay
- Payment tampering
- Sensitive-data exposure
- Company cross-tenant access

---

# 47. Monitoring Technology

Recommended planning stack:

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Sentry
- Jaeger or compatible tracing backend
- Uptime monitoring
- PostgreSQL monitoring
- Redis monitoring

Monitor:

- API latency
- Error rate
- Queue delay
- Failed jobs
- Database connections
- Slow queries
- Payment failures
- Webhook failures
- Notification failures
- Video join failures
- Search performance
- Login anomalies
- Business conversion funnels

---

# 48. Development Phases

All features in this document are part of the master product scope, but they must not be built simultaneously.

## Phase 0 — Foundation

- Product decisions
- Repository
- Coding standards
- Local Docker infrastructure
- CI
- Environment management
- PostgreSQL
- Redis
- Object storage
- Authentication foundation
- Audit foundation

## Phase 1 — Identity and Candidate Foundation

- Authentication
- Verification
- RBAC
- Candidate profile
- Country and language configuration
- Career goals
- Privacy settings

## Phase 2 — CV and Portfolio

- CV builder
- Templates
- PDF export
- Project portfolio
- Skills
- Career Passport baseline

## Phase 3 — Trainer Marketplace

- Trainer onboarding
- Approval
- Service packages
- Availability
- Search
- Booking
- Payment
- Session
- Evaluation
- Wallet baseline

## Phase 4 — Learning and Assessment

- Career tracks
- Courses
- Lessons
- Quiz
- Assignment
- Course progress
- Certificate
- Assessments

## Phase 5 — Job Marketplace

- Company registration
- KYC
- Company members
- Job posting
- Job search
- Save job
- Job alerts
- Application

## Phase 6 — Hiring and ATS

- Talent search
- Hiring campaigns
- Configurable pipeline
- Interviews
- Scorecards
- Offers
- Hire status

## Phase 7 — Gamification and Readiness

- XP ledger
- Levels
- Badges
- Leaderboards
- Job-readiness breakdown
- Anti-abuse

## Phase 8 — Communication and Operations

- Chat
- Notification preferences
- Support
- Moderation
- Finance operations
- Reporting

## Phase 9 — Mobile Application

- Flutter candidate app
- Flutter trainer app functions
- Push notifications
- Mobile session flow
- Mobile job applications

## Phase 10 — Scale and Intelligence

- Advanced search
- Recommendation
- AI services
- Advanced analytics
- Read replicas
- Service extraction where justified

---

# 49. MVP Definition

The MVP should prove the core business loop:

```text
Candidate builds profile and CV
  ↓
Trainer provides paid preparation session
  ↓
Candidate receives evaluation
  ↓
Company publishes job
  ↓
Candidate applies
  ↓
Company reviews evidence and interviews candidate
  ↓
Candidate is hired
```

## 49.1 MVP Must-Have

- Authentication and verification
- Candidate profile
- Basic CV builder
- Basic project portfolio
- Trainer onboarding and approval
- Trainer packages and availability
- Booking and local payment
- Video session
- Evaluation
- Company onboarding and verification
- Job posting
- Job search
- Job application
- Basic hiring pipeline
- Notifications
- Admin approval and moderation
- Audit logs

## 49.2 Post-MVP

- Full learning system
- Advanced assessments
- Advanced Career Passport
- Company talent search
- Offers
- Full gamification
- Mobile app
- AI features
- Advanced subscriptions
- ATS integrations

---

# 50. Business Rules That Must Not Be Broken

1. A company cannot publish jobs requiring verification unless it is verified.
2. A candidate controls access to private Career Passport information.
3. A company cannot access another company’s private candidates, notes, jobs, or pipeline.
4. A trainer cannot evaluate a session not assigned to that trainer.
5. A booking slot cannot be sold twice.
6. Payment success must be confirmed by verified backend callback, not frontend redirect.
7. The same payment webhook cannot create duplicate financial entries.
8. XP cannot be awarded twice for the same event.
9. Submitted job applications preserve their CV snapshot.
10. Sensitive admin actions require audit logs.
11. Trainer earnings are not available before service-completion rules are satisfied.
12. Manual finance changes require reason and authorized permission.
13. Private files require authorization on every download.
14. Candidate ranking or readiness cannot be the only automated hiring decision.
15. Suspended users must be excluded from public discovery and sensitive operations.
16. Deleting a record must respect legal retention and finance audit requirements.
17. All monetary records include amount, currency, country context, and immutable ledger history.
18. Every cross-tenant query must be scoped by organization.
19. Every public profile field follows the user’s privacy setting.
20. Feature rollout must be controlled by feature flags where risk is high.

---

# 51. Success Metrics

## Candidate Metrics

- Profile completion
- CV completion
- Project publication
- Learning completion
- Interview improvement
- Job applications
- Interview invitations
- Offers
- Hires

## Trainer Metrics

- Approved trainers
- Active packages
- Booking conversion
- Session completion
- Evaluation completion
- Average rating
- Earnings
- Repeat bookings

## Company Metrics

- Verified companies
- Published jobs
- Applications per job
- Time to shortlist
- Time to hire
- Interview conversion
- Offer acceptance
- Hires

## Platform Metrics

- Monthly active users
- Retention
- Revenue
- Payment success
- Refund rate
- Support volume
- Moderation incidents
- Uptime
- API performance
- Country growth

---

# 52. Future Integrations

Potential future integrations:

- Google Calendar
- Microsoft Calendar
- GitHub
- LinkedIn data import where permitted
- External ATS
- Company HR systems
- Coding assessment platform
- Background verification
- Certificate verification
- University or training institute
- Video providers
- Accounting systems
- Tax and invoicing systems

Every integration must pass privacy, legal, security, and commercial review.

---

# 53. Product Governance

## 53.1 Requirement Changes

Any major feature change must update:

- Product requirement
- User flow
- Permission matrix
- Data model
- API contract
- Security review
- Test cases
- Release plan

## 53.2 Definition of Done

A feature is not complete until it includes:

- Approved requirement
- UI states
- Backend validation
- Authorization
- Error handling
- Audit requirement
- Tests
- Documentation
- Monitoring
- Migration and rollback plan
- Security review where necessary

## 53.3 Source of Truth

This document is the master product scope. Detailed implementation documents may be created per module, but they must not contradict this master document without an approved revision.

---

# 54. Final Product Statement

NextHire will be built as a scalable career and hiring ecosystem where candidates can:

- Learn
- Practise
- Build CVs
- Publish projects
- Prove skills
- Receive expert guidance
- Apply to jobs
- Be discovered by companies
- Attend interviews
- Receive offers
- Get hired

Companies will be able to:

- Build verified profiles
- Publish jobs
- Search talent
- Review evidence
- Invite candidates
- Run assessments
- Conduct interviews
- Manage hiring pipelines
- Issue offers
- Hire candidates

Trainers will be able to:

- Sell career services
- Conduct sessions
- Review CVs and projects
- Teach courses
- Assess candidates
- Build professional reputations
- Receive transparent earnings and payouts

The planned technical baseline is:

```text
Web: Next.js + TypeScript
API: NestJS + TypeScript
Mobile: Flutter + Dart
Database: PostgreSQL
Cache and Queue: Redis + BullMQ
Real-time: Socket.IO
Video: Agora or approved provider
Storage: S3-compatible object storage
Future AI: Python + FastAPI
Development: Local applications + Docker infrastructure
Production: Containerized applications + production-grade managed services
```

---

# 55. Revision History

| Version | Date       | Description                                                                                                              |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1.0.0   | 2026-05-23 | Initial NextHire mock interview and career development documentation                                                     |
| 2.0.0   | 2026-07-18 | Expanded into complete career-readiness, CV, portfolio, learning, job marketplace, talent discovery, and hiring platform |

---

**End of Master Document**
