export * from './candidate-preferences.js';

export interface CandidateProfileCompletion {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  version: 'candidate-profile-basic-v1' | 'candidate-profile-v2';
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
