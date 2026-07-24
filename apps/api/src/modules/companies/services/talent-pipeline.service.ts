import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TalentShortlistRepository } from '../repositories/talent-shortlist.repository';
import { CompanyVerifiedAccessService } from './company-verified-access.service';
import { CandidateSearchService } from '../../candidates/search/candidate-search.service';
import { AuditService } from '../../audit/audit.service';
import { TALENT_PIPELINE_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  TalentShortlistSummary,
  TalentShortlistDetail,
  TalentShortlistMemberResult,
  TalentPipelineStageValue,
} from '@nexthire/types';
import {
  createTalentShortlistSchema,
  updateTalentShortlistSchema,
  addTalentShortlistMemberSchema,
  updateTalentShortlistMemberSchema,
} from '@nexthire/validation';
import {
  mapShortlistSummary,
  mapShortlistDetail,
  mapShortlistMember,
} from '../shared/talent-pipeline-mappers';

const READ_ONLY_ROLES = ['VIEWER'];

@Injectable()
export class TalentPipelineService {
  constructor(
    private readonly repository: TalentShortlistRepository,
    private readonly verifiedAccessService: CompanyVerifiedAccessService,
    private readonly candidateSearchService: CandidateSearchService,
    private readonly auditService: AuditService,
  ) {}

  private async requireWriteAccess(userId: string) {
    const membership = await this.verifiedAccessService.requireVerifiedMember(userId);
    if (READ_ONLY_ROLES.includes(membership.role)) {
      throw new ForbiddenException({ code: TALENT_PIPELINE_ERROR_CODES.READ_ONLY_ROLE });
    }
    return membership;
  }

  private async loadOwnedShortlist(companyId: string, shortlistId: string) {
    const shortlist = await this.repository.findByIdAndCompanyId(shortlistId, companyId);
    if (!shortlist) {
      throw new NotFoundException({ code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_NOT_FOUND });
    }
    return shortlist;
  }

  async list(userId: string): Promise<TalentShortlistSummary[]> {
    const { companyId } = await this.verifiedAccessService.requireVerifiedMember(userId);
    const rows = await this.repository.listByCompany(companyId);
    return rows.map(mapShortlistSummary);
  }

  async getDetail(userId: string, shortlistId: string): Promise<TalentShortlistDetail> {
    const { companyId } = await this.verifiedAccessService.requireVerifiedMember(userId);
    const shortlist = await this.repository.findByIdForCompany(shortlistId, companyId);
    if (!shortlist) {
      throw new NotFoundException({ code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_NOT_FOUND });
    }
    return mapShortlistDetail(shortlist);
  }

