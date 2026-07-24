import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyApplicationRepository } from '../repositories/company-application.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { CompanyApplicationReadinessService } from './company-application-readiness.service';
import { AuditService } from '../../audit/audit.service';
import { COMPANY_ERROR_CODES, MFA_ERROR_CODES } from '@nexthire/constants';
import { submitCompanyApplicationSchema } from '@nexthire/validation';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { CompanyApplicationDetail, CompanyApplicationReadiness } from '@nexthire/types';
import { mapCompanyApplicationDetail, mapCompanyDocument } from '../shared/company-mappers';

const SUBMITTABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED'];
const WITHDRAWABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];

export interface CompanyApplicationWithReadiness {
  application: CompanyApplicationDetail | null;
  documents: ReturnType<typeof mapCompanyDocument>[];
  readiness: CompanyApplicationReadiness | null;
}

@Injectable()
export class CompanyApplicationService {
  constructor(
    private readonly repository: CompanyApplicationRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly readinessService: CompanyApplicationReadinessService,
    private readonly auditService: AuditService,
  ) {}

  async getMyApplication(ownerUserId: string): Promise<CompanyApplicationWithReadiness> {
    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    if (!company) {
      return { application: null, documents: [], readiness: null };
    }
    const application = await this.repository.findActiveByCompanyId(company.id);
    if (!application) {
      const readiness = await this.readinessService.evaluate({ ownerUserId, applicationId: null });
      return { application: null, documents: [], readiness };
    }
    const readiness = await this.readinessService.evaluate({
      ownerUserId,
      applicationId: application.id,
    });
    return {
      application: mapCompanyApplicationDetail(application, { includeReviewerNote: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: (application.documents as any[]).map(mapCompanyDocument),
      readiness,
    };
  }

  async createApplication(ownerUserId: string): Promise<CompanyApplicationWithReadiness> {
    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    if (!company) {
      throw new BadRequestException(COMPANY_ERROR_CODES.PROFILE_NOT_FOUND);
    }

    const active = await this.repository.findActiveByCompanyId(company.id);
    if (active) {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_ALREADY_ACTIVE);
    }

    const created = await this.repository.createDraft(company.id);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: 'company.application.created',
      targetType: 'CompanyVerificationApplication',
      targetId: created.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { status: created.status },
    });

    const readiness = await this.readinessService.evaluate({
      ownerUserId,
      applicationId: created.id,
    });

    return {
      application: mapCompanyApplicationDetail(created, { includeReviewerNote: true }),
      documents: [],
      readiness,
    };
  }

  async getReadiness(ownerUserId: string): Promise<CompanyApplicationReadiness> {
    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    const active = company ? await this.repository.findActiveByCompanyId(company.id) : null;
    return this.readinessService.evaluate({ ownerUserId, applicationId: active?.id ?? null });
  }

  async submit(
    ownerUserId: string,
    body: unknown,
    meta?: { ipAddress?: string },
  ): Promise<CompanyApplicationWithReadiness> {
    const parsed = submitCompanyApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    if (!company) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    const application = await this.repository.findActiveByCompanyId(company.id);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }

    if (!SUBMITTABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }

    const mfaEnabled = await this.readinessService.isMfaEnabled(ownerUserId);
    if (!mfaEnabled) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: ownerUserId,
        action: 'company.application.submit_denied',
        targetType: 'CompanyVerificationApplication',
        targetId: application.id,
        outcome: AuditOutcome.DENIED,
        metadata: { reason: MFA_ERROR_CODES.REQUIRED_BY_POLICY },
      });
      throw new ForbiddenException(MFA_ERROR_CODES.REQUIRED_BY_POLICY);
    }

    const readiness = await this.readinessService.evaluate({
      ownerUserId,
      applicationId: application.id,
    });
    if (!readiness.ready) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.APPLICATION_NOT_READY,
        blockers: readiness.blockers,
      });
    }

    const now = new Date();
    const updated = await this.repository.updateStatus(application.id, {
      status: 'SUBMITTED',
      submittedAt: now,
      submissionVersion: { increment: 1 },
      applicantResponse: parsed.data.applicantResponse ?? application.applicantResponse ?? null,
      decisionReasonCode: null,
      reviewStartedAt: null,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: 'company.application.submitted',
      targetType: 'CompanyVerificationApplication',
      targetId: application.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { submissionVersion: updated.submissionVersion, ipAddress: meta?.ipAddress },
    });

    return {
      application: mapCompanyApplicationDetail(updated, { includeReviewerNote: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: (updated.documents as any[]).map(mapCompanyDocument),
      readiness: await this.readinessService.evaluate({
        ownerUserId,
        applicationId: application.id,
      }),
    };
  }

  async withdraw(ownerUserId: string): Promise<CompanyApplicationWithReadiness> {
    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    if (!company) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    const application = await this.repository.findActiveByCompanyId(company.id);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }

    const updated = await this.repository.updateStatus(application.id, {
      status: 'WITHDRAWN',
      withdrawnAt: new Date(),
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: 'company.application.withdrawn',
      targetType: 'CompanyVerificationApplication',
      targetId: application.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      application: mapCompanyApplicationDetail(updated, { includeReviewerNote: true }),
      documents: [],
      readiness: null,
    };
  }
}
