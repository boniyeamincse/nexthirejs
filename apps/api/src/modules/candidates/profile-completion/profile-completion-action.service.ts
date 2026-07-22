import { Injectable } from '@nestjs/common';
import {
  DashboardSection,
  DASHBOARD_SECTIONS,
  SECTION_ROUTES,
  CandidateProfileCompletionAction,
} from '@nexthire/types';

interface FieldActionConfig {
  section: DashboardSection;
  title: string;
  pointsAvailable: number;
}

const FIELD_ACTION_MAP: Record<string, FieldActionConfig> = {
  fullName: { section: 'BASIC_PROFILE', title: 'Add your full name', pointsAvailable: 17 },
  professionalHeadline: { section: 'BASIC_PROFILE', title: 'Add a professional headline', pointsAvailable: 7 },
  professionalSummary: { section: 'BASIC_PROFILE', title: 'Add a professional summary', pointsAvailable: 4 },
  dateOfBirth: { section: 'BASIC_PROFILE', title: 'Add your date of birth', pointsAvailable: 2 },
  countryCode: { section: 'LOCATION_AND_PREFERENCES', title: 'Add your country', pointsAvailable: 5 },
  currentCity: { section: 'LOCATION_AND_PREFERENCES', title: 'Add your current city', pointsAvailable: 5 },
  preferredJobRoles: { section: 'LOCATION_AND_PREFERENCES', title: 'Add preferred job roles', pointsAvailable: 4 },
  preferredWorkModes: { section: 'LOCATION_AND_PREFERENCES', title: 'Add preferred work modes', pointsAvailable: 2 },
  preferredEmploymentTypes: { section: 'LOCATION_AND_PREFERENCES', title: 'Add preferred employment types', pointsAvailable: 2 },
  education: { section: 'EDUCATION', title: 'Add at least one education record', pointsAvailable: 7 },
  educationFieldOfStudy: { section: 'EDUCATION', title: 'Add field of study to education', pointsAvailable: 2 },
  educationGradeOrDescription: { section: 'EDUCATION', title: 'Add grade or description to education', pointsAvailable: 2 },
  workExperience: { section: 'WORK_EXPERIENCE', title: 'Add at least one work experience', pointsAvailable: 10 },
  skillsCount: { section: 'SKILLS', title: 'Add at least 3 skills', pointsAvailable: 6 },
  skillsLevel: { section: 'SKILLS', title: 'Add an advanced skill', pointsAvailable: 2 },
  languagesCount: { section: 'LANGUAGES', title: 'Add at least one language', pointsAvailable: 3 },
  languagesProficiency: { section: 'LANGUAGES', title: 'Improve language proficiency', pointsAvailable: 2 },
  certifications: { section: 'CERTIFICATIONS', title: 'Add at least one certification', pointsAvailable: 4 },
  certificationsCredential: { section: 'CERTIFICATIONS', title: 'Add credential ID or URL', pointsAvailable: 1 },
  training: { section: 'TRAINING', title: 'Add at least one training record', pointsAvailable: 3 },
  achievements: { section: 'ACHIEVEMENTS', title: 'Add at least one achievement', pointsAvailable: 4 },
  achievementsDetail: { section: 'ACHIEVEMENTS', title: 'Add details to achievement', pointsAvailable: 1 },
  professionalLinks: { section: 'PROFESSIONAL_LINKS', title: 'Add at least one professional link', pointsAvailable: 3 },
  professionalLinksKey: { section: 'PROFESSIONAL_LINKS', title: 'Add a key profile link', pointsAvailable: 2 },
};

@Injectable()
export class ProfileCompletionActionService {
  getActions(
    _userId: string,
    _profileData: any,
    missingFields: string[],
  ): CandidateProfileCompletionAction[] {
    const sectionPriority = DASHBOARD_SECTIONS.reduce<Record<string, number>>(
      (acc, section, index) => {
        acc[section] = index;
        return acc;
      },
      {},
    );

    const seen = new Set<string>();
    const actions: CandidateProfileCompletionAction[] = [];

    for (const field of missingFields) {
      const config = FIELD_ACTION_MAP[field];
      if (!config) continue;

      const dedupKey = `${config.section}-${config.title}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const priority = sectionPriority[config.section] ?? 99;

      actions.push({
        id: `action-${field}`,
        section: config.section,
        title: config.title,
        description: config.title,
        route: SECTION_ROUTES[config.section],
        priority,
        pointsAvailable: config.pointsAvailable,
      });

      if (actions.length >= 10) break;
    }

    return actions.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.pointsAvailable - a.pointsAvailable;
    });
  }
}
