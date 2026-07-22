import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpertApplicationRepository } from '../repositories/expert-application.repository';
import { ExpertDocumentRepository } from '../repositories/expert-document.repository';
import { ExpertDocumentStorageService } from './expert-document-storage.service';
import { AuditService } from '../../audit/audit.service';
import {
  approveExpertApplicationSchema,
  rejectExpertApplicationSchema,
  requestChangesExpertApplicationSchema,
  expertApplicationListQuerySchema,
} from '@nexthire/validation';
import { EXPERT_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { ExpertApplicationListQuery, PaginatedExpertApplicationResult } from '@nexthire/types';
import { mapApplicationDetail, mapDocument } from '../shared/expert-mappers';

/** Reviewer may act on applications in these states. */
const REVIEWABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'];
/** Signed document URLs handed to reviewers are short-lived. */
const SIGNED_URL_TTL_SECONDS = 300;

@Injectable()
export class ExpertApplicationReviewService {
  constructor(
    private readonly applicationRepository: ExpertApplicationRepository,
    private readonly documentRepository: ExpertDocumentRepository,
    private readonly storage: ExpertDocumentStorageService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: unknown): Promise<PaginatedExpertApplicationResult> {
    const parsed = expertApplicationListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.REVIEW_DECISION_INVALID,
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const q = parsed.data as Required<Pick<ExpertApplicationListQuery, 'page' | 'pageSize'>> &
      ExpertApplicationListQuery;
    const { total, rows } = await this.applicationRepository.listForReview(q);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        expertProfileId: row.expertProfileId,
        status: row.status,
        submissionVersion: row.submissionVersion,
        submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
        documentCount: row._count?.documents ?? 0,
        profile: {
          professionalTitle: row.expertProfile?.professionalTitle ?? '',
          yearsOfExperience: row.expertProfile?.yearsOfExperience ?? 0,
          countryId: row.expertProfile?.countryId ?? '',
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

  async getDetail(reviewerId: string, applicationId: string) {
    const application = await this.applicationRepository.findByIdWithProfile(applicationId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents = (application.documents as any[]).map((doc) => ({
      ...mapDocument(doc),
      signedUrl: this.storage.createSignedUrl(doc.storageKey, SIGNED_URL_TTL_SECONDS),
    }));

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'expert.application.review_viewed',
      targetType: 'ExpertApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      application: mapApplicationDetail(application, { includeReviewerNote: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applicant: { id: (application as any).user?.id, email: (application as any).user?.email },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: (application as any).expertProfile,
      documents,
    };
  }

  private async loadReviewable(applicationId: string) {
    const application = await this.applicationRepository.findByIdWithProfile(applicationId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (application.status === 'APPROVED') {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_ALREADY_APPROVED);
    }
    if (!REVIEWABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }
    return application;
  }

  async approve(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = approveExpertApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const { roleNewlyAssigned } = await this.applicationRepository.approveWithRoleAssignment({
      applicationId,
      userId: application.userId,
      reviewerId,
      reviewerNote: parsed.data.reviewerNote ?? null,
      now: new Date(),
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: reviewerId,
      action: 'expert.application.approved',
      targetType: 'ExpertApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        applicantUserId: application.userId,
        roleNewlyAssigned,
        ipAddress: context?.ipAddress,
      },
    });

    const refreshed = await this.applicationRepository.findByIdWithProfile(applicationId);
    return {
      application: mapApplicationDetail(refreshed, { includeReviewerNote: true }),
      roleAssigned: true,
    };
  }

  async reject(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = rejectExpertApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const now = new Date();
    const updated = await this.applicationRepository.updateStatus(applicationId, {
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
      action: 'expert.application.rejected',
      targetType: 'ExpertApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        applicantUserId: application.userId,
        decisionReasonCode: parsed.data.reasonCode,
        ipAddress: context?.ipAddress,
      },
    });

    return { application: mapApplicationDetail(updated, { includeReviewerNote: true }) };
  }

  async requestChanges(
    reviewerId: string,
    applicationId: string,
    body: unknown,
    context?: { ipAddress?: string },
  ) {
    const parsed = requestChangesExpertApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw this.invalidDecision(parsed.error.issues);
    }
    const application = await this.loadReviewable(applicationId);

    const now = new Date();
    const updated = await this.applicationRepository.updateStatus(applicationId, {
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
      action: 'expert.application.changes_requested',
      targetType: 'ExpertApplication',
      targetId: applicationId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { applicantUserId: application.userId, ipAddress: context?.ipAddress },
    });

    return { application: mapApplicationDetail(updated, { includeReviewerNote: true }) };
  }

  /**
   * Streams a document to a reviewer after validating the signed token.
   * Returns the buffer + content type; the controller sets private headers.
   */
  async resolveSignedDocument(
    storageKey: string,
    expires: number,
    signature: string,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    if (!this.storage.verifySignedUrl(storageKey, expires, signature)) {
      throw new NotFoundException(EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }
    const record = await this.documentRepository.findByStorageKey(storageKey);
    if (!record || record.removedAt) {
      throw new NotFoundException(EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }
    const buffer = await this.storage.read(storageKey);
    return { buffer, mimeType: record.mimeType, fileName: record.originalFileName };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private invalidDecision(issues: any[]): BadRequestException {
    return new BadRequestException({
      code: EXPERT_ERROR_CODES.REVIEW_DECISION_INVALID,
      details: issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
}
