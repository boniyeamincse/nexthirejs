import { EmploymentType } from './candidate-preferences.js';

export interface WorkExperienceRecordResult {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: EmploymentType;
  location: string | null;
  isRemote: boolean;
  startDate: string;
  endDate: string | null;
  currentlyWorking: boolean;
  responsibilities: string | null;
  achievements: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
