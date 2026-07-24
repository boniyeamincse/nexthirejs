import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyMemberRepository } from '../repositories/company-member.repository';
import { AuditService } from '../../audit/audit.service';
import { COMPANY_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { CompanyMemberResult, CompanyInvitableRoleValue } from '@nexthire/types';
import { mapCompanyMember } from '../shared/company-mappers';

const MANAGER_ROLES = ['OWNER', 'ADMIN'] as const;

@Injectable()
export class CompanyMembershipService {
  constructor(
    private readonly memberRepository: CompanyMemberRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMyRole(userId: string): Promise<{ role: string | null }> {
    const membership = await this.memberRepository.findByUserId(userId);
    return { role: membership?.role ?? null };
  }

  /** Any member of the company may view the team roster. */
  async requireMembership(userId: string) {
    const membership = await this.memberRepository.findByUserId(userId);
    if (!membership) {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.NOT_A_MEMBER });
    }
    return membership;
  }

  async requireManager(userId: string) {
    const membership = await this.requireMembership(userId);
    if (!(MANAGER_ROLES as readonly string[]).includes(membership.role)) {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INSUFFICIENT_ROLE });
    }
    return membership;
  }

  async listMembers(userId: string): Promise<CompanyMemberResult[]> {
    const membership = await this.requireMembership(userId);
    const rows = await this.memberRepository.listByCompany(membership.companyId);
    return rows.map(mapCompanyMember);
  }

  async updateMemberRole(
    actorUserId: string,
    memberId: string,
    role: CompanyInvitableRoleValue,
  ): Promise<CompanyMemberResult> {
    const actor = await this.requireManager(actorUserId);
    const target = await this.memberRepository.findById(memberId);
    if (!target || target.companyId !== actor.companyId) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.MEMBER_NOT_FOUND });
    }
    if (target.role === 'OWNER') {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.CANNOT_MANAGE_OWNER });
    }
    if (actor.role === 'ADMIN' && target.role === 'ADMIN') {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INSUFFICIENT_ROLE });
    }

    await this.memberRepository.updateRole(memberId, role);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId,
      action: 'company.member.role_updated',
      targetType: 'CompanyMember',
      targetId: memberId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { previousRole: target.role, newRole: role },
    });

    const full = await this.memberRepository.findByIdWithUser(memberId);
    return mapCompanyMember(full);
  }

  async removeMember(actorUserId: string, memberId: string): Promise<void> {
    const actor = await this.requireMembership(actorUserId);
    const target = await this.memberRepository.findById(memberId);
    if (!target || target.companyId !== actor.companyId) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.MEMBER_NOT_FOUND });
    }
    if (target.role === 'OWNER') {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.CANNOT_MANAGE_OWNER });
    }

    const isSelf = target.userId === actorUserId;
    if (!isSelf) {
      if (!(MANAGER_ROLES as readonly string[]).includes(actor.role)) {
        throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INSUFFICIENT_ROLE });
      }
      if (actor.role === 'ADMIN' && target.role === 'ADMIN') {
        throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INSUFFICIENT_ROLE });
      }
    }

    await this.memberRepository.remove(memberId);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId,
      action: isSelf ? 'company.member.left' : 'company.member.removed',
      targetType: 'CompanyMember',
      targetId: memberId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { removedUserId: target.userId, removedRole: target.role },
    });
  }
}
