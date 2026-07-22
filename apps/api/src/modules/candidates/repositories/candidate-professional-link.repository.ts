import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateProfessionalLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateProfessionalLink.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { type: 'asc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateProfessionalLink.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateProfessionalLink.findFirst({
      where: { id, userId },
    });
  }

  async findDuplicate(userId: string, normalizedUrl: string, excludeId?: string) {
    const where: any = { userId, normalizedUrl };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return this.prisma.candidateProfessionalLink.findFirst({ where });
  }

  async create(userId: string, data: any, sortOrder: number) {
    return this.prisma.candidateProfessionalLink.create({
      data: {
        userId,
        type: data.type,
        label: data.label ?? null,
        url: data.url,
        normalizedUrl: data.normalizedUrl,
        sortOrder,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.label !== undefined) updateData.label = data.label ?? null;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.normalizedUrl !== undefined) updateData.normalizedUrl = data.normalizedUrl;

    return this.prisma.candidateProfessionalLink.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateProfessionalLink.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateProfessionalLink.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }
}
