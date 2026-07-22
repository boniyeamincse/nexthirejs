import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  AssessmentAttemptFinalizationReason,
  AssessmentAttemptWorkspace,
  AssessmentQuestionType,
} from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentAttemptStateService } from './assessment-attempt-state.service';
import { AssessmentAttemptProgressService } from './assessment-attempt-progress.service';
import { AssessmentAttemptFinalizationService } from './assessment-attempt-finalization.service';

@Injectable()
export class AssessmentAttemptWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: AssessmentAttemptStateService,
    private readonly progressService: AssessmentAttemptProgressService,
    private readonly finalizationService: AssessmentAttemptFinalizationService,
  ) {}

  async getWorkspace(
    candidateId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptWorkspace> {
    const { status } = await this.stateService.enforceDeadlineAndStatus(attemptId, candidateId);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId, candidateId },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
                answer: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_FOUND);
    }

    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000));

    const progress = await this.progressService.calculateProgress(attemptId);
    const isFinalized = attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED';
    const submissionSummary =
      isFinalized && attempt.scoringCompletedAt
        ? await this.finalizationService.getSubmissionSummary(candidateId, attemptId)
        : null;

    return {
      attempt: {
        id: attempt.id,
        assessmentId: attempt.assessmentId,
        title: attempt.assessmentTitleSnapshot,
        instructions: attempt.instructionsSnapshot,
        status: status,
        publicationVersion: attempt.assessmentPublicationVersion,
        startedAt: attempt.startedAt.toISOString(),
        deadlineAt: attempt.deadlineAt.toISOString(),
        serverNow: now.toISOString(),
        remainingSeconds: isFinalized ? 0 : remainingSeconds,
        questionCount: attempt.questionCountSnapshot,
        totalPoints: attempt.totalPointsSnapshot.toNumber(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        finalizationReason:
          attempt.finalizationReason as AssessmentAttemptFinalizationReason | null,
        scoringVersion: attempt.scoringVersion,
      },
      sections: attempt.sections.map(section => ({
        id: section.id,
        title: section.titleSnapshot,
        description: section.descriptionSnapshot,
        instructions: section.instructionsSnapshot,
        sortOrder: section.sortOrder,
        questions: section.questions.map(q => ({
          id: q.id,
          type: q.typeSnapshot as AssessmentQuestionType,
          prompt: q.promptSnapshot,
          points: q.pointsSnapshot.toNumber(),
          isRequired: q.isRequired,
          sortOrder: q.sortOrder,
          options: q.options.map(o => ({
            id: o.id,
            label: o.labelSnapshot,
            sortOrder: o.sortOrder,
          })),
          draftAnswer: q.answer
            ? {
                selectedOptionIds: q.answer.selectedOptionIds,
                shortTextAnswer: q.answer.shortTextAnswer,
                lastSavedAt: q.answer.lastSavedAt.toISOString(),
              }
            : null,
        })),
      })),
      progress,
      submissionSummary,
    };
  }
}
