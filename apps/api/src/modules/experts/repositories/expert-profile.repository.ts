import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { ExpertProfileSchemaInput } from '@nexthire/validation';

/**
 * Data access for ExpertProfile records.
 */
@Injectable()
export class ExpertProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.expertProfile.findUnique({ where: { userId } });
  }

  countryExists(countryId: string): Promise<boolean> {
    return this.prisma.country
      .count({ where: { id: countryId, isActive: true } })
      .then((n) => n > 0);
  }

  async upsert(userId: string, data: ExpertProfileSchemaInput) {
    const persistable = {
      professionalTitle: data.professionalTitle,
      professionalSummary: data.professionalSummary,
      yearsOfExperience: data.yearsOfExperience,
      currentCompany: data.currentCompany ?? null,
      currentPosition: data.currentPosition ?? null,
      highestEducation: data.highestEducation ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      portfolioUrl: data.portfolioUrl ?? null,
      personalWebsiteUrl: data.personalWebsiteUrl ?? null,
      interviewLanguages: data.interviewLanguages,
      countryId: data.countryId,
      city: data.city ?? null,
    };

    return this.prisma.expertProfile.upsert({
      where: { userId },
      create: { userId, ...persistable },
      update: persistable,
    });
  }
}
