import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CandidateProfileBasicsInput } from '@nexthire/validation';

@Injectable()
export class CandidateProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  async upsertProfile(
    userId: string,
    data: CandidateProfileBasicsInput,
    completionPercentage: number,
  ) {
    return this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: data.fullName,
        professionalHeadline: data.professionalHeadline,
        professionalSummary: data.professionalSummary,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        completionPercentage,
      },
      update: {
        fullName: data.fullName,
        professionalHeadline: data.professionalHeadline,
        professionalSummary: data.professionalSummary,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        completionPercentage,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }
}
