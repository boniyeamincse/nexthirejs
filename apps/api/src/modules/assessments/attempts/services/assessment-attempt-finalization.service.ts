import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import {
  AuditActorType,
  AssessmentAttemptStatus,
  AssessmentAttemptFinalizationReason,
  AssessmentAttemptResultStatus,
  type AssessmentAttemptSubmissionResult,
} from '@nexthire/types';
import { AssessmentAttemptScoringService } from './assessment-attempt-scoring.service';
import { CERTIFICATE_QUEUE, GENERATE_CERTIFICATE_JOB } from '../../../../infrastructure/queue/queue.constants';

type LockedAttempt = Prisma.AssessmentAttemptGetPayload<{
  include: {
    questions: {
      include: {
        options: true;
        answer: true;
      };
    };
  };
}>;

type FinalizedAttemptSummaryShape = {
  id: string;
  status: string;
  finalizationReason: string | null;
  submittedAt: Date | null;
  scoreEarned: Prisma.Decimal | null;
  scorePossible: Prisma.Decimal | null;
  scorePercentage: Prisma.Decimal | null;
  resultStatus: string | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  questionCountSnapshot: number;
  scoringVersion: number | null;
  scoringCompletedAt: Date | null;
};

@Injectable()
export class AssessmentAttemptFinalizationService {
  private readonly logger = new Logger(AssessmentAttemptFinalizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly scoringService: AssessmentAttemptScoringService,
    @InjectQueue(CERTIFICATE_QUEUE) private readonly certificateQueue: Queue,
  ) {}

  async finalizeCandidateSubmission(
    candidateId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptSubmissionResult> {
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.submission_requested',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: { attemptId },
    });

