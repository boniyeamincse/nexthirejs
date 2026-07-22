import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateTrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateTraining.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateTraining.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateTraining.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: any, sortOrder: number) {
    return this.prisma.candidateTraining.create({
      data: {
        userId,
        title: data.title,
        provider: data.provider,
        completionDate: new Date(data.completionDate),
        durationHours: data.durationHours ?? null,
        description: data.description ?? null,
        sortOrder,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.completionDate !== undefined)
      updateData.completionDate = new Date(data.completionDate);
    if (data.durationHours !== undefined) updateData.durationHours = data.durationHours;
    if (data.description !== undefined) updateData.description = data.description ?? null;

    return this.prisma.candidateTraining.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateTraining.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateTraining.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }
}
