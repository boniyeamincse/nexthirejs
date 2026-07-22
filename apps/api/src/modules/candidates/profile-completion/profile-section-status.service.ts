import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  DashboardSection,
  DASHBOARD_SECTIONS,
  SECTION_LABELS,
  SECTION_ROUTES,
  SECTION_POSSIBLE_POINTS,
  ProfileSectionStatus,
  CandidateProfileSectionProgress,
} from '@nexthire/types';

interface ProfileData {
  candidateProfile: Record<string, unknown> | null;
  candidatePreference: Record<string, unknown> | null;
  educationRecords: Record<string, unknown>[];
  workExperienceRecords: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  languages: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  training: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  professionalLinks: Record<string, unknown>[];
  profilePrivacy: Record<string, unknown> | null;
}

@Injectable()
export class ProfileSectionStatusService {
  private readonly basicWeights: Record<string, number> = {
    fullName: 17,
    professionalHeadline: 7,
    professionalSummary: 4,
    dateOfBirth: 2,
  };

  private readonly preferenceWeights: Record<string, number> = {
    countryCode: 5,
    currentCity: 5,
    preferredJobRoles: 4,
    preferredWorkModes: 2,
    preferredEmploymentTypes: 2,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getAllSectionStatuses(userId: string): Promise<CandidateProfileSectionProgress[]> {
    const data = await this.loadProfileData(userId);

    return DASHBOARD_SECTIONS.map((section) => {
      const possiblePoints = SECTION_POSSIBLE_POINTS[section];
      const earnedPoints = this.calculateSectionEarned(section, data);
      const status = this.determineStatus(section, earnedPoints, possiblePoints, data);
      const missingItems = this.getMissingItems(section, data);

      let percentage: number;
      if (possiblePoints > 0) {
        percentage = Math.round((earnedPoints / possiblePoints) * 100);
      } else {
        percentage = status === 'COMPLETED' ? 100 : 0;
      }

      return {
        section,
        label: SECTION_LABELS[section],
        status,
        earnedPoints,
        possiblePoints,
        percentage,
        route: SECTION_ROUTES[section],
        missingItems,
      };
    });
  }

  calculateSectionEarned(section: DashboardSection, data: ProfileData): number {
    switch (section) {
      case 'BASIC_PROFILE': {
        const profile = data.candidateProfile;
        if (!profile) return 0;
        let earned = 0;
        for (const weight of Object.values(this.basicWeights)) {
          earned += weight;
        }
        for (const [field, weight] of Object.entries(this.basicWeights)) {
          const value = profile[field];
          if (value === null || value === undefined || String(value).trim() === '') {
            earned -= weight;
          }
        }
        return earned;
      }

      case 'LOCATION_AND_PREFERENCES': {
        const preferences = data.candidatePreference;
        if (!preferences) return 0;
        let earned = 0;
        for (const weight of Object.values(this.preferenceWeights)) {
          earned += weight;
        }
        for (const [field, weight] of Object.entries(this.preferenceWeights)) {
          const value = preferences[field];
          if (Array.isArray(value)) {
            if (value.length > 0) {
              continue;
            }
          } else if (value !== null && value !== undefined && String(value).trim() !== '') {
            continue;
          }
          earned -= weight;
        }
        return earned;
      }

      case 'EDUCATION': {
        const records = data.educationRecords;
        if (!records || records.length === 0) return 0;
        let earned = 7;
        if (
          records.some(
            (r) =>
              r.fieldOfStudy !== null &&
              r.fieldOfStudy !== undefined &&
              String(r.fieldOfStudy).trim() !== '',
          )
        ) {
          earned += 2;
        }
        if (
          records.some(
            (r) =>
              (r.grade !== null && r.grade !== undefined && String(r.grade).trim() !== '') ||
              (r.description !== null &&
                r.description !== undefined &&
                String(r.description).trim() !== ''),
          )
        ) {
          earned += 2;
        }
        return earned;
      }

      case 'WORK_EXPERIENCE': {
        const records = data.workExperienceRecords;
        return records && records.length > 0 ? 10 : 0;
      }

      case 'SKILLS': {
        const records = data.skills;
        let earned = 0;
        if (records && records.length >= 3) {
          earned += 6;
        }
        if (
          records?.some((r) => ['INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(r.level as string))
        ) {
          earned += 2;
        }
        return earned;
      }

      case 'LANGUAGES': {
        const records = data.languages;
        let earned = 0;
        if (records && records.length >= 1) {
          earned += 3;
        }
        if (
          records?.some((r) => ['PROFESSIONAL', 'FLUENT', 'NATIVE'].includes(r.speaking as string))
        ) {
          earned += 2;
        }
        return earned;
      }

      case 'CERTIFICATIONS': {
        const records = data.certifications;
        let earned = 0;
        if (records && records.length >= 1) {
          earned += 4;
        }
        if (
          records?.some(
            (r) =>
              (r.credentialId !== null &&
                r.credentialId !== undefined &&
                String(r.credentialId).trim() !== '') ||
              (r.credentialUrl !== null &&
                r.credentialUrl !== undefined &&
                String(r.credentialUrl).trim() !== ''),
          )
        ) {
          earned += 1;
        }
        return earned;
      }

      case 'TRAINING': {
        const records = data.training;
        return records && records.length >= 1 ? 3 : 0;
      }

      case 'ACHIEVEMENTS': {
        const records = data.achievements;
        let earned = 0;
        if (records && records.length >= 1) {
          earned += 4;
        }
        if (
          records?.some(
            (r) =>
              (r.description !== null &&
                r.description !== undefined &&
                String(r.description).trim() !== '') ||
              (r.referenceUrl !== null &&
                r.referenceUrl !== undefined &&
                String(r.referenceUrl).trim() !== ''),
          )
        ) {
          earned += 1;
        }
        return earned;
      }

      case 'PROFESSIONAL_LINKS': {
        const records = data.professionalLinks;
        let earned = 0;
        if (records && records.length >= 1) {
          earned += 3;
        }
        if (
          records?.some((r) =>
            ['LINKEDIN', 'GITHUB', 'PORTFOLIO', 'PERSONAL_WEBSITE'].includes(r.type as string),
          )
        ) {
          earned += 2;
        }
        return earned;
      }

      case 'PRIVACY_AND_SHARING':
        return 0;

      default:
        return 0;
    }
  }

  getMissingItems(section: DashboardSection, data: ProfileData): string[] {
    const items: string[] = [];

    switch (section) {
      case 'BASIC_PROFILE': {
        const profile = data.candidateProfile;
        for (const [field, weight] of Object.entries(this.basicWeights)) {
          const value = profile?.[field];
          if (!value || String(value).trim() === '') {
            items.push(this.basicMissingLabel(field));
          }
        }
        break;
      }

      case 'LOCATION_AND_PREFERENCES': {
        const preferences = data.candidatePreference;
        for (const [field, weight] of Object.entries(this.preferenceWeights)) {
          const value = preferences?.[field];
          if (Array.isArray(value)) {
            if (value.length === 0) {
              items.push(this.preferenceMissingLabel(field));
            }
          } else if (!value || String(value).trim() === '') {
            items.push(this.preferenceMissingLabel(field));
          }
        }
        break;
      }

      case 'EDUCATION': {
        const records = data.educationRecords;
        if (!records || records.length === 0) {
          items.push('Add at least one education record');
        } else {
          if (
            !records.some(
              (r) =>
                r.fieldOfStudy !== null &&
                r.fieldOfStudy !== undefined &&
                String(r.fieldOfStudy).trim() !== '',
            )
          ) {
            items.push('Add field of study to an education record');
          }
          if (
            !records.some(
              (r) =>
                (r.grade !== null && r.grade !== undefined && String(r.grade).trim() !== '') ||
                (r.description !== null &&
                  r.description !== undefined &&
                  String(r.description).trim() !== ''),
            )
          ) {
            items.push('Add grade or description to an education record');
          }
        }
        break;
      }

      case 'WORK_EXPERIENCE': {
        const records = data.workExperienceRecords;
        if (!records || records.length === 0) {
          items.push('Add at least one work experience record');
        }
        break;
      }

      case 'SKILLS': {
        const records = data.skills;
        if (!records || records.length < 3) {
          items.push('Add at least 3 skills');
        }
        if (
          !records?.some((r) => ['INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(r.level as string))
        ) {
          items.push('Add an intermediate or higher skill');
        }
        break;
      }

      case 'LANGUAGES': {
        const records = data.languages;
        if (!records || records.length < 1) {
          items.push('Add at least one language');
        }
        if (
          !records?.some((r) => ['PROFESSIONAL', 'FLUENT', 'NATIVE'].includes(r.speaking as string))
        ) {
          items.push('Add professional-level speaking proficiency');
        }
        break;
      }

      case 'CERTIFICATIONS': {
        const records = data.certifications;
        if (!records || records.length < 1) {
          items.push('Add at least one certification');
        }
        if (
          !records?.some(
            (r) =>
              (r.credentialId !== null &&
                r.credentialId !== undefined &&
                String(r.credentialId).trim() !== '') ||
              (r.credentialUrl !== null &&
                r.credentialUrl !== undefined &&
                String(r.credentialUrl).trim() !== ''),
          )
        ) {
          items.push('Add a credential ID or URL');
        }
        break;
      }

      case 'TRAINING': {
        const records = data.training;
        if (!records || records.length < 1) {
          items.push('Add at least one training record');
        }
        break;
      }

      case 'ACHIEVEMENTS': {
        const records = data.achievements;
        if (!records || records.length < 1) {
          items.push('Add at least one achievement');
        }
        if (
          !records?.some(
            (r) =>
              (r.description !== null &&
                r.description !== undefined &&
                String(r.description).trim() !== '') ||
              (r.referenceUrl !== null &&
                r.referenceUrl !== undefined &&
                String(r.referenceUrl).trim() !== ''),
          )
        ) {
          items.push('Add description or URL to an achievement');
        }
        break;
      }

      case 'PROFESSIONAL_LINKS': {
        const records = data.professionalLinks;
        if (!records || records.length < 1) {
          items.push('Add at least one professional link');
        }
        if (
          !records?.some((r) =>
            ['LINKEDIN', 'GITHUB', 'PORTFOLIO', 'PERSONAL_WEBSITE'].includes(r.type as string),
          )
        ) {
          items.push('Add a key link (LinkedIn, GitHub, Portfolio, or Website)');
        }
        break;
      }

      case 'PRIVACY_AND_SHARING':
        items.push('Review your privacy and sharing settings');
        break;
    }

    return items.slice(0, 3);
  }

  private basicMissingLabel(field: string): string {
    const labels: Record<string, string> = {
      fullName: 'Add your full name',
      professionalHeadline: 'Add a professional headline',
      professionalSummary: 'Add a professional summary',
      dateOfBirth: 'Add your date of birth',
    };
    return labels[field] ?? `Add your ${field}`;
  }

  private preferenceMissingLabel(field: string): string {
    const labels: Record<string, string> = {
      countryCode: 'Add your country',
      currentCity: 'Add your current city',
      preferredJobRoles: 'Add preferred job roles',
      preferredWorkModes: 'Add preferred work modes',
      preferredEmploymentTypes: 'Add preferred employment types',
    };
    return labels[field] ?? `Add your ${field}`;
  }

  private determineStatus(
    section: DashboardSection,
    earned: number,
    possible: number,
    data: ProfileData,
  ): ProfileSectionStatus {
    if (section === 'PRIVACY_AND_SHARING') {
      return data.profilePrivacy?.source === 'PERSISTED' ? 'COMPLETED' : 'NOT_STARTED';
    }
    if (earned === 0) return 'NOT_STARTED';
    if (earned < possible) return 'IN_PROGRESS';
    return 'COMPLETED';
  }

  private async loadProfileData(userId: string): Promise<ProfileData> {
    const [
      candidateProfile,
      candidatePreference,
      educationRecords,
      workExperienceRecords,
      skills,
      languages,
      certifications,
      training,
      achievements,
      professionalLinks,
      profilePrivacy,
    ] = await Promise.all([
      this.prisma.candidateProfile.findUnique({ where: { userId } }),
      this.prisma.candidatePreference.findUnique({
        where: { userId },
        include: { country: true },
      }),
      this.prisma.educationRecord.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.workExperienceRecord.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateSkill.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateLanguage.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateCertification.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateTraining.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateAchievement.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateProfessionalLink.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateProfilePrivacy.findUnique({
        where: { userId },
      }),
    ]);

    const preferenceWithCountry = candidatePreference
      ? {
          ...candidatePreference,
          countryCode: (candidatePreference as any).country?.code ?? undefined,
        }
      : null;

    return {
      candidateProfile: (candidateProfile as Record<string, unknown>) ?? null,
      candidatePreference: preferenceWithCountry as Record<string, unknown> | null,
      educationRecords: educationRecords as Record<string, unknown>[],
      workExperienceRecords: workExperienceRecords as Record<string, unknown>[],
      skills: skills as Record<string, unknown>[],
      languages: languages as Record<string, unknown>[],
      certifications: certifications as Record<string, unknown>[],
      training: training as Record<string, unknown>[],
      achievements: achievements as Record<string, unknown>[],
      professionalLinks: professionalLinks as Record<string, unknown>[],
      profilePrivacy: (profilePrivacy as Record<string, unknown>) ?? null,
    };
  }
}
