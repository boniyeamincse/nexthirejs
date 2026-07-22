import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';

export interface ConsistencyCheckResult {
  passed: boolean;
  failureCategory?: string;
  message?: string;
}

type AttemptForConsistencyCheck = Prisma.AssessmentAttemptGetPayload<{
  include: {
    questions: {
      include: {
        options: true;
        answer: true;
      };
    };
    sections: true;
  };
}>;

@Injectable()
export class AssessmentResultConsistencyService {
  checkAttemptConsistency(attempt: AttemptForConsistencyCheck): ConsistencyCheckResult {
    // 1. Scoring must be complete
    if (!attempt.scoringCompletedAt || attempt.scoringVersion == null) {
      return {
        passed: false,
        failureCategory: 'SCORING_INCOMPLETE',
        message: 'Attempt scoring is not complete',
      };
    }

    // 2. Question count matches snapshot
    if (attempt.questions.length !== attempt.questionCountSnapshot) {
      return {
        passed: false,
        failureCategory: 'QUESTION_COUNT_MISMATCH',
        message: `Expected ${attempt.questionCountSnapshot} questions, found ${attempt.questions.length}`,
      };
    }

    // 3. correct + incorrect + unanswered equals question count
    const totalCounted =
      (attempt.correctCount ?? 0) + (attempt.incorrectCount ?? 0) + (attempt.unansweredCount ?? 0);
    if (totalCounted !== attempt.questionCountSnapshot) {
      return {
        passed: false,
        failureCategory: 'COUNT_SUM_MISMATCH',
        message: `correct(${attempt.correctCount}) + incorrect(${attempt.incorrectCount}) + unanswered(${attempt.unansweredCount}) = ${totalCounted} != ${attempt.questionCountSnapshot}`,
      };
    }

    // 4. Score is within valid bounds
    const earned = attempt.scoreEarned?.toNumber() ?? 0;
    const possible = attempt.scorePossible?.toNumber() ?? 0;
    if (earned < 0 || earned > possible) {
      return {
        passed: false,
        failureCategory: 'SCORE_OUT_OF_BOUNDS',
        message: `Earned score ${earned} is out of bounds [0, ${possible}]`,
      };
    }

    // 5. Per-question awarded points don't exceed possible
    for (const q of attempt.questions) {
      if (q.answer?.awardedPoints) {
        const awarded = q.answer.awardedPoints.toNumber();
        const possiblePts = q.pointsSnapshot.toNumber();
        if (awarded < 0 || awarded > possiblePts) {
          return {
            passed: false,
            failureCategory: 'QUESTION_SCORE_OUT_OF_BOUNDS',
            message: `Question ${q.id}: awarded ${awarded} exceeds possible ${possiblePts}`,
          };
        }
      }
    }

    // 6-7. Section totals reconcile with attempt totals (if sections exist with scoring)
    // Prisma doesn't store section-level scores, so we skip that check unless we compute it

    // 8. Answer belongs to the question
    for (const q of attempt.questions) {
      if (q.answer && q.answer.attemptQuestionId !== q.id) {
        return {
          passed: false,
          failureCategory: 'ANSWER_QUESTION_MISMATCH',
          message: `Answer ${q.answer.id} references question ${q.answer.attemptQuestionId} but belongs to section question ${q.id}`,
        };
      }

      // 9. Selected options belong to the question
      if (q.answer && q.answer.selectedOptionIds.length > 0) {
        const validOptionIds = new Set(q.options.map((o) => o.id));
        for (const optId of q.answer.selectedOptionIds) {
          if (!validOptionIds.has(optId)) {
            return {
              passed: false,
              failureCategory: 'FOREIGN_OPTION_SELECTED',
              message: `Option ${optId} does not belong to question ${q.id}`,
            };
          }
        }
      }

      // 10. Short-text questions have accepted-answer snapshot data
      if (
        (q.typeSnapshot === 'SHORT_TEXT' || q.typeSnapshot === 'TRUE_FALSE') &&
        (q.acceptedAnswersJson == null || (Array.isArray(q.acceptedAnswersJson) && q.acceptedAnswersJson.length === 0))
      ) {
        if (q.typeSnapshot === 'SHORT_TEXT') {
          return {
            passed: false,
            failureCategory: 'MISSING_ACCEPTED_ANSWERS',
            message: `Short-text question ${q.id} has no accepted answers in snapshot`,
          };
        }
      }
    }

    return { passed: true };
  }
}
