import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CandidateProfilePrivacyInput } from '@nexthire/types';
import { CANDIDATE_PRIVACY_POLICY_VERSION } from '@nexthire/types';

@Injectable()
export class CandidateProfilePrivacyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateProfilePrivacy.findUnique({
      where: { userId },
    });
  }

  async upsert(userId: string, data: CandidateProfilePrivacyInput) {
    const sectionData = {
      basicProfile: data.sections.BASIC_PROFILE,
      locationAndPreferences: data.sections.LOCATION_AND_PREFERENCES,
      education: data.sections.EDUCATION,
      workExperience: data.sections.WORK_EXPERIENCE,
      skillsAndLanguages: data.sections.SKILLS_AND_LANGUAGES,
      certificationsAndTraining: data.sections.CERTIFICATIONS_AND_TRAINING,
      achievementsAndLinks: data.sections.ACHIEVEMENTS_AND_LINKS,
    };

    return this.prisma.candidateProfilePrivacy.upsert({
      where: { userId },
      create: {
        userId,
        overallDiscoverability: data.overallDiscoverability,
        ...sectionData,
        policyVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
      },
      update: {
        overallDiscoverability: data.overallDiscoverability,
        ...sectionData,
        policyVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
      },
    });
  }
}
