export const PUBLIC_PROFILE_POLICY_VERSION = 'public-profile-v1';

export type PreviewAccessMode = 'OWNER' | 'LINK_ONLY' | 'PLATFORM_DISCOVERABLE';

export interface PublicCandidateProfile {
  profileId: string;
  displayName: string;
  professionalHeadline: string | null;
  professionalSummary: string | null;
  location: {
    city: string | null;
    countryName: string | null;
  } | null;
  preferredJobRoles: string[];
  preferredWorkModes: string[];
  preferredEmploymentTypes: string[];
  education: PublicEducationRecord[];
  experience: PublicWorkExperienceRecord[];
  skills: PublicSkillRecord[];
  languages: PublicLanguageRecord[];
  certifications: PublicCertificationRecord[];
  training: PublicTrainingRecord[];
  achievements: PublicAchievementRecord[];
  professionalLinks: PublicProfessionalLinkRecord[];
  visibleSections: string[];
  updatedAt: string;
}

export interface PublicEducationRecord {
  id: string;
  educationLevel: string;
  institutionName: string;
  qualification: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  currentlyStudying: boolean;
  grade: string | null;
  description: string | null;
}

export interface PublicWorkExperienceRecord {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: string;
  location: string | null;
  isRemote: boolean;
  startDate: string;
  endDate: string | null;
  currentlyWorking: boolean;
  responsibilities: string | null;
  achievements: string | null;
}

export interface PublicSkillRecord {
  id: string;
  name: string;
  level: string;
  yearsOfExperience: number | null;
}

export interface PublicLanguageRecord {
  id: string;
  name: string;
  speaking: string;
  reading: string;
  writing: string;
}

export interface PublicCertificationRecord {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  doesNotExpire: boolean;
  expiryDate: string | null;
  credentialUrl: string | null;
}

export interface PublicTrainingRecord {
  id: string;
  title: string;
  provider: string;
  completionDate: string;
  durationHours: number | null;
  description: string | null;
}

export interface PublicAchievementRecord {
  id: string;
  title: string;
  issuer: string | null;
  achievedAt: string | null;
  description: string | null;
}

export interface PublicProfessionalLinkRecord {
  id: string;
  type: string;
  label: string | null;
  url: string;
}

export interface OwnerProfilePreview {
  profile: PublicCandidateProfile;
  privacySummary: {
    overallVisibility: string;
    sectionVisibility: Record<string, string>;
    shareLinkEnabled: boolean;
  };
  completion: {
    percentage: number;
    version: string;
  };
}

export interface ShareLinkResult {
  shareUrl: string;
  rotatedAt: string;
}

export interface ShareLinkUpdateInput {
  enabled: boolean;
}
