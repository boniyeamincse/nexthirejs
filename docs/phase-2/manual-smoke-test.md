# Phase 2: Manual Smoke Test

## Prerequisites

- NextHire application running locally at `http://localhost:3000`
- A manager account for creating assessments
- Test candidate: `candidate@example.com` / `Password123!`
- Obtain auth tokens by logging in and storing the session cookie or bearer token

### Helper: Login

```bash
# Login as manager (for Scenarios A)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"Password123!"}' \
  -c /tmp/manager-cookies.txt

# Login as candidate (for Scenarios B-G)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@example.com","password":"Password123!"}' \
  -c /tmp/candidate-cookies.txt
```

---

## Scenario A: Manager Creates and Publishes Assessment

### Step 1: Create a category

```bash
curl -X POST http://localhost:3000/api/assessments/admin/categories \
  -H "Content-Type: application/json" \
  -b /tmp/manager-cookies.txt \
  -d '{"name":"JavaScript Basics","description":"Fundamental JavaScript concepts"}'
```

Expected: `201 Created` with category object containing `id`.

### Step 2: Create a question

```bash
curl -X POST http://localhost:3000/api/assessments/admin/questions \
  -H "Content-Type: application/json" \
  -b /tmp/manager-cookies.txt \
  -d '{
    "categoryId": "<CATEGORY_ID>",
    "type": "SINGLE_CHOICE",
    "prompt": "What is the output of typeof null?",
    "options": ["null", "undefined", "object", "number"],
    "correctAnswer": "object",
    "points": 10
  }'
```

Expected: `201 Created` with question object containing `id`.

### Step 3: Create an assessment

```bash
curl -X POST http://localhost:3000/api/assessments/admin \
  -H "Content-Type: application/json" \
  -b /tmp/manager-cookies.txt \
  -d '{
    "title": "JavaScript Fundamentals Quiz",
    "description": "Test your JavaScript basics",
    "estimatedDurationMinutes": 30,
    "passingScore": 70
  }'
```

Expected: `201 Created` with assessment object containing `id`.

### Step 4: Add a section with the question

```bash
curl -X POST http://localhost:3000/api/assessments/admin/<ASSESSMENT_ID>/sections \
  -H "Content-Type: application/json" \
  -b /tmp/manager-cookies.txt \
  -d '{
    "title": "Core Concepts",
    "order": 1,
    "questionIds": ["<QUESTION_ID>"]
  }'
```

Expected: `201 Created`.

### Step 5: Publish the assessment

```bash
curl -X POST http://localhost:3000/api/assessments/admin/<ASSESSMENT_ID>/publish \
  -b /tmp/manager-cookies.txt
```

Expected: `200 OK` with assessment status changed to `PUBLISHED`.

### Step 6: Assign to candidate

```bash
curl -X POST http://localhost:3000/api/assessments/admin/<ASSESSMENT_ID>/assignments \
  -H "Content-Type: application/json" \
  -b /tmp/manager-cookies.txt \
  -d '{
    "candidateEmail": "candidate@example.com",
    "maxAttempts": 3,
    "cooldownHours": 24
  }'
```

Expected: `201 Created` with assignment object containing `id`.

### Step 7: Verify in catalog (as candidate)

```bash
curl http://localhost:3000/api/assessments/catalog \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with the published assessment in the list.

---

## Scenario B: Candidate Starts Attempt, Saves Answers, Resumes, Checks Deadline

### Step 1: Start attempt

```bash
curl -X POST http://localhost:3000/api/assessments/attempts \
  -H "Content-Type: application/json" \
  -b /tmp/candidate-cookies.txt \
  -d '{"assignmentId": "<ASSIGNMENT_ID>"}'
```

Expected: `201 Created` with attempt object containing `id` and snapshot questions.

### Step 2: Save answers

```bash
curl -X POST http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID>/answers \
  -H "Content-Type: application/json" \
  -b /tmp/candidate-cookies.txt \
  -d '{
    "answers": [
      {"questionId": "<QUESTION_ID>", "value": "object"}
    ]
  }'
```

Expected: `200 OK`.

### Step 3: Resume attempt (fetch attempt details)

```bash
curl http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID> \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with attempt data and previously saved answers.

### Step 4: Check deadline

```bash
curl http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID>/deadline \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with deadline timestamp and remaining time in minutes.

---

## Scenario C: Candidate Submits, Verifies Score, Attempts Re-submit

### Step 1: Submit the attempt

```bash
curl -X POST http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID>/submit \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with submission confirmation and score.

