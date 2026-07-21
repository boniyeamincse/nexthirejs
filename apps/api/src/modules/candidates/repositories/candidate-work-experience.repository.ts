import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CreateWorkExperienceRecordInput, UpdateWorkExperienceRecordInput } from '@nexthire/validation';

@Injectable()
export class CandidateWorkExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.workExperienceRecord.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.workExperienceRecord.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.workExperienceRecord.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: CreateWorkExperienceRecordInput, sortOrder: number) {
    return this.prisma.workExperienceRecord.create({
      data: {
        userId,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        employmentType: data.employmentType,
        location: data.location ?? null,
        isRemote: data.isRemote ?? false,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        currentlyWorking: data.currentlyWorking,
        responsibilities: data.responsibilities ?? null,
        achievements: data.achievements ?? null,
        sortOrder,
      },
    });
  }

  async update(id: string, data: UpdateWorkExperienceRecordInput) {
    const updateData: any = {};
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isRemote !== undefined) updateData.isRemote = data.isRemote;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.currentlyWorking !== undefined) updateData.currentlyWorking = data.currentlyWorking;
    if (data.responsibilities !== undefined) updateData.responsibilities = data.responsibilities;
    if (data.achievements !== undefined) updateData.achievements = data.achievements;

    return this.prisma.workExperienceRecord.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.workExperienceRecord.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.workExperienceRecord.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  }
}
