import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../database/prisma.service';
import { CertificatePdfService } from '../pdf/certificate-pdf.service';
import { CertificateStorageService } from '../../../../infrastructure/storage/certificate-storage.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { CERTIFICATE_QUEUE, GENERATE_CERTIFICATE_JOB } from '../../../../infrastructure/queue/queue.constants';

@Processor(CERTIFICATE_QUEUE)
export class CertificateWorker extends WorkerHost {
  private readonly logger = new Logger(CertificateWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: CertificatePdfService,
    private readonly storageService: CertificateStorageService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job<{ certificateId: string; attemptId: string }>): Promise<void> {
    const { certificateId, attemptId } = job.data;
    this.logger.log(`Processing certificate job ${job.id} for certificate ${certificateId}`);

    try {
      // 1. Load certificate, atomically set to GENERATING
      const certificate = await this.prisma.$transaction(async (tx) => {
        const cert = await tx.assessmentCertificate.findUnique({
          where: { id: certificateId },
          include: {
            attempt: {
              select: { scorePercentage: true, candidateId: true },
            },
          },
        });

        if (!cert) {
          throw new Error(`Certificate ${certificateId} not found`);
        }

        if (cert.status !== 'PENDING') {
          if (cert.status === 'GENERATING') {
            // Another worker is handling this - skip
            return null;
          }
          if (cert.status === 'READY') {
            // Already generated
            return null;
          }
        }

        await tx.assessmentCertificate.update({
          where: { id: certificateId },
          data: { status: 'GENERATING' },
        });

        await this.auditService.recordBestEffort({
          actorType: AuditActorType.SYSTEM,
          action: 'assessment.certificate.generating',
          targetType: 'AssessmentCertificate',
          targetId: certificateId,
          metadata: { certificateId, attemptId },
        });

        return cert;
      });

      if (!certificate) {
        this.logger.debug(`Certificate ${certificateId} skipped (already processing or ready)`);
        return;
      }

      // 2. Re-check eligibility
      const eligibilityCheck = await this.checkEligibility(certificateId);
      if (!eligibilityCheck.eligible) {
        await this.markFailed(certificateId, eligibilityCheck.reason ?? 'eligibility check failed');
        return;
      }

      // 3. Generate PDF
      const now = new Date();
      const pdfBuffer = this.pdfService.generate({
        holderName: certificate.holderNameSnapshot,
        assessmentTitle: certificate.assessmentTitleSnapshot,
        scorePercentage: Number(certificate.scorePercentageSnapshot),
        certificateNumber: certificate.certificateNumber,
        issuedAt: now,
        expiresAt: certificate.expiresAt,
        verificationUrl: this.pdfService.generateVerificationUrl(
          certificate.verificationCodeHash.slice(0, 16),
        ),
      });

      // 4. Upload to storage
      const storageKey = this.storageService.generateKey(certificateId);
      const { checksumSha256, fileSizeBytes } = await this.storageService.upload(storageKey, pdfBuffer);

      // 5. Update certificate to READY
      await this.prisma.assessmentCertificate.update({
        where: { id: certificateId },
        data: {
          status: 'READY',
          storageKey,
          checksumSha256,
          fileSizeBytes,
          issuedAt: now,
          generatedAt: now,
        },
      });

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.SYSTEM,
        action: 'assessment.certificate.ready',
        targetType: 'AssessmentCertificate',
        targetId: certificateId,
        metadata: {
          certificateId,
          attemptId,
          fileSizeBytes,
          certificateStatus: 'READY',
        },
      });

      this.logger.log(`Certificate ${certificateId} generated successfully`);
    } catch (error) {
      this.logger.error(`Certificate generation failed for ${certificateId}`, error);

      await this.markFailed(
        certificateId,
        error instanceof Error ? error.message.slice(0, 100) : 'unknown error',
      );

      throw error;
    }
  }

  private async checkEligibility(certificateId: string): Promise<{ eligible: boolean; reason?: string }> {
    const cert = await this.prisma.assessmentCertificate.findUnique({
      where: { id: certificateId },
      select: { status: true, attemptId: true },
    });

    if (!cert) return { eligible: false, reason: 'certificate not found' };
    if (cert.status !== 'GENERATING') return { eligible: false, reason: `invalid status: ${cert.status}` };

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: cert.attemptId },
      select: { status: true, resultStatus: true, scoringCompletedAt: true },
    });

    if (!attempt) return { eligible: false, reason: 'attempt not found' };
    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'EXPIRED') {
      return { eligible: false, reason: 'attempt not finalized' };
    }
    if (attempt.resultStatus !== 'PASSED') return { eligible: false, reason: 'attempt not passed' };
    if (!attempt.scoringCompletedAt) return { eligible: false, reason: 'scoring not completed' };

    return { eligible: true };
  }

  private async markFailed(certificateId: string, failureCategory: string) {
    await this.prisma.assessmentCertificate.update({
      where: { id: certificateId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureCategory: failureCategory.slice(0, 100),
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.SYSTEM,
      action: 'assessment.certificate.failed',
      targetType: 'AssessmentCertificate',
      targetId: certificateId,
      metadata: {
        certificateId,
        failureCategory: failureCategory.slice(0, 100),
        certificateStatus: 'FAILED',
      },
    });
  }
}
