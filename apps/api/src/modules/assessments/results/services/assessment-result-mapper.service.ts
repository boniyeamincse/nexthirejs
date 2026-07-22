import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import type {
  AssessmentAttemptHistoryItem,
  AssessmentAttemptResultDetail,
  AssessmentResultSection,
  AssessmentResultQuestion,
  AssessmentResultQuestionOption,
  AssessmentResultAnswer,
  AssessmentAttemptFinalizationReason,
  AssessmentAttemptResultStatus,
  AssessmentType,
  AssessmentDifficulty,
  AssessmentQuestionType,
} from '@nexthire/types';

type AttemptWithFullData = Prisma.AssessmentAttemptGetPayload<{
  include: {
    questions: {
      include: {
        options: { orderBy: { sortOrder: 'asc' } };
        answer: true;
      };
      orderBy: { sortOrder: 'asc' };
    };
    sections: { orderBy: { sortOrder: 'asc' } };
  };
}>;

@Injectable()
export class AssessmentResultMapperService {
  toHistoryItem(attempt: AttemptWithFullData, categoryName: string | null): AssessmentAttemptHistoryItem {
    const durationSeconds = attempt.submittedAt
      ? Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    return {
      attemptId: attempt.id,
      assessment: {
        id: attempt.assessmentId,
        slug: attempt.assessmentSlugSnapshot,
        title: attempt.assessmentTitleSnapshot,
        categoryName,
        type: 'PRACTICE' as AssessmentType,
        difficulty: 'INTERMEDIATE' as AssessmentDifficulty,
        publicationVersion: attempt.assessmentPublicationVersion,
      },
      result: {
        scoreEarned: attempt.scoreEarned?.toNumber() ?? 0,
        scorePossible: attempt.scorePossible?.toNumber() ?? 0,
        percentage: attempt.scorePercentage?.toNumber() ?? 0,
        status: (attempt.resultStatus as AssessmentAttemptResultStatus) ?? 'FAILED',
        correctCount: attempt.correctCount ?? 0,
        incorrectCount: attempt.incorrectCount ?? 0,
        unansweredCount: attempt.unansweredCount ?? 0,
        questionCount: attempt.questionCountSnapshot,
      },
      finalizationReason: attempt.finalizationReason as AssessmentAttemptFinalizationReason,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? attempt.startedAt.toISOString(),
      durationSeconds,
    };
  }

  toDetailResult(attempt: AttemptWithFullData): AssessmentAttemptResultDetail {
    const durationSeconds = attempt.submittedAt
      ? Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    const sections = this.mapSections(attempt);

    return {
      attempt: {
        id: attempt.id,
        assessmentId: attempt.assessmentId,
        title: attempt.assessmentTitleSnapshot,
        slug: attempt.assessmentSlugSnapshot,
        publicationVersion: attempt.assessmentPublicationVersion,
        finalizationReason: attempt.finalizationReason as AssessmentAttemptFinalizationReason,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? attempt.startedAt.toISOString(),
        durationSeconds,
      },
      result: {
        scoreEarned: attempt.scoreEarned?.toNumber() ?? 0,
        scorePossible: attempt.scorePossible?.toNumber() ?? 0,
        percentage: attempt.scorePercentage?.toNumber() ?? 0,
        resultStatus: (attempt.resultStatus as AssessmentAttemptResultStatus) ?? 'FAILED',
        passingScorePercentage: attempt.passingScoreSnapshot,
        correctCount: attempt.correctCount ?? 0,
        incorrectCount: attempt.incorrectCount ?? 0,
        unansweredCount: attempt.unansweredCount ?? 0,
        questionCount: attempt.questionCountSnapshot,
        scoringVersion: attempt.scoringVersion ?? 0,
      },
      sections,
    };
  }

