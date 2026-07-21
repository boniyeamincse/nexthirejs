export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  DEVELOPING = 'DEVELOPING',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export interface CandidateSkillResult {
  id: string;
  name: string;
  level: SkillLevel;
  yearsOfExperience: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
