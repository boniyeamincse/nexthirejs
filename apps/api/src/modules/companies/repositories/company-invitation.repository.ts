import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CompanyInvitableRoleValue } from '@nexthire/types';

const ACTIVE_INVITATION_STATUSES = ['PENDING'] as const;

@Injectable()
export class CompanyInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPendingByCompanyAndEmail(companyId: string, email: string) {
    return this.prisma.companyInvitation.findFirst({
      where: { companyId, email, status: { in: [...ACTIVE_INVITATION_STATUSES] } },
    });
  }

  findById(invitationId: string) {
    return this.prisma.companyInvitation.findUnique({
      where: { id: invitationId },
      include: { company: true },
    });
  }

  listByCompany(companyId: string) {
    return this.prisma.companyInvitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPendingByEmail(email: string) {
    return this.prisma.companyInvitation.findMany({
      where: { email, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    });
  }

  create(params: {
    companyId: string;
    email: string;
    role: CompanyInvitableRoleValue;
    invitedByUserId: string;
    expiresAt: Date;
  }) {
    return this.prisma.companyInvitation.create({ data: params });
  }

  updateStatus(invitationId: string, data: Record<string, unknown>) {
    return this.prisma.companyInvitation.update({ where: { id: invitationId }, data });
  }
}
