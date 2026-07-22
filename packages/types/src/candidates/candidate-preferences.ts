import { CandidateProfileCompletion } from './index.js';

export enum WorkMode {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  FREELANCE = 'FREELANCE',
}

export interface CandidatePreferenceResult {
  id: string;
  country: {
    code: string;
    name: string;
    defaultCurrency: string;
    defaultTimezone: string;
  };
  currentCity: string;
  preferredJobRoles: string[];
  preferredWorkModes: WorkMode[];
  preferredEmploymentTypes: EmploymentType[];
  completion: CandidateProfileCompletion;
  createdAt: string;
  updatedAt: string;
}
