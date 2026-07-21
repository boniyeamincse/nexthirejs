export type CandidateDiscoverability = 'PRIVATE' | 'LINK_ONLY' | 'PLATFORM_DISCOVERABLE';

export type CandidateProfileSection =
  | 'BASIC_PROFILE'
  | 'LOCATION_AND_PREFERENCES'
  | 'EDUCATION'
  | 'WORK_EXPERIENCE'
  | 'SKILLS_AND_LANGUAGES'
  | 'CERTIFICATIONS_AND_TRAINING'
  | 'ACHIEVEMENTS_AND_LINKS';

export type CandidateSectionVisibility = 'HIDDEN' | 'PLATFORM_ONLY' | 'PUBLIC';

export const CANDIDATE_PRIVACY_POLICY_VERSION = 'candidate-privacy-v1' as const;

export const SUPPORTED_SECTIONS: CandidateProfileSection[] = [
  'BASIC_PROFILE',
  'LOCATION_AND_PREFERENCES',
  'EDUCATION',
  'WORK_EXPERIENCE',
  'SKILLS_AND_LANGUAGES',
  'CERTIFICATIONS_AND_TRAINING',
  'ACHIEVEMENTS_AND_LINKS',
];

export const DEFAULT_CANDIDATE_PRIVACY_SETTINGS: {
  overallDiscoverability: CandidateDiscoverability;
  sections: Record<CandidateProfileSection, CandidateSectionVisibility>;
  policyVersion: typeof CANDIDATE_PRIVACY_POLICY_VERSION;
} = {
  overallDiscoverability: 'PRIVATE',
  sections: {
    BASIC_PROFILE: 'PLATFORM_ONLY',
    LOCATION_AND_PREFERENCES: 'HIDDEN',
    EDUCATION: 'PLATFORM_ONLY',
    WORK_EXPERIENCE: 'PLATFORM_ONLY',
    SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
    CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
    ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
  },
  policyVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
};

export interface CandidateProfilePrivacyInput {
  overallDiscoverability: CandidateDiscoverability;
  sections: Record<CandidateProfileSection, CandidateSectionVisibility>;
}

export interface CandidateProfilePrivacyResult {
  overallDiscoverability: CandidateDiscoverability;
  sections: Record<CandidateProfileSection, CandidateSectionVisibility>;
  policyVersion: string;
  source: 'DEFAULT' | 'PERSISTED';
  createdAt: string | null;
  updatedAt: string | null;
}
