import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyApplicationRepository } from '../repositories/company-application.repository';
import { CompanyDocumentRepository } from '../repositories/company-document.repository';
import { CompanyDocumentStorageService } from './company-document-storage.service';
import { AuditService } from '../../audit/audit.service';
import {
  approveCompanyApplicationSchema,
  rejectCompanyApplicationSchema,
  requestChangesCompanyApplicationSchema,
  companyApplicationListQuerySchema,
} from '@nexthire/validation';
import { COMPANY_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CompanyApplicationListQuery,
  PaginatedCompanyApplicationResult,
} from '@nexthire/types';
import { mapCompanyApplicationDetail, mapCompanyDocument } from '../shared/company-mappers';

const REVIEWABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'];
const SIGNED_URL_TTL_SECONDS = 300;

@Injectable()
export class CompanyApplicationReviewService {
  constructor(
    private readonly applicationRepository: CompanyApplicationRepository,
    private readonly documentRepository: CompanyDocumentRepository,
    private readonly storage: CompanyDocumentStorageService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: unknown): Promise<PaginatedCompanyApplicationResult> {
    const parsed = companyApplicationListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.REVIEW_DECISION_INVALID,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const q = parsed.data as Required<Pick<CompanyApplicationListQuery, 'page' | 'pageSize'>> &
      CompanyApplicationListQuery;
    const { total, rows } = await this.applicationRepository.listForReview(q);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: rows.map((row: any) => ({
        id: row.id,
        companyId: row.companyId,
        status: row.status,
        submissionVersion: row.submissionVersion,
        submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
        documentCount: row._count?.documents ?? 0,
        company: {
          name: row.company?.name ?? '',
          industry: row.company?.industry ?? null,
          headquartersCountryId: row.company?.headquartersCountryId ?? '',
        },
      })),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildReviewDetail(application: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents = (application.documents as any[]).map((doc) => ({
      ...mapCompanyDocument(doc),
      signedUrl: this.storage.createSignedUrl(doc.storageKey, SIGNED_URL_TTL_SECONDS),
    }));

    return {
      ...mapCompanyApplicationDetail(application, { includeReviewerNote: true }),
      applicant: {
        displayName: application.company?.name || 'Unknown company',
        countryId: application.company?.headquartersCountryId ?? '',
      },
      company: application.company,
      documents,
    };
  }

  private async loadFullDetail(applicationId: string) {
    const application = await this.applicationRepository.findByIdWithCompany(applicationId);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    return this.buildReviewDetail(application);
  }

  async getDetail(reviewerId: string, applicationId: string) {
    const detail = await this.loadFullDetail(applicationId);
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'company.application.review_viewed',
      targetType: 'CompanyVerificationApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
    });
    return detail;
  }

  async startReview(reviewerId: string, applicationId: string) {
    const application = await this.applicationRepository.findByIdWithCompany(applicationId);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (application.status !== 'SUBMITTED') {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }

    await this.applicationRepository.updateStatus(applicationId, {
      status: 'UNDER_REVIEW',
      reviewStartedAt: new Date(),
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'company.application.review_started',
      targetType: 'CompanyVerificationApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.loadFullDetail(applicationId);
  }

  private async loadReviewable(applicationId: string) {
    const application = await this.applicationRepository.findByIdWithCompany(applicationId);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (application.status === 'APPROVED') {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_ALREADY_APPROVED);
    }
    if (!REVIEWABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }
    return application;
  }

  async approve(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = approveCompanyApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const { roleNewlyAssigned } = await this.applicationRepository.approveWithRoleAssignment({
      applicationId,
      ownerUserId: application.company.ownerUserId,
      reviewerId,
      reviewerNote: parsed.data.reviewerNote ?? null,
      now: new Date(),
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'company.application.approved',
      targetType: 'CompanyVerificationApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        ownerUserId: application.company.ownerUserId,
        roleNewlyAssigned,
        ipAddress: context?.ipAddress,
      },
    });

    const refreshed = await this.applicationRepository.findByIdWithCompany(applicationId);
    if (!refreshed) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    return { ...this.buildReviewDetail(refreshed), roleAssigned: true };
  }

  async reject(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = rejectCompanyApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const now = new Date();
    await this.applicationRepository.updateStatus(applicationId, {
      status: 'REJECTED',
      reviewedById: reviewerId,
      reviewedAt: now,
      rejectedAt: now,
      decisionReasonCode: parsed.data.reasonCode,
      reviewerNote: parsed.data.reviewerNote,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'company.application.rejected',
      targetType: 'CompanyVerificationApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        ownerUserId: application.company.ownerUserId,
        decisionReasonCode: parsed.data.reasonCode,
        ipAddress: context?.ipAddress,
      },
    });

    return this.loadFullDetail(applicationId);
  }

  async requestChanges(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = requestChangesCompanyApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const now = new Date();
    await this.applicationRepository.updateStatus(applicationId, {
      status: 'CHANGES_REQUESTED',
      reviewedById: reviewerId,
      reviewedAt: now,
      reviewStartedAt: application.reviewStartedAt ?? now,
      reviewerNote: parsed.data.reviewerNote,
      decisionReasonCode: null,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'company.application.changes_requested',
      targetType: 'CompanyVerificationApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { ownerUserId: application.company.ownerUserId, ipAddress: context?.ipAddress },
    });

    return this.loadFullDetail(applicationId);
  }

  async resolveSignedDocument(
    storageKey: string,
    expires: number,
    signature: string,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    if (!this.storage.verifySignedUrl(storageKey, expires, signature)) {
      throw new NotFoundException(COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }
    const record = await this.documentRepository.findByStorageKey(storageKey);
    if (!record || record.removedAt) {
      throw new NotFoundException(COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }
    const buffer = await this.storage.read(storageKey);
    return { buffer, mimeType: record.mimeType, fileName: record.originalFileName };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private invalidDecision(issues: any[]): BadRequestException {
    return new BadRequestException({
      code: COMPANY_ERROR_CODES.REVIEW_DECISION_INVALID,
      details: issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
}
