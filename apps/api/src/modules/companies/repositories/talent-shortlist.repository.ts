import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { TalentPipelineStageValue } from '@nexthire/types';

const MEMBER_INCLUDE = {
  orderBy: [{ stage: 'asc' as const }, { sortOrder: 'asc' as const }],
  include: { candidate: { include: { candidateProfile: true } } },
};

@Injectable()
export class TalentShortlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByCompany(companyId: string) {
    return this.prisma.talentShortlist.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
  }

  findByIdForCompany(id: string, companyId: string) {
    return this.prisma.talentShortlist.findFirst({
      where: { id, companyId },
      include: { members: MEMBER_INCLUDE, _count: { select: { members: true } } },
    });
  }

  findByIdAndCompanyId(id: string, companyId: string) {
    return this.prisma.talentShortlist.findFirst({ where: { id, companyId } });
  }

  create(companyId: string, createdByUserId: string, data: { name: string; description?: string }) {
    return this.prisma.talentShortlist.create({
      data: {
        companyId,
        createdByUserId,
        name: data.name,
        description: data.description ?? null,
      },
      include: { _count: { select: { members: true } } },
    });
  }

  update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.talentShortlist.update({
      where: { id },
      data,
      include: { _count: { select: { members: true } } },
    });
  }

  delete(id: string) {
    return this.prisma.talentShortlist.delete({ where: { id } });
  }

  findMember(shortlistId: string, candidateUserId: string) {
    return this.prisma.talentShortlistMember.findUnique({
      where: { shortlistId_candidateUserId: { shortlistId, candidateUserId } },
    });
  }

  findMemberById(memberId: string) {
    return this.prisma.talentShortlistMember.findUnique({ where: { id: memberId } });
  }

  findMemberByIdWithCandidate(memberId: string) {
    return this.prisma.talentShortlistMember.findUnique({
      where: { id: memberId },
      include: { candidate: { include: { candidateProfile: true } } },
    });
  }

  countInStage(shortlistId: string, stage: TalentPipelineStageValue) {
    return this.prisma.talentShortlistMember.count({ where: { shortlistId, stage } });
  }

  listStageMembersOrdered(shortlistId: string, stage: TalentPipelineStageValue) {
    return this.prisma.talentShortlistMember.findMany({
      where: { shortlistId, stage },
      orderBy: { sortOrder: 'asc' },
    });
  }

  addMember(params: {
    shortlistId: string;
    candidateUserId: string;
    addedByUserId: string;
    sortOrder: number;
    notes?: string;
    tags?: string[];
  }) {
    return this.prisma.talentShortlistMember.create({
      data: {
        shortlistId: params.shortlistId,
        candidateUserId: params.candidateUserId,
        addedByUserId: params.addedByUserId,
        sortOrder: params.sortOrder,
        notes: params.notes ?? null,
        tags: params.tags ?? [],
      },
      include: { candidate: { include: { candidateProfile: true } } },
    });
  }

  updateMember(memberId: string, data: Record<string, unknown>) {
    return this.prisma.talentShortlistMember.update({
      where: { id: memberId },
      data,
      include: { candidate: { include: { candidateProfile: true } } },
    });
  }

  removeMember(memberId: string) {
    return this.prisma.talentShortlistMember.delete({ where: { id: memberId } });
  }

  reindexStage(shortlistId: string, stage: TalentPipelineStageValue, orderedIds: string[]) {
    return this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.talentShortlistMember.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