  private mapSections(attempt: AttemptWithFullData): AssessmentResultSection[] {
    const sectionMap = new Map<string, AssessmentResultQuestion[]>();
    const sectionMeta = new Map<string, { title: string; sortOrder: number }>();

    for (const section of attempt.sections) {
      sectionMeta.set(section.id, { title: section.titleSnapshot, sortOrder: section.sortOrder });
      sectionMap.set(section.id, []);
    }

    let questionNumber = 0;
    for (const q of attempt.questions) {
      questionNumber++;
      const sectionId = q.attemptSectionId;
      if (!sectionMap.has(sectionId)) {
        continue;
      }

      const mapped = this.mapQuestion(q, questionNumber);
      sectionMap.get(sectionId)!.push(mapped);
    }

    const sections: AssessmentResultSection[] = [];
    for (const section of attempt.sections) {
      const questions = sectionMap.get(section.id) ?? [];
      let scoreEarned = 0;
      let scorePossible = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      for (const q of questions) {
        scoreEarned += q.pointsAwarded;
        scorePossible += q.pointsPossible;
        if (q.outcome === 'CORRECT') correctCount++;
        else if (q.outcome === 'INCORRECT') incorrectCount++;
        else unansweredCount++;
      }

      sections.push({
        id: section.id,
        title: section.titleSnapshot,
        sortOrder: section.sortOrder,
        scoreEarned,
        scorePossible,
        correctCount,
        incorrectCount,
        unansweredCount,
        questions,
      });
    }

    return sections;
  }

  private mapQuestion(
    q: Prisma.AssessmentAttemptQuestionGetPayload<{
      include: { options: { orderBy: { sortOrder: 'asc' } }; answer: true };
    }>,
    number: number,
  ): AssessmentResultQuestion {
    const pointsAwarded = q.answer?.awardedPoints?.toNumber() ?? 0;
    const pointsPossible = q.pointsSnapshot.toNumber();
    const isUnanswered = !q.answer || (!q.answer.selectedOptionIds.length && !q.answer.shortTextAnswer);

    let outcome: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
    if (isUnanswered) {
      outcome = 'UNANSWERED';
    } else if (q.answer?.isCorrect === true) {
      outcome = 'CORRECT';
    } else {
      outcome = 'INCORRECT';
    }

    const options: AssessmentResultQuestionOption[] = q.options.map((opt) => ({
      id: opt.id,
      label: opt.labelSnapshot,
      sortOrder: opt.sortOrder,
      selectedByCandidate: q.answer?.selectedOptionIds?.includes(opt.id) ?? false,
      isCorrect: opt.isCorrectSnapshot,
    }));

    let candidateAnswer: AssessmentResultAnswer | null = null;
    if (q.answer?.selectedOptionIds?.length) {
      candidateAnswer = {
        kind: 'OPTIONS',
        optionIds: q.answer.selectedOptionIds,
      };
    } else if (q.answer?.shortTextAnswer) {
      candidateAnswer = {
        kind: 'SHORT_TEXT',
        text: q.answer.shortTextAnswer,
      };
    }

    let correctAnswer: AssessmentResultAnswer;
    if (
      q.typeSnapshot === 'SHORT_TEXT' ||
      q.typeSnapshot === 'TRUE_FALSE'
    ) {
      const accepted = q.acceptedAnswersJson as string[] | null;
      correctAnswer = {
        kind: 'SHORT_TEXT',
        acceptedAnswers: accepted ?? [],
      };
    } else {
      correctAnswer = {
        kind: 'OPTIONS',
        optionIds: q.options.filter((o) => o.isCorrectSnapshot).map((o) => o.id),
      };
    }

    return {
      id: q.id,
      number,
      type: q.typeSnapshot as AssessmentQuestionType,
      prompt: q.promptSnapshot,
      pointsPossible,
      pointsAwarded,
      outcome,
      candidateAnswer,
      correctAnswer,
      explanation: q.explanationSnapshot,
      options,
    };
  }
}
