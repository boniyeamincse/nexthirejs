import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { SaveAssessmentDraftAnswerInput, SaveAssessmentDraftAnswerResult, AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentAttemptProgressService } from './assessment-attempt-progress.service';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class AssessmentAttemptAnswerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly progressService: AssessmentAttemptProgressService,
  ) {}

  async saveDraftAnswer(
    candidateId: string,
    attemptId: string,
    questionId: string,
    input: SaveAssessmentDraftAnswerInput,
  ): Promise<SaveAssessmentDraftAnswerResult> {
    const savedAnswer = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "AssessmentAttempt" WHERE id = ${attemptId} FOR UPDATE`;

      const attempt = await tx.assessmentAttempt.findFirst({
        where: { id: attemptId, candidateId },
        select: { id: true, status: true, deadlineAt: true },
      });

      if (!attempt) {
        throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_FOUND);
      }

      if (attempt.status !== 'IN_PROGRESS' || attempt.deadlineAt.getTime() <= Date.now()) {
        throw new ForbiddenException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_EXPIRED);
      }

      const question = await tx.assessmentAttemptQuestion.findFirst({
        where: { id: questionId, attemptId },
        include: {
          options: true,
        },
      });

      if (!question) {
        throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_QUESTION_NOT_FOUND);
      }

      this.validateDraftAnswer(question, input);

      const now = new Date();
      const hasMeaningfulAnswer = this.hasMeaningfulAnswer(input);
      const result = await tx.assessmentAttemptAnswer.upsert({
        where: { attemptQuestionId: questionId },
        create: {
          attemptId,
          attemptQuestionId: questionId,
          selectedOptionIds: input.selectedOptionIds,
          shortTextAnswer: input.shortTextAnswer,
          answeredAt: hasMeaningfulAnswer ? now : null,
          lastSavedAt: now,
        },
        update: {
          selectedOptionIds: input.selectedOptionIds,
          shortTextAnswer: input.shortTextAnswer,
          answeredAt: hasMeaningfulAnswer ? now : null,
          lastSavedAt: now,
        },
      });

      await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: { lastActivityAt: now },
      });

      return { question, answer: result };
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
        questionType: savedAnswer.question.typeSnapshot,
        answeredCount: progress.answered,
      },
    });

    return {
      progress,
      savedAnswer: {
        selectedOptionIds: savedAnswer.answer.selectedOptionIds,
        shortTextAnswer: savedAnswer.answer.shortTextAnswer,
        lastSavedAt: savedAnswer.answer.lastSavedAt.toISOString(),
      },
    };
  }

  async clearDraftAnswer(
    candidateId: string,
    attemptId: string,
    questionId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "AssessmentAttempt" WHERE id = ${attemptId} FOR UPDATE`;

      const attempt = await tx.assessmentAttempt.findFirst({
        where: { id: attemptId, candidateId },
        select: { id: true, status: true, deadlineAt: true },
      });

      if (!attempt) {
        throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_FOUND);
      }

      if (attempt.status !== 'IN_PROGRESS' || attempt.deadlineAt.getTime() <= Date.now()) {
        throw new ForbiddenException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_EXPIRED);
      }

      const question = await tx.assessmentAttemptQuestion.findFirst({
        where: { id: questionId, attemptId },
      });

      if (!question) {
        throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_QUESTION_NOT_FOUND);
      }

      const answer = await tx.assessmentAttemptAnswer.findUnique({
        where: { attemptQuestionId: questionId },
      });

      if (answer) {
        await tx.assessmentAttemptAnswer.delete({
          where: { id: answer.id },
        });
      }

      const now = new Date();
      await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: { lastActivityAt: now },
      });
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

  private validateDraftAnswer(
    question: Prisma.AssessmentAttemptQuestionGetPayload<{ include: { options: true } }>,
    input: SaveAssessmentDraftAnswerInput,
  ) {
    if (input.selectedOptionIds.length > 0) {
      const validOptionIds = new Set(question.options.map((option) => option.id));
      for (const optionId of input.selectedOptionIds) {
        if (!validOptionIds.has(optionId)) {
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
  }

  private hasMeaningfulAnswer(input: SaveAssessmentDraftAnswerInput) {
    return input.selectedOptionIds.length > 0 || Boolean(input.shortTextAnswer?.trim());
  }
}
