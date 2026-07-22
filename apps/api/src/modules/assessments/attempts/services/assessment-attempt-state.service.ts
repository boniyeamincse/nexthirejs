import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AssessmentAttemptStatus, AuditActorType } from '@nexthire/types';

@Injectable()
export class AssessmentAttemptStateService {
  private readonly logger = new Logger(AssessmentAttemptStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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
      this.logger.log(`Attempt ${attemptId} for candidate ${candidateId} is overdue. Marking as EXPIRED.`);
      
      const updated = await this.prisma.assessmentAttempt.update({
        where: { id: attemptId, status: AssessmentAttemptStatus.IN_PROGRESS },
        data: {
          status: AssessmentAttemptStatus.EXPIRED,
          expiredAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.attempt.expired',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: {
          assessmentId: attempt.assessmentId,
          expiredAt: now.toISOString(),
        },
      });

      return { status: AssessmentAttemptStatus.EXPIRED, isExpired: true };
    }

    const isExpired = attempt.status === AssessmentAttemptStatus.EXPIRED || attempt.status === AssessmentAttemptStatus.SUBMITTED || attempt.status === AssessmentAttemptStatus.CANCELLED || isOverdue;

    return { status: attempt.status as AssessmentAttemptStatus, isExpired };
  }
}
