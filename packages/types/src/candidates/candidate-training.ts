export interface CandidateTrainingResult {
  id: string;
  title: string;
  provider: string;
  completionDate: string;
  durationHours: number | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
