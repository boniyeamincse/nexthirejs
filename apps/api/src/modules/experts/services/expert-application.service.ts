import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpertApplicationRepository } from '../repositories/expert-application.repository';
import { ExpertProfileRepository } from '../repositories/expert-profile.repository';
import { ExpertApplicationReadinessService } from './expert-application-readiness.service';
import { AuditService } from '../../audit/audit.service';
import { EXPERT_ERROR_CODES, MFA_ERROR_CODES } from '@nexthire/constants';
import { submitExpertApplicationSchema } from '@nexthire/validation';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { ExpertApplicationDetail, ExpertApplicationReadiness } from '@nexthire/types';
import { mapApplicationDetail, mapDocument } from '../shared/expert-mappers';

/** Statuses from which an applicant may (re)submit. */
const SUBMITTABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED'];
/** Statuses from which an applicant may withdraw. */
const WITHDRAWABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];

export interface ApplicationWithReadiness {
  application: ExpertApplicationDetail | null;
  documents: ReturnType<typeof mapDocument>[];
  readiness: ExpertApplicationReadiness | null;
}

@Injectable()
export class ExpertApplicationService {
  constructor(
    private readonly repository: ExpertApplicationRepository,
    private readonly profileRepository: ExpertProfileRepository,
    private readonly readinessService: ExpertApplicationReadinessService,
    private readonly auditService: AuditService,
  ) {}

  async getMyApplication(userId: string): Promise<ApplicationWithReadiness> {
    const application = await this.repository.findActiveByUserId(userId);
    if (!application) {
      return { application: null, documents: [], readiness: null };
    }
    const readiness = await this.readinessService.evaluate({
      userId,
      applicationId: application.id,
    });
    return {
      application: mapApplicationDetail(application, { includeReviewerNote: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: (application.documents as any[]).map(mapDocument),
      readiness,
    };
  }

  async createApplication(userId: string): Promise<ApplicationWithReadiness> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new BadRequestException(EXPERT_ERROR_CODES.PROFILE_NOT_FOUND);
    }

    const active = await this.repository.findActiveByUserId(userId);
    if (active) {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_ALREADY_ACTIVE);
    }

    const created = await this.repository.createDraft(userId, profile.id);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.application.created',
      targetType: 'ExpertApplication',
      targetId: created.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { status: created.status },
    });

    const readiness = await this.readinessService.evaluate({
      userId,
      applicationId: created.id,
    });

    return {
      application: mapApplicationDetail(created, { includeReviewerNote: true }),
      documents: [],
      readiness,
    };
  }

  async getReadiness(userId: string): Promise<ExpertApplicationReadiness> {
    const active = await this.repository.findActiveByUserId(userId);
    return this.readinessService.evaluate({
      userId,
      applicationId: active?.id ?? null,
    });
  }

  async submit(
    userId: string,
    body: unknown,
    meta?: { ipAddress?: string },
  ): Promise<ApplicationWithReadiness> {
    const parsed = submitExpertApplicationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.APPLICATION_TRANSITION_INVALID,
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const application = await this.repository.findActiveByUserId(userId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }

    if (!SUBMITTABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }

    // Hard policy: MFA must be enabled at submission time.
    const mfaEnabled = await this.readinessService.isMfaEnabled(userId);
    if (!mfaEnabled) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'expert.application.submit_denied',
        targetType: 'ExpertApplication',
        targetId: application.id,
        outcome: AuditOutcome.DENIED,
        metadata: { reason: MFA_ERROR_CODES.REQUIRED_BY_POLICY },
      });
      throw new ForbiddenException(MFA_ERROR_CODES.REQUIRED_BY_POLICY);
    }

    const readiness = await this.readinessService.evaluate({
      userId,
      applicationId: application.id,
    });
    if (!readiness.ready) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.APPLICATION_NOT_READY,
        blockers: readiness.blockers,
      });
    }

    const now = new Date();
    const updated = await this.repository.updateStatus(application.id, {
      status: 'SUBMITTED',
      submittedAt: now,
      submissionVersion: { increment: 1 },
      applicantResponse: parsed.data.applicantResponse ?? application.applicantResponse ?? null,
      // Clear prior decision fields on resubmission.
      decisionReasonCode: null,
      reviewStartedAt: null,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.application.submitted',
      targetType: 'ExpertApplication',
      targetId: application.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { submissionVersion: updated.submissionVersion, ipAddress: meta?.ipAddress },
    });

    return {
      application: mapApplicationDetail(updated, { includeReviewerNote: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: (updated.documents as any[]).map(mapDocument),
      readiness: await this.readinessService.evaluate({
        userId,
        applicationId: application.id,
      }),
    };
  }

  async withdraw(userId: string): Promise<ApplicationWithReadiness> {
    const application = await this.repository.findActiveByUserId(userId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }

    const now = new Date();
    const updated = await this.repository.updateStatus(application.id, {
      status: 'WITHDRAWN',
      withdrawnAt: now,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.application.withdrawn',
      targetType: 'ExpertApplication',
      targetId: application.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      application: mapApplicationDetail(updated, { includeReviewerNote: true }),
      documents: [],
      readiness: null,
    };
  }
}