  async create(userId: string, body: unknown): Promise<TalentShortlistSummary> {
    const { companyId } = await this.requireWriteAccess(userId);

    const parsed = createTalentShortlistSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const created = await this.repository.create(companyId, userId, parsed.data);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.created',
      targetType: 'TalentShortlist',
      targetId: created.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { name: parsed.data.name },
    });

    return mapShortlistSummary(created);
  }

  async update(
    userId: string,
    shortlistId: string,
    body: unknown,
  ): Promise<TalentShortlistSummary> {
    const { companyId } = await this.requireWriteAccess(userId);
    await this.loadOwnedShortlist(companyId, shortlistId);

    const parsed = updateTalentShortlistSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const updated = await this.repository.update(shortlistId, parsed.data);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.updated',
      targetType: 'TalentShortlist',
      targetId: shortlistId,
      outcome: AuditOutcome.SUCCESS,
    });

    return mapShortlistSummary(updated);
  }

  async remove(userId: string, shortlistId: string): Promise<void> {
    const { companyId } = await this.requireWriteAccess(userId);
    await this.loadOwnedShortlist(companyId, shortlistId);

    await this.repository.delete(shortlistId);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.deleted',
      targetType: 'TalentShortlist',
      targetId: shortlistId,
      outcome: AuditOutcome.SUCCESS,
    });
  }

  async addMember(
    userId: string,
    shortlistId: string,
    body: unknown,
  ): Promise<TalentShortlistMemberResult> {
    const { companyId } = await this.requireWriteAccess(userId);
    await this.loadOwnedShortlist(companyId, shortlistId);

    const parsed = addTalentShortlistMemberSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { candidateUserId, notes, tags } = parsed.data;

    const discoverable = await this.candidateSearchService.isDiscoverable(candidateUserId);
    if (!discoverable) {
      throw new BadRequestException({
        code: TALENT_PIPELINE_ERROR_CODES.CANDIDATE_NOT_DISCOVERABLE,
      });
    }

    const existing = await this.repository.findMember(shortlistId, candidateUserId);
    if (existing) {
      throw new BadRequestException({ code: TALENT_PIPELINE_ERROR_CODES.MEMBER_ALREADY_ADDED });
    }

    const sortOrder = await this.repository.countInStage(shortlistId, 'SHORTLISTED');
    const created = await this.repository.addMember({
      shortlistId,
      candidateUserId,
      addedByUserId: userId,
      sortOrder,
      notes,
      tags,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.member_added',
      targetType: 'TalentShortlistMember',
      targetId: created.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { shortlistId, candidateUserId },
    });

    return mapShortlistMember(created);
  }

  async updateMember(
    userId: string,
    shortlistId: string,
    memberId: string,
    body: unknown,
  ): Promise<TalentShortlistMemberResult> {
    const { companyId } = await this.requireWriteAccess(userId);
    await this.loadOwnedShortlist(companyId, shortlistId);

    const member = await this.repository.findMemberById(memberId);
    if (!member || member.shortlistId !== shortlistId) {
      throw new NotFoundException({ code: TALENT_PIPELINE_ERROR_CODES.MEMBER_NOT_FOUND });
    }

    const parsed = updateTalentShortlistMemberSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: TALENT_PIPELINE_ERROR_CODES.SHORTLIST_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { stage, targetIndex, notes, tags } = parsed.data;

    const fieldUpdates: Record<string, unknown> = {};
    if (stage !== undefined) fieldUpdates.stage = stage;
    if (notes !== undefined) fieldUpdates.notes = notes;
    if (tags !== undefined) fieldUpdates.tags = tags;

    if (Object.keys(fieldUpdates).length > 0) {
      await this.repository.updateMember(memberId, fieldUpdates);
    }

    const destinationStage: TalentPipelineStageValue = stage ?? member.stage;
    if (stage !== undefined || targetIndex !== undefined) {
      const siblings = await this.repository.listStageMembersOrdered(shortlistId, destinationStage);
      const siblingIds = siblings.map((s) => s.id).filter((id) => id !== memberId);
      const index = Math.max(0, Math.min(targetIndex ?? siblingIds.length, siblingIds.length));
      siblingIds.splice(index, 0, memberId);
      await this.repository.reindexStage(shortlistId, destinationStage, siblingIds);
    }

    const updated = await this.repository.findMemberByIdWithCandidate(memberId);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.member_updated',
      targetType: 'TalentShortlistMember',
      targetId: memberId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { shortlistId, stage },
    });

    return mapShortlistMember(updated);
  }

  async removeMember(userId: string, shortlistId: string, memberId: string): Promise<void> {
    const { companyId } = await this.requireWriteAccess(userId);
    await this.loadOwnedShortlist(companyId, shortlistId);

    const member = await this.repository.findMemberById(memberId);
    if (!member || member.shortlistId !== shortlistId) {
      throw new NotFoundException({ code: TALENT_PIPELINE_ERROR_CODES.MEMBER_NOT_FOUND });
    }

    await this.repository.removeMember(memberId);

    const remaining = await this.repository.listStageMembersOrdered(shortlistId, member.stage);
    if (remaining.length > 0) {
      await this.repository.reindexStage(
        shortlistId,
        member.stage,
        remaining.map((m) => m.id),
      );
    }

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'talent_shortlist.member_removed',
      targetType: 'TalentShortlistMember',
      targetId: memberId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { shortlistId },
    });
  }
}
