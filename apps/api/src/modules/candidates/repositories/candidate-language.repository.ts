import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCandidateLanguageInput, UpdateCandidateLanguageInput } from '@nexthire/validation';

@Injectable()
export class CandidateLanguageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateLanguage.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateLanguage.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateLanguage.findFirst({
      where: { id, userId },
    });
  }

  async findByNormalizedNameAndUserId(normalizedName: string, userId: string) {
    return this.prisma.candidateLanguage.findFirst({
      where: { normalizedName, userId },
    });
  }

  async create(
    userId: string,
    data: CreateCandidateLanguageInput,
    normalizedName: string,
    sortOrder: number,
  ) {
    return this.prisma.candidateLanguage.create({
      data: {
        userId,
        name: data.name,
        normalizedName,
        speaking: data.speaking,
        reading: data.reading,
        writing: data.writing,
        sortOrder,
      },
    });
  }

  async update(id: string, data: UpdateCandidateLanguageInput, normalizedName: string) {
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.normalizedName = normalizedName;
    }
    if (data.speaking !== undefined) updateData.speaking = data.speaking;
    if (data.reading !== undefined) updateData.reading = data.reading;
    if (data.writing !== undefined) updateData.writing = data.writing;

    return this.prisma.candidateLanguage.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateLanguage.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateLanguage.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }
}
