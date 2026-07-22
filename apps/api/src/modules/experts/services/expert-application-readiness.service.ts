import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ExpertProfileRepository } from '../repositories/expert-profile.repository';
import { ExpertDocumentRepository } from '../repositories/expert-document.repository';
import type { ExpertApplicationReadiness } from '@nexthire/types';

/** Identity document is always required. */
const REQUIRED_IDENTITY_TYPE = 'GOVERNMENT_ID';
/** At least one credential document from this set is required. */
const CREDENTIAL_TYPES = ['PROFESSIONAL_CERTIFICATE', 'EDUCATION_CERTIFICATE', 'EMPLOYMENT_PROOF'];

export interface ReadinessInputs {
  userId: string;
  applicationId?: string | null;
}

/**
 * Computes whether an application is ready to be submitted. Pure with respect
 * to persistence — it only reads. Used by both the readiness endpoint and the
 * submit guard so the two never diverge.
 */
@Injectable()
export class ExpertApplicationReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileRepository: ExpertProfileRepository,
    private readonly documentRepository: ExpertDocumentRepository,
  ) {}

  async isMfaEnabled(userId: string): Promise<boolean> {
    const mfa = await this.prisma.userMfa.findUnique({
      where: { userId },
      select: { status: true },
    });
    return mfa?.status === 'ENABLED';
  }

  async evaluate(inputs: ReadinessInputs): Promise<ExpertApplicationReadiness> {
    const { userId, applicationId } = inputs;

    const profile = await this.profileRepository.findByUserId(userId);
    const documents = applicationId ? await this.documentRepository.listActive(applicationId) : [];
    const mfaEnabled = await this.isMfaEnabled(userId);

    const blockers: ExpertApplicationReadiness['blockers'] = [];

    const profileComplete = !!profile;
    if (!profileComplete) {
      blockers.push({
        code: 'PROFILE_INCOMPLETE',
        message: 'Complete your expert profile before submitting.',
        field: 'profile',
      });
    }

    const hasIdentity = documents.some((d) => d.type === REQUIRED_IDENTITY_TYPE);
    const hasCredential = documents.some((d) => CREDENTIAL_TYPES.includes(d.type));
    const requiredDocumentsPresent = hasIdentity && hasCredential;

    if (!hasIdentity) {
      blockers.push({
        code: 'MISSING_IDENTITY_DOCUMENT',
        message: 'A government-issued ID document is required.',
        field: 'documents',
      });
    }
    if (!hasCredential) {
      blockers.push({
        code: 'MISSING_CREDENTIAL_DOCUMENT',
        message: 'At least one credential document (certificate or employment proof) is required.',
        field: 'documents',
      });
    }

    if (!mfaEnabled) {
      blockers.push({
        code: 'MFA_REQUIRED_BY_POLICY',
        message: 'Two-factor authentication must be enabled to become an expert.',
        field: 'mfa',
      });
    }

    return {
      ready: blockers.length === 0,
      blockers,
      summary: {
        profileComplete,
        requiredDocumentsPresent,
        mfaEnabled,
        documentCount: documents.length,
      },
    };
  }
}
