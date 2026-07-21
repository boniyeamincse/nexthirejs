import { Injectable } from '@nestjs/common';
import { DEFAULT_CANDIDATE_PRIVACY_SETTINGS, SUPPORTED_SECTIONS } from '@nexthire/types';
import type { CandidateProfilePrivacyResult } from '@nexthire/types';

@Injectable()
export class CandidatePrivacyPolicyService {
  getDefaultSettings(): CandidateProfilePrivacyResult {
    return {
      overallDiscoverability: DEFAULT_CANDIDATE_PRIVACY_SETTINGS.overallDiscoverability,
      sections: { ...DEFAULT_CANDIDATE_PRIVACY_SETTINGS.sections },
      policyVersion: DEFAULT_CANDIDATE_PRIVACY_SETTINGS.policyVersion,
      source: 'DEFAULT',
      createdAt: null,
      updatedAt: null,
    };
  }

  toResult(record: {
    overallDiscoverability: string;
    basicProfile: string;
    locationAndPreferences: string;
    education: string;
    workExperience: string;
    skillsAndLanguages: string;
    certificationsAndTraining: string;
    achievementsAndLinks: string;
    policyVersion: string;
    createdAt: Date;
    updatedAt: Date;
  }): CandidateProfilePrivacyResult {
    return {
      overallDiscoverability: record.overallDiscoverability as any,
      sections: {
        BASIC_PROFILE: record.basicProfile as any,
        LOCATION_AND_PREFERENCES: record.locationAndPreferences as any,
        EDUCATION: record.education as any,
        WORK_EXPERIENCE: record.workExperience as any,
        SKILLS_AND_LANGUAGES: record.skillsAndLanguages as any,
        CERTIFICATIONS_AND_TRAINING: record.certificationsAndTraining as any,
        ACHIEVEMENTS_AND_LINKS: record.achievementsAndLinks as any,
      },
      policyVersion: record.policyVersion,
      source: 'PERSISTED',
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  getSupportedSections() {
    return SUPPORTED_SECTIONS;
  }
}
