# Phase 2: Scoring Rules

## Supported Question Types and Scoring

### Single Choice (`SINGLE_CHOICE`)

- The candidate selects exactly one option from a list.
- **Full points** are awarded if the selected option matches the single correct answer.
- Zero points otherwise.

### Multiple Choice (`MULTIPLE_CHOICE`)

- The candidate selects zero or more options from a list.
- **Full points** are awarded only if:
  - All correct options are selected, AND
  - No incorrect options are selected.
- Zero points for any other combination (including partial selection of correct answers).

### True/False (`TRUE_FALSE`)

- The candidate selects either `true` or `false`.
- **Full points** are awarded if the selection matches the correct answer.
- Zero points otherwise.

### Short Text (`SHORT_TEXT`)

- The candidate enters a free-text response.
- **Full points** are awarded if the response exactly matches one of the `acceptedAnswers` defined in the snapshot.
- Matching is **case-sensitive** after normalization (trimmed whitespace, no HTML entities).
- Zero points if no match is found among `acceptedAnswers`.

## General Scoring Rules

### No Partial Credit

- All question types award **either full points or zero points**.
- No partial credit is given for close answers, partially correct multiple-choice selections, or near-miss short text responses.

### No Negative Marking

- Incorrect answers do not deduct points.
- The minimum score for any question is zero.

### Score Calculation

- `totalPoints` = sum of all question point values in the snapshot
- `scoreEarned` = sum of points for correctly answered questions
- `scorePercentage` = (`scoreEarned` / `totalPoints`) * 100

### Decimal-Safe Arithmetic

- `totalPoints` and `scoreEarned` are stored as Prisma `Decimal` types.
- All arithmetic operations use decimal-safe computations to avoid floating-point precision errors.
- Division and multiplication maintain precision through the decimal type's internal representation.

### Pass/Fail Threshold

- The passing threshold is stored in the snapshot as `passingScoreSnapshot` (a percentage value, 0-100).
- A candidate passes if: `scorePercentage >= passingScoreSnapshot`
- A candidate fails if: `scorePercentage < passingScoreSnapshot`
- The comparison is exact decimal comparison, not integer-rounded.

### Scoring Version

- Each snapshot records a `scoringVersion` field.
- This allows the system to handle future scoring rule changes gracefully by knowing which version of the rules applied to each attempt.
- Current scoring version is `1`.

### Snapshot Data Is Authoritative

- All scoring uses data from the **snapshot**, not the source assessment.
- Modifications to the source assessment after an attempt has started do not affect scoring.
- This guarantees deterministic, reproducible scoring regardless of when scoring occurs.
