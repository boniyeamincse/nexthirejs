import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { SaveAssessmentDraftAnswerInput, SaveAssessmentDraftAnswerResult, AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentAttemptStateService } from './assessment-attempt-state.service';
import { AssessmentAttemptProgressService } from './assessment-attempt-progress.service';

@Injectable()
export class AssessmentAttemptAnswerService {
  private readonly logger = new Logger(AssessmentAttemptAnswerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stateService: AssessmentAttemptStateService,
    private readonly progressService: AssessmentAttemptProgressService,
  ) {}

  async saveDraftAnswer(
    candidateId: string,
    attemptId: string,
    questionId: string,
    input: SaveAssessmentDraftAnswerInput,
  ): Promise<SaveAssessmentDraftAnswerResult> {
    const { isExpired } = await this.stateService.enforceDeadlineAndStatus(attemptId, candidateId);
    
    if (isExpired) {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_EXPIRED);
    }

    const question = await this.prisma.assessmentAttemptQuestion.findUnique({
      where: { id: questionId, attemptId },
      include: {
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_QUESTION_NOT_FOUND);
    }

    // Validate ownership/options
    if (input.selectedOptionIds.length > 0) {
      const validOptionIds = new Set(question.options.map(o => o.id));
      for (const optId of input.selectedOptionIds) {
        if (!validOptionIds.has(optId)) {
          throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_ANSWER_INVALID);
        }
      }

      if (
        (question.typeSnapshot === 'SINGLE_CHOICE' || question.typeSnapshot === 'TRUE_FALSE') &&
        input.selectedOptionIds.length > 1
      ) {
        throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_ANSWER_INVALID);
      }

      if (question.typeSnapshot === 'SHORT_TEXT') {
        throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_ANSWER_INVALID);
      }
    } else if (input.shortTextAnswer && input.shortTextAnswer.trim().length > 0) {
      if (question.typeSnapshot !== 'SHORT_TEXT') {
        throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_ANSWER_INVALID);
      }
    }

    const now = new Date();

    const savedAnswer = await this.prisma.assessmentAttemptAnswer.upsert({
      where: { attemptQuestionId: questionId },
      create: {
        attemptId,
        attemptQuestionId: questionId,
        selectedOptionIds: input.selectedOptionIds,
        shortTextAnswer: input.shortTextAnswer,
        lastSavedAt: now,
      },
      update: {
        selectedOptionIds: input.selectedOptionIds,
        shortTextAnswer: input.shortTextAnswer,
        lastSavedAt: now,
      },
    });

    // Update last activity
    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { lastActivityAt: now },
    });

    const progress = await this.progressService.calculateProgress(attemptId);

    // Ensure we don't log the content of the answer in audit
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.answer_saved',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: {
        questionId,
        questionType: question.typeSnapshot,
        answeredCount: progress.answered,
      },
    });

    return {
      progress,
      savedAnswer: {
        selectedOptionIds: savedAnswer.selectedOptionIds,
        shortTextAnswer: savedAnswer.shortTextAnswer,
        lastSavedAt: savedAnswer.lastSavedAt.toISOString(),
      },
    };
  }

  async clearDraftAnswer(
    candidateId: string,
    attemptId: string,
    questionId: string,
  ): Promise<void> {
    const { isExpired } = await this.stateService.enforceDeadlineAndStatus(attemptId, candidateId);
    
    if (isExpired) {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_EXPIRED);
    }

    const question = await this.prisma.assessmentAttemptQuestion.findUnique({
      where: { id: questionId, attemptId },
    });

    if (!question) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_QUESTION_NOT_FOUND);
    }

    const answer = await this.prisma.assessmentAttemptAnswer.findUnique({
      where: { attemptQuestionId: questionId },
    });

    if (answer) {
      await this.prisma.assessmentAttemptAnswer.delete({
        where: { id: answer.id },
      });
    }

    const now = new Date();
    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { lastActivityAt: now },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.answer_cleared',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: {
        questionId,
      },
    });
  }
}
