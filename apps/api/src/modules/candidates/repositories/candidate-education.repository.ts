import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEducationRecordInput, UpdateEducationRecordInput } from '@nexthire/validation';
import { EducationLevel } from '@nexthire/types';

@Injectable()
export class CandidateEducationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.educationRecord.findMany({
      where: { userId },
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' }
      ],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.educationRecord.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.educationRecord.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: CreateEducationRecordInput, sortOrder: number) {
    return this.prisma.educationRecord.create({
      data: {
        userId,
        educationLevel: data.educationLevel,
        institutionName: data.institutionName,
        qualification: data.qualification,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        currentlyStudying: data.currentlyStudying,
        grade: data.grade,
        description: data.description,
        sortOrder,
      },
    });
  }

  async update(id: string, data: UpdateEducationRecordInput) {
    const updateData: any = {};
    if (data.educationLevel !== undefined) updateData.educationLevel = data.educationLevel;
    if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.fieldOfStudy !== undefined) updateData.fieldOfStudy = data.fieldOfStudy;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.currentlyStudying !== undefined) updateData.currentlyStudying = data.currentlyStudying;
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.description !== undefined) updateData.description = data.description;

    return this.prisma.educationRecord.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.educationRecord.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    // Perform bulk update in a transaction
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.educationRecord.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  }
}
