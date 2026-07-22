import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AssessmentType } from '@nexthire/types';

@Injectable()
export class CertificateEligibilityService {
  private readonly logger = new Logger(CertificateEligibilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isEligibleForCertificate(attemptId: string): Promise<{
    eligible: boolean;
    reason?: string;
    assessment?: { id: string; title: string; slug: string; certificateEnabled: boolean; certificateValidityDays: number | null; type: string; passingScorePercentage: number };
    holderName?: string;
  }> {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            certificateEnabled: true,
            certificateValidityDays: true,
            passingScorePercentage: true,
          },
        },
        candidate: {
          include: {
            candidateProfile: { select: { fullName: true } },
          },
        },
      },
    });

    if (!attempt) {
      return { eligible: false, reason: 'attempt not found' };
    }

    // 1. Must be finalized
    if (!attempt.scoringCompletedAt) {
      return { eligible: false, reason: 'attempt not finalized' };
    }

    // 2. Must be passed
    if (attempt.resultStatus !== 'PASSED') {
      return { eligible: false, reason: 'attempt not passed' };
    }

    // 3. Certificate policy must be enabled
    if (!attempt.assessment.certificateEnabled) {
      return { eligible: false, reason: 'certificate not enabled' };
    }

    // 4. Assessment type must be certification type
    if (attempt.assessment.type !== AssessmentType.CERTIFICATION) {
      return { eligible: false, reason: 'unsupported assessment type' };
    }

    // 5. No existing certificate for this attempt
    const existing = await this.prisma.assessmentCertificate.findUnique({
      where: { attemptId },
      select: { id: true },
    });

    if (existing) {
      return { eligible: false, reason: 'certificate already exists' };
    }

    // 6. Holder name
    const holderName = attempt.candidate.candidateProfile?.fullName;
    if (!holderName || holderName.trim().length === 0) {
      return { eligible: false, reason: 'no valid holder name' };
    }

    return {
      eligible: true,
      assessment: attempt.assessment,
      holderName: holderName.trim().slice(0, 200),
    };
  }
}
