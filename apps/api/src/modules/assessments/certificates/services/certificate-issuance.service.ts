import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { CertificateEligibilityService } from './certificate-eligibility.service';
import { randomBytes, createHash } from 'node:crypto';

@Injectable()
export class CertificateIssuanceService {
  private readonly logger = new Logger(CertificateIssuanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: CertificateEligibilityService,
  ) {}

  async issueIfEligible(attemptId: string): Promise<{ created: boolean; certificateId?: string }> {
    const eligibility = await this.eligibilityService.isEligibleForCertificate(attemptId);

    if (!eligibility.eligible) {
      this.logger.debug(`Certificate not eligible for attempt ${attemptId}: ${eligibility.reason}`);
      return { created: false };
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.assessmentCertificate.findUnique({
        where: { attemptId },
        select: { id: true },
      });

      if (existing) {
        return { created: false, certificateId: existing.id };
      }

      const attempt = await tx.assessmentAttempt.findUnique({
        where: { id: attemptId },
        select: { candidateId: true, scorePercentage: true },
      });

      if (!attempt) {
        return { created: false };
      }

      const now = new Date();
      const rawVerificationCode = randomBytes(24).toString('hex');
      const verificationCodeHash = createHash('sha256').update(rawVerificationCode).digest('hex');
      const verificationCodeHint = rawVerificationCode.slice(0, 8) + '...';

      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = randomBytes(4).toString('hex').toUpperCase();
      const certificateNumber = `CERT-${dateStr}-${randomPart}`;

      const expiresAt = eligibility.assessment!.certificateValidityDays
        ? new Date(now.getTime() + eligibility.assessment!.certificateValidityDays * 86400000)
        : null;

      const certificate = await tx.assessmentCertificate.create({
        data: {
          candidateId: attempt.candidateId,
          assessmentId: eligibility.assessment!.id,
          attemptId,
          certificateNumber,
          verificationCodeHash,
          verificationCodeHint,
          status: 'PENDING',
          holderNameSnapshot: eligibility.holderName!,
          assessmentTitleSnapshot: eligibility.assessment!.title,
          assessmentSlugSnapshot: eligibility.assessment!.slug,
          scorePercentageSnapshot: attempt.scorePercentage ?? 0,
          expiresAt,
        },
      });

      return { created: true, certificateId: certificate.id };
    });
  }
}
