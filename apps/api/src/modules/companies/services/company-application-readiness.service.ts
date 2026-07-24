import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CompanyRepository } from '../repositories/company.repository';
import { CompanyDocumentRepository } from '../repositories/company-document.repository';
import type { CompanyApplicationReadiness } from '@nexthire/types';

/** Business registration is always required. */
const REQUIRED_DOCUMENT_TYPE = 'BUSINESS_REGISTRATION';

export interface ReadinessInputs {
  ownerUserId: string;
  applicationId?: string | null;
}

/**
 * Computes whether a company's application is ready to be submitted. Pure
 * with respect to persistence — it only reads. Used by both the readiness
 * endpoint and the submit guard so the two never diverge.
 */
@Injectable()
export class CompanyApplicationReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyRepository: CompanyRepository,
    private readonly documentRepository: CompanyDocumentRepository,
  ) {}

  async isMfaEnabled(userId: string): Promise<boolean> {
    const mfa = await this.prisma.userMfa.findUnique({
      where: { userId },
      select: { status: true },
    });
    return mfa?.status === 'ENABLED';
  }

  async evaluate(inputs: ReadinessInputs): Promise<CompanyApplicationReadiness> {
    const { ownerUserId, applicationId } = inputs;

    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    const documents = applicationId ? await this.documentRepository.listActive(applicationId) : [];
    const mfaEnabled = await this.isMfaEnabled(ownerUserId);

    const blockers: CompanyApplicationReadiness['blockers'] = [];

    const profileComplete = !!company;
    if (!profileComplete) {
      blockers.push({
        code: 'PROFILE_INCOMPLETE',
        message: 'Complete your company profile before submitting.',
        field: 'profile',
      });
    }

    const requiredDocumentsPresent = documents.some((d) => d.type === REQUIRED_DOCUMENT_TYPE);
    if (!requiredDocumentsPresent) {
      blockers.push({
        code: 'MISSING_BUSINESS_REGISTRATION',
        message: 'A business registration document is required.',
        field: 'documents',
      });
    }

    if (!mfaEnabled) {
      blockers.push({
        code: 'MFA_REQUIRED_BY_POLICY',
        message: 'Two-factor authentication must be enabled to verify a company.',
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
