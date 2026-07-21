export interface CandidateAchievementResult {
  id: string;
  title: string;
  issuer: string | null;
  achievedAt: string | null;
  description: string | null;
  referenceUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
