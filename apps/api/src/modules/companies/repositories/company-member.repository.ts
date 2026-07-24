import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CompanyMemberRoleValue } from '@nexthire/types';

@Injectable()
export class CompanyMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.companyMember.findFirst({ where: { userId } });
  }

  findByCompanyAndUser(companyId: string, userId: string) {
    return this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
  }

  findById(memberId: string) {
    return this.prisma.companyMember.findUnique({ where: { id: memberId } });
  }

  findByIdWithUser(memberId: string) {
    return this.prisma.companyMember.findUnique({
      where: { id: memberId },
      include: { user: { include: { candidateProfile: true } } },
    });
  }

  listByCompany(companyId: string) {
    return this.prisma.companyMember.findMany({
      where: { companyId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      include: { user: { include: { candidateProfile: true } } },
    });
  }

  create(params: {
    companyId: string;
    userId: string;
    role: CompanyMemberRoleValue;
    invitedByUserId?: string;
  }) {
    return this.prisma.companyMember.create({ data: params });
  }

  updateRole(memberId: string, role: CompanyMemberRoleValue) {
    return this.prisma.companyMember.update({ where: { id: memberId }, data: { role } });
  }

  remove(memberId: string) {
    return this.prisma.companyMember.delete({ where: { id: memberId } });
  }
}
