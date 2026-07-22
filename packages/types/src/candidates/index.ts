export * from './candidate-preferences.js';
export * from './candidate-education.js';
export * from './candidate-work-experience.js';
export * from './candidate-skills.js';
export * from './candidate-languages.js';
export * from './candidate-certifications.js';
export * from './candidate-training.js';
export * from './candidate-achievements.js';
export * from './candidate-professional-links.js';
export * from './candidate-profile-privacy.js';
export * from './candidate-public-profile.js';
export * from './candidate-profile-completion-dashboard.js';
export * from './data-export.js';

export interface CandidateProfileCompletion {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  version:
    | 'candidate-profile-basic-v1'
    | 'candidate-profile-v2'
    | 'candidate-profile-v3'
    | 'candidate-profile-v4'
    | 'candidate-profile-v5'
    | 'candidate-profile-v6'
    | 'candidate-profile-v7';
}

export interface CandidateProfileBasics {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  professionalHeadline: string | null;
  professionalSummary: string | null;
  dateOfBirth: string | null;
  completion: CandidateProfileCompletion;
  createdAt: string;
  updatedAt: string;
}
