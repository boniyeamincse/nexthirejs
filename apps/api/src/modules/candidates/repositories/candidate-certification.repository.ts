import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateCertificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateCertification.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { issueDate: 'desc' }],
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.candidateCertification.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.candidateCertification.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: any, sortOrder: number) {
    return this.prisma.candidateCertification.create({
      data: {
        userId,
        name: data.name,
        issuer: data.issuer,
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        doesNotExpire: data.doesNotExpire ?? false,
        credentialId: data.credentialId ?? null,
        credentialUrl: data.credentialUrl ?? null,
        sortOrder,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.issuer !== undefined) updateData.issuer = data.issuer;
    if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
    if (data.expiryDate !== undefined)
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.doesNotExpire !== undefined) updateData.doesNotExpire = data.doesNotExpire;
    if (data.credentialId !== undefined) updateData.credentialId = data.credentialId ?? null;
    if (data.credentialUrl !== undefined) updateData.credentialUrl = data.credentialUrl ?? null;

    return this.prisma.candidateCertification.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.candidateCertification.delete({
      where: { id },
    });
  }

  async updateSortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.candidateCertification.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }
}
