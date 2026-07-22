import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import {
  ASSESSMENT_SCORING_VERSION,
  ASSESSMENT_SCORING_VERSION_LABEL,
  AssessmentAttemptResultStatus,
} from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';

type AttemptQuestionForScoring = Prisma.AssessmentAttemptQuestionGetPayload<{
  include: {
    options: true;
    answer: true;
  };
}>;

type AttemptForScoring = Prisma.AssessmentAttemptGetPayload<{
  include: {
    questions: {
      include: {
        options: true;
        answer: true;
      };
    };
  };
}>;

export interface ScoredAnswerResult {
  answerId: string | null;
  questionId: string;
  awardedPoints: Prisma.Decimal;
  isCorrect: boolean;
  isUnanswered: boolean;
}

export interface ScoredAttemptResult {
  scoreEarned: Prisma.Decimal;
  scorePossible: Prisma.Decimal;
  scorePercentage: Prisma.Decimal;
  resultStatus: AssessmentAttemptResultStatus;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionCount: number;
  scoringVersion: number;
  scoringVersionLabel: string;
  answerResults: ScoredAnswerResult[];
}

@Injectable()
export class AssessmentAttemptScoringService {
  scoreAttempt(attempt: AttemptForScoring): ScoredAttemptResult {
    this.validateSnapshotConsistency(attempt);

    const answerResults = attempt.questions.map((question) => this.scoreQuestion(question));
    const scoreEarned = answerResults.reduce(
      (sum, current) => sum.plus(current.awardedPoints),
      new Prisma.Decimal(0),
    );
    const scorePossible = new Prisma.Decimal(attempt.totalPointsSnapshot);

    if (scoreEarned.greaterThan(scorePossible)) {
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
    }

    const questionCount = answerResults.length;
    const correctCount = answerResults.filter((result) => result.isCorrect).length;
    const unansweredCount = answerResults.filter((result) => result.isUnanswered).length;
    const incorrectCount = questionCount - correctCount - unansweredCount;
    const percentageValue =
      scorePossible.equals(0)
        ? 0
        : Number(scoreEarned.div(scorePossible).mul(100).toDecimalPlaces(2).toString());
    const scorePercentage = new Prisma.Decimal(percentageValue.toFixed(2));
    const resultStatus =
      scorePercentage.greaterThanOrEqualTo(new Prisma.Decimal(attempt.passingScoreSnapshot))
        ? AssessmentAttemptResultStatus.PASSED
        : AssessmentAttemptResultStatus.FAILED;

    return {
      scoreEarned,
      scorePossible,
      scorePercentage,
      resultStatus,
      correctCount,
      incorrectCount,
      unansweredCount,
      questionCount,
      scoringVersion: ASSESSMENT_SCORING_VERSION,
      scoringVersionLabel: ASSESSMENT_SCORING_VERSION_LABEL,
      answerResults,
    };
  }

  private validateSnapshotConsistency(attempt: AttemptForScoring): void {
    const questionCount = attempt.questions.length;
    if (questionCount !== attempt.questionCountSnapshot) {
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
    }

    const pointsSum = attempt.questions.reduce(
      (sum, question) => sum.plus(new Prisma.Decimal(question.pointsSnapshot)),
      new Prisma.Decimal(0),
    );
    const scorePossible = new Prisma.Decimal(attempt.totalPointsSnapshot);

    if (!pointsSum.equals(scorePossible)) {
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
    }

    for (const question of attempt.questions) {
      const answer = question.answer;
      if (answer) {
        const uniqueOptionIds = new Set(answer.selectedOptionIds);
        if (uniqueOptionIds.size !== answer.selectedOptionIds.length) {
          throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
        }

        const validOptionIds = new Set(question.options.map((option) => option.id));
        for (const optionId of answer.selectedOptionIds) {
          if (!validOptionIds.has(optionId)) {
            throw new ConflictException(
              ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT,
            );
          }
        }
      }

      switch (question.typeSnapshot) {
        case 'SINGLE_CHOICE':
        case 'TRUE_FALSE': {
          const correctOptions = question.options.filter((option) => option.isCorrectSnapshot);
          if (question.options.length === 0 || correctOptions.length !== 1) {
            throw new ConflictException(
              ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT,
            );
          }
          break;
        }
        case 'MULTIPLE_CHOICE': {
          const correctOptions = question.options.filter((option) => option.isCorrectSnapshot);
          if (question.options.length === 0 || correctOptions.length === 0) {
            throw new ConflictException(
              ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT,
            );
          }
          break;
        }
        case 'SHORT_TEXT': {
          if (this.getAcceptedAnswers(question).length === 0) {
            throw new ConflictException(
              ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT,
            );
          }
          break;
        }
        default:
          throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
      }
    }
  }

  private scoreQuestion(question: AttemptQuestionForScoring): ScoredAnswerResult {
    const points = new Prisma.Decimal(question.pointsSnapshot);
    const answer = question.answer;
    const hasOptionAnswer = (answer?.selectedOptionIds.length ?? 0) > 0;
    const normalizedText = this.normalizeShortText(answer?.shortTextAnswer ?? null);
    const hasTextAnswer = normalizedText.length > 0;

    if (!hasOptionAnswer && !hasTextAnswer) {
      return {
        answerId: answer?.id ?? null,
        questionId: question.id,
        awardedPoints: new Prisma.Decimal(0),
        isCorrect: false,
        isUnanswered: true,
      };
    }

    let isCorrect = false;
    switch (question.typeSnapshot) {
      case 'SINGLE_CHOICE':
      case 'TRUE_FALSE':
      case 'MULTIPLE_CHOICE':
        isCorrect = this.selectionMatches(question);
        break;
      case 'SHORT_TEXT':
        isCorrect = this.shortTextMatches(question, normalizedText);
        break;
    }

    return {
      answerId: answer?.id ?? null,
      questionId: question.id,
      awardedPoints: isCorrect ? points : new Prisma.Decimal(0),
      isCorrect,
      isUnanswered: false,
    };
  }

  private selectionMatches(question: AttemptQuestionForScoring): boolean {
    const selected = new Set(question.answer?.selectedOptionIds ?? []);
    const correct = new Set(
      question.options.filter((option) => option.isCorrectSnapshot).map((option) => option.id),
    );

    if (selected.size !== correct.size) {
      return false;
    }

    for (const optionId of selected) {
      if (!correct.has(optionId)) {
        return false;
      }
    }

    return true;
  }

  private shortTextMatches(question: AttemptQuestionForScoring, normalizedAnswer: string): boolean {
    if (!normalizedAnswer) {
      return false;
    }

    return this.getAcceptedAnswers(question).some(
      (acceptedAnswer) => this.normalizeShortText(acceptedAnswer) === normalizedAnswer,
    );
  }

  private getAcceptedAnswers(question: AttemptQuestionForScoring): string[] {
    const rawValue = question.acceptedAnswersJson;
    if (!Array.isArray(rawValue)) {
      return [];
    }

    return rawValue.filter((value): value is string => typeof value === 'string');
  }

  private normalizeShortText(value: string | null): string {
    if (!value) {
      return '';
    }

    return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
  }
}
