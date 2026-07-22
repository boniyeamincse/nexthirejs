export type ProfileSectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const DASHBOARD_SECTIONS = [
  'BASIC_PROFILE',
  'LOCATION_AND_PREFERENCES',
  'EDUCATION',
  'WORK_EXPERIENCE',
  'SKILLS',
  'LANGUAGES',
  'CERTIFICATIONS',
  'TRAINING',
  'ACHIEVEMENTS',
  'PROFESSIONAL_LINKS',
  'PRIVACY_AND_SHARING',
] as const;

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

export const SECTION_LABELS: Record<DashboardSection, string> = {
  BASIC_PROFILE: 'Basic Profile',
  LOCATION_AND_PREFERENCES: 'Location & Preferences',
  EDUCATION: 'Education',
  WORK_EXPERIENCE: 'Work Experience',
  SKILLS: 'Skills',
  LANGUAGES: 'Languages',
  CERTIFICATIONS: 'Certifications',
  TRAINING: 'Training',
  ACHIEVEMENTS: 'Achievements',
  PROFESSIONAL_LINKS: 'Professional Links',
  PRIVACY_AND_SHARING: 'Privacy & Sharing',
};

export const SECTION_ROUTES: Record<DashboardSection, string> = {
  BASIC_PROFILE: '/profile',
  LOCATION_AND_PREFERENCES: '/profile/preferences',
  EDUCATION: '/profile/education',
  WORK_EXPERIENCE: '/profile/experience',
  SKILLS: '/profile/skills',
  LANGUAGES: '/profile/skills',
  CERTIFICATIONS: '/profile/certifications',
  TRAINING: '/profile/certifications',
  ACHIEVEMENTS: '/profile/achievements',
  PROFESSIONAL_LINKS: '/profile/achievements',
  PRIVACY_AND_SHARING: '/settings/privacy',
};

export const SECTION_POSSIBLE_POINTS: Record<DashboardSection, number> = {
  BASIC_PROFILE: 30,
  LOCATION_AND_PREFERENCES: 18,
  EDUCATION: 11,
  WORK_EXPERIENCE: 10,
  SKILLS: 8,
  LANGUAGES: 5,
  CERTIFICATIONS: 5,
  TRAINING: 3,
  ACHIEVEMENTS: 5,
  PROFESSIONAL_LINKS: 5,
  PRIVACY_AND_SHARING: 0,
};

export interface CandidateProfileSectionProgress {
  section: DashboardSection;
  label: string;
  status: ProfileSectionStatus;
  earnedPoints: number;
  possiblePoints: number;
  percentage: number;
  route: string;
  missingItems: string[];
}

export interface CandidateProfileCompletionAction {
  id: string;
  section: DashboardSection;
  title: string;
  description: string;
  route: string;
  priority: number;
  pointsAvailable: number;
}

export interface CandidateProfileCompletionDashboard {
  completion: {
    percentage: number;
    earnedPoints: number;
    totalPoints: 100;
    version: string;
    updatedAt: string;
  };
  summary: {
    completedSections: number;
    inProgressSections: number;
    notStartedSections: number;
    totalSections: number;
  };
  sections: CandidateProfileSectionProgress[];
  nextActions: CandidateProfileCompletionAction[];
}
