# Assessment Answer Review

## Overview

After an assessment attempt is finalized and scored, candidates can review their results in detail. This document describes how candidate answers, correct answers, and explanations are displayed.

## Data Sources

| Display Item | Source |
|-------------|--------|
| Prompt | `AssessmentAttemptQuestion.promptSnapshot` |
| Options | `AssessmentAttemptQuestionOption` (snapshot) |
| Candidate answer | `AssessmentAttemptAnswer.selectedOptionIds` or `shortTextAnswer` |
| Correct answer | `AssessmentAttemptQuestionOption.isCorrectSnapshot` (for choice types) |
| Correct answer | `AssessmentAttemptQuestion.acceptedAnswersJson` (for SHORT_TEXT types) |
| Awarded points | `AssessmentAttemptAnswer.awardedPoints` |
| Outcome (correct/incorrect/unanswered) | `AssessmentAttemptAnswer.isCorrect` + presence of answer |
| Explanation | `AssessmentAttemptQuestion.explanationSnapshot` |

## Outcome Determination

| Condition | Outcome |
|-----------|---------|
| No answer record | UNANSWERED |
| `isCorrect = true` | CORRECT |
| `isCorrect = false` and answer exists | INCORRECT |

## Display Rules

1. Unanswered questions show "UNANSWERED" label with 0 points
2. Correct answers always shown (snapshot, after finalization)
3. Explanations shown after finalization; null explanation shows "No explanation provided."
4. Option display shows per-option state: selected by candidate, is correct, both, or neither
5. Short-text answers show candidate's text and accepted answers
6. Source assessment edits do not alter historical result display