    try {
      const summary = await this.prisma.$transaction((tx) =>
        this.finalizeWithinTransaction(tx, candidateId, attemptId, 'candidate_submit'),
      );

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action:
          summary.finalizationReason === AssessmentAttemptFinalizationReason.DEADLINE_REACHED
            ? 'assessment.attempt.deadline_finalized'
            : 'assessment.attempt.submitted',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: this.toAuditMetadata(summary),
      });

      return summary;
    } catch (error) {
      await this.recordScoringFailure(candidateId, attemptId, error);
      throw error;
    }
  }

  async finalizeOverdueAttempt(
    candidateId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptSubmissionResult | null> {
    try {
      const summary = await this.prisma.$transaction((tx) =>
        this.finalizeWithinTransaction(tx, candidateId, attemptId, 'deadline_enforcement'),
      );

      if (summary.finalizationReason === AssessmentAttemptFinalizationReason.DEADLINE_REACHED) {
        await this.auditService.recordBestEffort({
          actorType: AuditActorType.USER,
          actorUserId: candidateId,
          action: 'assessment.attempt.deadline_finalized',
          targetType: 'AssessmentAttempt',
          targetId: attemptId,
          metadata: this.toAuditMetadata(summary),
        });
      }

      return summary;
    } catch (error) {
      if (error instanceof BadRequestException) {
        return null;
      }

      await this.recordScoringFailure(candidateId, attemptId, error);
      throw error;
    }
  }

  async getSubmissionSummary(
    candidateId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptSubmissionResult> {
    const finalized = await this.finalizeOverdueAttempt(candidateId, attemptId);
    if (finalized) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.attempt.submission_summary_viewed',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: this.toAuditMetadata(finalized),
      });
      return finalized;
    }

    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, candidateId },
    });

    if (!attempt) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_FOUND);
    }

    if (!this.isFinalized(attempt)) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_SUBMITTABLE);
    }

    const summary = this.toSubmissionSummary(attempt);
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.submission_summary_viewed',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: this.toAuditMetadata(summary),
    });
    return summary;
  }

  private async finalizeWithinTransaction(
    tx: Prisma.TransactionClient,
    candidateId: string,
    attemptId: string,
    mode: 'candidate_submit' | 'deadline_enforcement',
  ): Promise<AssessmentAttemptSubmissionResult> {
    await tx.$queryRaw`SELECT id FROM "AssessmentAttempt" WHERE id = ${attemptId} FOR UPDATE`;

    const attempt = await tx.assessmentAttempt.findFirst({
      where: { id: attemptId, candidateId },
      include: {
        questions: {
          include: {
            options: true,
            answer: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_FOUND);
    }

    if (this.isFinalized(attempt)) {
      return this.toSubmissionSummary(attempt);
    }

    const now = new Date();
    const isOverdue = attempt.deadlineAt.getTime() <= now.getTime();

    if (mode === 'deadline_enforcement' && !isOverdue) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_SUBMITTABLE);
    }

    if (mode === 'candidate_submit' && attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_SUBMITTABLE);
    }

    if (mode === 'candidate_submit' && attempt.status === 'IN_PROGRESS' && !isOverdue) {
      return this.persistFinalizedAttempt(
        tx,
        attempt,
        AssessmentAttemptStatus.SUBMITTED,
        AssessmentAttemptFinalizationReason.CANDIDATE_SUBMITTED,
        now,
      );
    }

    if ((attempt.status === 'IN_PROGRESS' && isOverdue) || attempt.status === 'EXPIRED') {
      return this.persistFinalizedAttempt(
        tx,
        attempt,
        AssessmentAttemptStatus.EXPIRED,
        AssessmentAttemptFinalizationReason.DEADLINE_REACHED,
        now,
      );
    }

    throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_NOT_SUBMITTABLE);
  }

  private async persistFinalizedAttempt(
    tx: Prisma.TransactionClient,
    attempt: LockedAttempt,
    targetStatus: AssessmentAttemptStatus.SUBMITTED | AssessmentAttemptStatus.EXPIRED,
    finalizationReason:
      | AssessmentAttemptFinalizationReason.CANDIDATE_SUBMITTED
      | AssessmentAttemptFinalizationReason.DEADLINE_REACHED,
    now: Date,
  ): Promise<AssessmentAttemptSubmissionResult> {
    const scoring = this.scoringService.scoreAttempt(attempt);

    for (const answerResult of scoring.answerResults) {
      if (!answerResult.answerId) {
        continue;
      }

      await tx.assessmentAttemptAnswer.update({
        where: { id: answerResult.answerId },
        data: {
          awardedPoints: answerResult.awardedPoints,
          isCorrect: answerResult.isCorrect,
          scoredAt: now,
        },
      });
    }

    const finalizedAttempt = await tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: targetStatus,
        finalizationReason,
        scoreEarned: scoring.scoreEarned,
        scorePossible: scoring.scorePossible,
        scorePercentage: scoring.scorePercentage,
        resultStatus: scoring.resultStatus,
        correctCount: scoring.correctCount,
        incorrectCount: scoring.incorrectCount,
        unansweredCount: scoring.unansweredCount,
        scoringVersion: scoring.scoringVersion,
        scoringCompletedAt: now,
        submittedAt: now,
        expiredAt: targetStatus === AssessmentAttemptStatus.EXPIRED ? now : attempt.expiredAt,
        lastActivityAt: now,
      },
    });

    // Queue certificate generation if passed
    if (scoring.resultStatus === AssessmentAttemptResultStatus.PASSED) {
      this.queueCertificateGenerationAfterFinalize(scoring, attempt.id).catch((err) =>
        this.logger.error(`Failed to queue certificate for attempt ${attempt.id}`, err),
      );
    }

    return this.toSubmissionSummary(finalizedAttempt);
  }

  private async queueCertificateGenerationAfterFinalize(
    scoring: { resultStatus: string },
    attemptId: string,
  ) {
    if (scoring.resultStatus !== AssessmentAttemptResultStatus.PASSED) return;

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: {
        candidateId: true,
        assessmentId: true,
        scorePercentage: true,
        assessment: { select: { certificateEnabled: true, type: true, title: true, slug: true } },
        candidate: { include: { candidateProfile: { select: { fullName: true } } } },
      },
    });

    if (!attempt || !attempt.assessment.certificateEnabled || attempt.assessment.type !== 'CERTIFICATION') {
      return;
    }

    const holderName = attempt.candidate.candidateProfile?.fullName;
    if (!holderName || holderName.trim().length === 0) return;

    const existing = await this.prisma.assessmentCertificate.findUnique({
      where: { attemptId },
      select: { id: true },
    });
    if (existing) return;

    const { randomBytes, createHash } = await import('node:crypto');
    const now = new Date();
    const rawCode = randomBytes(24).toString('hex');
    const codeHash = createHash('sha256').update(rawCode).digest('hex');
    const codeHint = rawCode.slice(0, 8) + '...';
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomBytes(4).toString('hex').toUpperCase();
    const certNumber = `CERT-${dateStr}-${randomPart}`;

    const cert = await this.prisma.assessmentCertificate.create({
      data: {
        candidateId: attempt.candidateId,
        assessmentId: attempt.assessmentId,
        attemptId,
        certificateNumber: certNumber,
        verificationCodeHash: codeHash,
        verificationCodeHint: codeHint,
        status: 'PENDING',
        holderNameSnapshot: holderName.trim().slice(0, 200),
        assessmentTitleSnapshot: attempt.assessment.title,
        assessmentSlugSnapshot: attempt.assessment.slug,
        scorePercentageSnapshot: attempt.scorePercentage ?? 0,
        expiresAt: null,
      },
    });

    await this.certificateQueue.add(GENERATE_CERTIFICATE_JOB, {
      certificateId: cert.id,
      attemptId,
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.SYSTEM,
      action: 'assessment.certificate.queued',
      targetType: 'AssessmentCertificate',
      targetId: cert.id,
      metadata: { certificateId: cert.id, attemptId },
    });
  }

  private isFinalized(attempt: FinalizedAttemptSummaryShape): boolean {
    return (
      (attempt.status === AssessmentAttemptStatus.SUBMITTED ||
        attempt.status === AssessmentAttemptStatus.EXPIRED) &&
      attempt.finalizationReason !== null &&
      attempt.scoreEarned !== null &&
      attempt.scorePossible !== null &&
      attempt.scorePercentage !== null &&
      attempt.resultStatus !== null &&
      attempt.correctCount !== null &&
      attempt.incorrectCount !== null &&
      attempt.unansweredCount !== null &&
      attempt.scoringVersion !== null &&
      attempt.scoringCompletedAt !== null &&
      attempt.submittedAt !== null
    );
  }

  private toSubmissionSummary(
    attempt: FinalizedAttemptSummaryShape,
  ): AssessmentAttemptSubmissionResult {
    if (!this.isFinalized(attempt)) {
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_SCORING_INCONSISTENT);
    }

    return {
      attemptId: attempt.id,
      status: attempt.status as AssessmentAttemptStatus.SUBMITTED | AssessmentAttemptStatus.EXPIRED,
      finalizationReason:
        attempt.finalizationReason as
          | AssessmentAttemptFinalizationReason.CANDIDATE_SUBMITTED
          | AssessmentAttemptFinalizationReason.DEADLINE_REACHED,
      submittedAt: attempt.submittedAt!.toISOString(),
      scoringVersion: attempt.scoringVersion!,
      result: {
        scoreEarned: Number(attempt.scoreEarned!.toString()),
        scorePossible: Number(attempt.scorePossible!.toString()),
        percentage: Number(attempt.scorePercentage!.toString()),
        resultStatus: attempt.resultStatus! as AssessmentAttemptResultStatus,
        correctCount: attempt.correctCount!,
        incorrectCount: attempt.incorrectCount!,
        unansweredCount: attempt.unansweredCount!,
        questionCount: attempt.questionCountSnapshot,
      },
    };
  }

  private toAuditMetadata(summary: AssessmentAttemptSubmissionResult) {
    return {
      attemptId: summary.attemptId,
      finalizationReason: summary.finalizationReason,
      scorePercentage: summary.result.percentage,
      resultStatus: summary.result.resultStatus,
      correctCount: summary.result.correctCount,
      incorrectCount: summary.result.incorrectCount,
      unansweredCount: summary.result.unansweredCount,
      scoringVersion: summary.scoringVersion,
    };
  }

  private async recordScoringFailure(candidateId: string, attemptId: string, error: unknown) {
    this.logger.error(`Failed to finalize assessment attempt ${attemptId}`, error);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.attempt.scoring_failed',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: {
        attemptId,
        failureCategory:
          error instanceof ConflictException
            ? 'snapshot_inconsistent'
            : error instanceof NotFoundException
              ? 'not_found'
              : error instanceof BadRequestException
                ? 'not_submittable'
                : 'unexpected',
      },
    });
  }
}
