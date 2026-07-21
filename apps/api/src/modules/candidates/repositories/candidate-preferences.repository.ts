import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CandidatePreferenceInput } from '@nexthire/validation';

@Injectable()
export class CandidatePreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidatePreference.findUnique({
      where: { userId },
      include: {
        country: true,
      }
    });
  }

  async upsertPreferences(userId: string, data: CandidatePreferenceInput, countryId: string) {
    return this.prisma.candidatePreference.upsert({
      where: { userId },
      create: {
        userId,
        countryId,
        currentCity: data.currentCity,
        preferredJobRoles: data.preferredJobRoles,
        preferredWorkModes: data.preferredWorkModes,
        preferredEmploymentTypes: data.preferredEmploymentTypes,
      },
      update: {
        countryId,
        currentCity: data.currentCity,
        preferredJobRoles: data.preferredJobRoles,
        preferredWorkModes: data.preferredWorkModes,
        preferredEmploymentTypes: data.preferredEmploymentTypes,
      },
      include: {
        country: true,
      }
    });
  }
}