### Step 2: Verify score

```bash
curl http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID>/result \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with `scoreEarned`, `totalPoints`, `scorePercentage`, and `passed` boolean.

### Step 3: Attempt re-submit

```bash
curl -X POST http://localhost:3000/api/assessments/attempts/<ATTEMPT_ID>/submit \
  -b /tmp/candidate-cookies.txt
```

Expected: `409 Conflict` - submit is rejected because the attempt is already submitted.

---

## Scenario D: Candidate Views History and Detail Review

### Step 1: View result history

```bash
curl "http://localhost:3000/api/assessments/results?page=1&limit=10" \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with paginated list of past results.

### Step 2: View per-question detail

```bash
curl http://localhost:3000/api/assessments/results/<ATTEMPT_ID>/detail \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with per-question breakdown showing question prompt, candidate's answer, correct answer, points awarded.

---

## Scenario E: Candidate Checks Performance, Opts In to Leaderboard, Sees Rank

### Step 1: Check performance report

```bash
curl http://localhost:3000/api/assessments/performance \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with total attempts, pass/fail counts, average score.

### Step 2: Check leaderboard status

```bash
curl http://localhost:3000/api/assessments/leaderboard/status \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with current opt-in status and display alias (if set).

### Step 3: Opt in to leaderboard

```bash
curl -X POST http://localhost:3000/api/assessments/leaderboard/opt-in \
  -H "Content-Type: application/json" \
  -b /tmp/candidate-cookies.txt \
  -d '{"displayAlias": "JSCandidate42"}'
```

Expected: `200 OK` confirming opt-in.

### Step 4: See rank

```bash
curl http://localhost:3000/api/assessments/leaderboard/<ASSESSMENT_ID>/rank \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with the candidate's rank on the leaderboard.

### Step 5: View leaderboard

```bash
curl "http://localhost:3000/api/assessments/leaderboard/<ASSESSMENT_ID>?page=1&limit=20" \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with ranked list of candidates (only those who opted in).

### Step 6: Opt out

```bash
curl -X POST http://localhost:3000/api/assessments/leaderboard/opt-out \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` confirming immediate removal.

---

## Scenario F: Candidate Checks Retake Eligibility, Cooldown, Starts Retake

### Step 1: Check retake eligibility

```bash
curl http://localhost:3000/api/assessments/retakes/<ASSIGNMENT_ID>/eligibility \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with `eligible` boolean, `attemptsUsed`, `maxAttempts`, `cooldownRemaining` (if applicable).

### Step 2: Start retake (may fail if cooldown active)

```bash
curl -X POST http://localhost:3000/api/assessments/retakes/<ASSIGNMENT_ID>/start \
  -b /tmp/candidate-cookies.txt
```

Expected:
- If eligible: `201 Created` with new attempt ID.
- If cooldown active: `429 Too Many Requests` with `cooldownRemaining` in the response.

---

## Scenario G: Certificate Issuance, Download, and Public Verification

### Step 1: Issue certificate (for a passed attempt)

```bash
curl -X POST http://localhost:3000/api/assessments/certificates/<ATTEMPT_ID>/issue \
  -b /tmp/candidate-cookies.txt
```

Expected: `201 Created` with certificate object in `PENDING` status.

### Step 2: Check certificate status (poll until READY)

```bash
curl http://localhost:3000/api/assessments/certificates \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with certificate list. Status transitions: `PENDING` -> `GENERATING` -> `READY`.

### Step 3: Get certificate details

```bash
curl http://localhost:3000/api/assessments/certificates/<CERTIFICATE_ID> \
  -b /tmp/candidate-cookies.txt
```

Expected: `200 OK` with certificate details, including verification code and download URL.

### Step 4: Download certificate PDF

```bash
curl http://localhost:3000/api/assessments/certificates/<CERTIFICATE_ID>/download \
  -b /tmp/candidate-cookies.txt \
  -o /tmp/certificate.pdf
```

Expected: `200 OK` with PDF file. Verify the file is a valid PDF (`file /tmp/certificate.pdf` should show "PDF document").

### Step 5: Public verification

Extract the verification code from the certificate details response, then:

```bash
curl http://localhost:3000/api/public/verify/<VERIFICATION_CODE>
```

Expected: `200 OK` with candidate name, assessment title, and issue date (no email, no score).

### Step 6: Verify non-existent code

```bash
curl http://localhost:3000/api/public/verify/0000000000000000000000000000000000000000000000000000000000000000
```

Expected: `404 Not Found`.
