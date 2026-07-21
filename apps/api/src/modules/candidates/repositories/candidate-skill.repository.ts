import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCandidateSkillInput, UpdateCandidateSkillInput } from '@nexthire/validation';

@Injectable()
export class CandidateSkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateSkill.findMany({
      where: { userId },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateSkill.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateSkill.findFirst({
      where: { id, userId },
    });
  }

  async findByNormalizedNameAndUserId(normalizedName: string, userId: string) {
    return this.prisma.candidateSkill.findFirst({
      where: { normalizedName, userId },
    });
  }

  async create(userId: string, data: CreateCandidateSkillInput, normalizedName: string, sortOrder: number) {
    return this.prisma.candidateSkill.create({
      data: {
        userId,
        name: data.name,
        normalizedName,
        level: data.level,
        yearsOfExperience: data.yearsOfExperience ?? null,
        sortOrder,
      },
    });
  }

  async update(id: string, data: UpdateCandidateSkillInput, normalizedName: string) {
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.normalizedName = normalizedName;
    }
    if (data.level !== undefined) updateData.level = data.level;
    if (data.yearsOfExperience !== undefined) updateData.yearsOfExperience = data.yearsOfExperience;

    return this.prisma.candidateSkill.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateSkill.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateSkill.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  }
}
