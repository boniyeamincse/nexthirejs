import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AssessmentAttemptStatus } from '@nexthire/types';
import { AssessmentAttemptFinalizationService } from './assessment-attempt-finalization.service';

@Injectable()
export class AssessmentAttemptStateService {
  private readonly logger = new Logger(AssessmentAttemptStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly finalizationService: AssessmentAttemptFinalizationService,
  ) {}

  async enforceDeadlineAndStatus(
    attemptId: string,
    candidateId: string,
  ): Promise<{ status: AssessmentAttemptStatus; isExpired: boolean }> {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId, candidateId },
      select: {
        id: true,
        assessmentId: true,
        status: true,
        deadlineAt: true,
        candidateId: true,
      },
    });

    if (!attempt) {
      return { status: AssessmentAttemptStatus.CANCELLED, isExpired: true }; // Or handle not found externally
    }

    const now = new Date();
    const isOverdue = attempt.deadlineAt < now;

    if (attempt.status === AssessmentAttemptStatus.IN_PROGRESS && isOverdue) {
      this.logger.log(`Attempt ${attemptId} for candidate ${candidateId} is overdue. Finalizing.`);

      const finalized = await this.finalizationService.finalizeOverdueAttempt(candidateId, attemptId);
      if (finalized) {
        return { status: finalized.status, isExpired: true };
      }
    }

    const isExpired =
      attempt.status === AssessmentAttemptStatus.EXPIRED ||
      attempt.status === AssessmentAttemptStatus.SUBMITTED ||
      attempt.status === AssessmentAttemptStatus.CANCELLED ||
      isOverdue;

    return { status: attempt.status as AssessmentAttemptStatus, isExpired };
  }
}
