export enum EducationLevel {
  SECONDARY = 'SECONDARY',
  HIGHER_SECONDARY = 'HIGHER_SECONDARY',
  DIPLOMA = 'DIPLOMA',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  PROFESSIONAL = 'PROFESSIONAL',
  OTHER = 'OTHER',
}

export interface EducationRecordResult {
  id: string;
  educationLevel: EducationLevel;
  institutionName: string;
  qualification: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  currentlyStudying: boolean;
  grade: string | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
