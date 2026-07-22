import { Injectable, Logger, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType, StartAssessmentAttemptResult, AssessmentAttemptStatus } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentAttemptSnapshotService } from './assessment-attempt-snapshot.service';

@Injectable()
export class AssessmentAttemptStartService {
  private readonly logger = new Logger(AssessmentAttemptStartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly snapshotService: AssessmentAttemptSnapshotService,
  ) {}

  async startOrResumeAttempt(
    candidateId: string,
    assessmentIdOrSlug: string,
  ): Promise<StartAssessmentAttemptResult> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const assessment = await this.prisma.assessment.findFirst({
      where: uuidRegex.test(assessmentIdOrSlug) ? { id: assessmentIdOrSlug } : { slug: assessmentIdOrSlug },
      select: { id: true, status: true, availability: true },
    });

    if (!assessment) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_NOT_FOUND);
    }

    if (assessment.status !== 'PUBLISHED' || assessment.availability !== 'AVAILABLE') {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_START_NOT_ALLOWED);
    }

    // Check for existing active attempt
    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: {
        candidateId,
        assessmentId: assessment.id,
        status: AssessmentAttemptStatus.IN_PROGRESS,
      },
    });

    if (existing) {
      const isOverdue = existing.deadlineAt < new Date();
      if (isOverdue) {
        // Handled by state service later, but let's just return it as EXPIRED conceptually, or let the state service handle it.
        // Actually, if it's overdue, they shouldn't be able to resume it. They should get the workspace which will show it's expired.
      }

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.attempt.resumed',
        targetType: 'AssessmentAttempt',
        targetId: existing.id,
        metadata: { assessmentId: assessment.id },
      });

      return {
        attemptId: existing.id,
        created: false,
        status: existing.status as AssessmentAttemptStatus,
        deadlineAt: existing.deadlineAt.toISOString(),
      };
    }

    // No active attempt, create a new one transactionally
    const attemptId = await this.snapshotService.createSnapshotTransactionally(candidateId, assessment.id);

    const newAttempt = await this.prisma.assessmentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.started',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: { assessmentId: assessment.id },
    });

    return {
      attemptId: newAttempt.id,
      created: true,
      status: newAttempt.status as AssessmentAttemptStatus,
      deadlineAt: newAttempt.deadlineAt.toISOString(),
    };
  }

  async getActiveAttempt(
    candidateId: string,
    assessmentIdOrSlug: string,
  ): Promise<{ attemptId: string } | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const assessment = await this.prisma.assessment.findFirst({
      where: uuidRegex.test(assessmentIdOrSlug)
        ? { id: assessmentIdOrSlug }
        : { slug: assessmentIdOrSlug },
      select: { id: true },
    });

    if (!assessment) {
      return null;
    }

    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: {
        candidateId,
        assessmentId: assessment.id,
        status: AssessmentAttemptStatus.IN_PROGRESS,
      },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return { attemptId: existing.id };
  }
}
