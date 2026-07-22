import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { createHash } from 'node:crypto';
import type { AssessmentCertificateVerificationResult } from '@nexthire/types';

@Injectable()
export class CertificateVerificationService {
  private readonly logger = new Logger(CertificateVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async verify(verificationCode: string): Promise<AssessmentCertificateVerificationResult> {
    const verificationCodeHash = createHash('sha256').update(verificationCode).digest('hex');

    const cert = await this.prisma.assessmentCertificate.findUnique({
      where: { verificationCodeHash },
      select: {
        certificateNumber: true,
        status: true,
        holderNameSnapshot: true,
        assessmentTitleSnapshot: true,
        scorePercentageSnapshot: true,
        issuedAt: true,
        expiresAt: true,
      },
    });

    if (!cert) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.ANONYMOUS,
        action: 'assessment.certificate.verification_failed',
        targetType: 'AssessmentCertificate',
        metadata: { verificationOutcome: 'NOT_FOUND' },
      });

      return {
        valid: false,
        status: 'NOT_FOUND',
        certificateNumber: null,
        holderName: null,
        assessmentTitle: null,
        scorePercentage: null,
        issuedAt: null,
        expiresAt: null,
      };
    }

    // Check expiration
    if (cert.status === 'EXPIRED' || (cert.expiresAt && cert.expiresAt < new Date())) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.ANONYMOUS,
        action: 'assessment.certificate.verified',
        targetType: 'AssessmentCertificate',
        metadata: { verificationOutcome: 'EXPIRED' },
      });

      return {
        valid: false,
        status: 'EXPIRED',
        certificateNumber: cert.certificateNumber,
        holderName: cert.holderNameSnapshot,
        assessmentTitle: cert.assessmentTitleSnapshot,
        scorePercentage: Number(cert.scorePercentageSnapshot),
        issuedAt: cert.issuedAt?.toISOString() ?? null,
        expiresAt: cert.expiresAt?.toISOString() ?? null,
      };
    }

    const validStatuses = new Set(['READY', 'PENDING', 'GENERATING']);
    if (!validStatuses.has(cert.status)) {
      const status = cert.status === 'REVOKED' ? 'REVOKED' : 'NOT_FOUND';

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.ANONYMOUS,
        action: 'assessment.certificate.verified',
        targetType: 'AssessmentCertificate',
        metadata: { verificationOutcome: status },
      });

      return {
        valid: status === 'REVOKED' ? false : false,
        status: status as any,
        certificateNumber: cert.certificateNumber,
        holderName: cert.holderNameSnapshot,
        assessmentTitle: cert.assessmentTitleSnapshot,
        scorePercentage: Number(cert.scorePercentageSnapshot),
        issuedAt: cert.issuedAt?.toISOString() ?? null,
        expiresAt: cert.expiresAt?.toISOString() ?? null,
      };
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.ANONYMOUS,
      action: 'assessment.certificate.verified',
      targetType: 'AssessmentCertificate',
      metadata: { verificationOutcome: 'VALID' },
    });

    return {
      valid: true,
      status: 'VALID',
      certificateNumber: cert.certificateNumber,
      holderName: cert.holderNameSnapshot,
      assessmentTitle: cert.assessmentTitleSnapshot,
      scorePercentage: Number(cert.scorePercentageSnapshot),
      issuedAt: cert.issuedAt?.toISOString() ?? null,
      expiresAt: cert.expiresAt?.toISOString() ?? null,
    };
  }
}
