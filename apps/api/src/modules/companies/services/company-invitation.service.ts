import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CompanyInvitationRepository } from '../repositories/company-invitation.repository';
import { CompanyMemberRepository } from '../repositories/company-member.repository';
import { CompanyMembershipService } from './company-membership.service';
import { AuditService } from '../../audit/audit.service';
import { COMPANY_ERROR_CODES, COMPANY_INVITATION_EXPIRY_DAYS } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { CompanyInvitationResult, MyCompanyInvitationResult } from '@nexthire/types';
import { createCompanyInvitationSchema } from '@nexthire/validation';
import {
  mapCompanyInvitation,
  mapMyCompanyInvitation,
  mapCompanyMember,
} from '../shared/company-mappers';

@Injectable()
export class CompanyInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationRepository: CompanyInvitationRepository,
    private readonly memberRepository: CompanyMemberRepository,
    private readonly membershipService: CompanyMembershipService,
    private readonly auditService: AuditService,
  ) {}

  async listForMyCompany(userId: string): Promise<CompanyInvitationResult[]> {
    const actor = await this.membershipService.requireManager(userId);
    const rows = await this.invitationRepository.listByCompany(actor.companyId);

    const inviterIds = [...new Set(rows.map((r) => r.invitedByUserId))];
    const inviters = await this.prisma.user.findMany({
      where: { id: { in: inviterIds } },
      include: { candidateProfile: true },
    });
    const inviterNames = new Map(
      inviters.map((u) => [u.id, u.candidateProfile?.fullName ?? u.email]),
    );

    return rows.map((row) =>
      mapCompanyInvitation(row, inviterNames.get(row.invitedByUserId) ?? 'Unknown'),
    );
  }

  async invite(actorUserId: string, body: unknown): Promise<CompanyInvitationResult> {
    const parsed = createCompanyInvitationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { email, role } = parsed.data;

    const actor = await this.membershipService.requireManager(actorUserId);
    if (role === 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INSUFFICIENT_ROLE });
    }

    const invitee = await this.prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITEE_NOT_FOUND });
    }

    const existingMember = await this.memberRepository.findByCompanyAndUser(
      actor.companyId,
      invitee.id,
    );
    if (existingMember) {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITEE_ALREADY_MEMBER });
    }

    const pending = await this.invitationRepository.findPendingByCompanyAndEmail(
      actor.companyId,
      email,
    );
    if (pending) {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITATION_ALREADY_PENDING });
    }

    const expiresAt = new Date(Date.now() + COMPANY_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const created = await this.invitationRepository.create({
      companyId: actor.companyId,
      email,
      role,
      invitedByUserId: actorUserId,
      expiresAt,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId,
      action: 'company.invitation.created',
      targetType: 'CompanyInvitation',
      targetId: created.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { email, role },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      include: { candidateProfile: true },
    });
    return mapCompanyInvitation(
      created,
      inviter?.candidateProfile?.fullName ?? inviter?.email ?? 'Unknown',
    );
  }

  async revoke(actorUserId: string, invitationId: string): Promise<void> {
    const actor = await this.membershipService.requireManager(actorUserId);
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation || invitation.companyId !== actor.companyId) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.INVITATION_NOT_FOUND });
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITATION_NOT_PENDING });
    }

    await this.invitationRepository.updateStatus(invitationId, {
      status: 'REVOKED',
      revokedAt: new Date(),
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId,
      action: 'company.invitation.revoked',
      targetType: 'CompanyInvitation',
      targetId: invitationId,
      outcome: AuditOutcome.SUCCESS,
    });
  }

  private async requireEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.INVITEE_NOT_FOUND });
    }
    return user.email;
  }

  async listMine(userId: string): Promise<MyCompanyInvitationResult[]> {
    const email = await this.requireEmail(userId);
    const rows = await this.invitationRepository.listPendingByEmail(email);
    const now = new Date();
    return rows.filter((row) => row.expiresAt > now).map((row) => mapMyCompanyInvitation(row));
  }

  private async loadActionableInvitation(invitationId: string, email: string) {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.INVITATION_NOT_FOUND });
    }
    if (invitation.email !== email) {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.INVITATION_EMAIL_MISMATCH });
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITATION_NOT_PENDING });
    }
    if (invitation.expiresAt <= new Date()) {
      await this.invitationRepository.updateStatus(invitationId, { status: 'EXPIRED' });
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITATION_EXPIRED });
    }
    return invitation;
  }

  async accept(userId: string, invitationId: string) {
    const email = await this.requireEmail(userId);
    const invitation = await this.loadActionableInvitation(invitationId, email);

    const existingMember = await this.memberRepository.findByCompanyAndUser(
      invitation.companyId,
      userId,
    );
    if (existingMember) {
      throw new BadRequestException({ code: COMPANY_ERROR_CODES.INVITEE_ALREADY_MEMBER });
    }

    const created = await this.memberRepository.create({
      companyId: invitation.companyId,
      userId,
      role: invitation.role,
      invitedByUserId: invitation.invitedByUserId,
    });

    await this.invitationRepository.updateStatus(invitationId, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedByUserId: userId,
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'company.invitation.accepted',
      targetType: 'CompanyInvitation',
      targetId: invitationId,
      outcome: AuditOutcome.SUCCESS,
    });

    const full = await this.memberRepository.findByIdWithUser(created.id);
    return mapCompanyMember(full);
  }

  async decline(userId: string, invitationId: string): Promise<void> {
    const email = await this.requireEmail(userId);
    const invitation = await this.loadActionableInvitation(invitationId, email);

    await this.invitationRepository.updateStatus(invitation.id, {
      status: 'DECLINED',
      declinedAt: new Date(),
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'company.invitation.declined',
      targetType: 'CompanyInvitation',
      targetId: invitationId,
      outcome: AuditOutcome.SUCCESS,
    });
  }
}
