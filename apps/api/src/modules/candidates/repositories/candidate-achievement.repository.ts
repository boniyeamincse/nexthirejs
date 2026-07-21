import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateAchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateAchievement.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateAchievement.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateAchievement.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: any, sortOrder: number) {
    return this.prisma.candidateAchievement.create({
      data: {
        userId,
        title: data.title,
        issuer: data.issuer ?? null,
        achievedAt: data.achievedAt ? new Date(data.achievedAt) : null,
        description: data.description ?? null,
        referenceUrl: data.referenceUrl ?? null,
        sortOrder,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.issuer !== undefined) updateData.issuer = data.issuer ?? null;
    if (data.achievedAt !== undefined) updateData.achievedAt = data.achievedAt ? new Date(data.achievedAt) : null;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.referenceUrl !== undefined) updateData.referenceUrl = data.referenceUrl ?? null;

    return this.prisma.candidateAchievement.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateAchievement.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateAchievement.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  }
}
