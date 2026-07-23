export interface CreateExpertSessionEvaluationInput {
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  problemSolving: number;
  strengths?: string | null;
  improvements?: string | null;
  nextSteps?: string | null;
}

export interface ExpertSessionEvaluationResult {
  id: string;
  bookingId: string;
  expertUserId: string;
  candidateId: string;
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  problemSolving: number;
  overallScore: number;
  strengths: string | null;
  improvements: string | null;
  nextSteps: string | null;
  submittedAt: string;
  createdAt: string;
}

export interface CreateExpertReviewInput {
  rating: number;
  comment?: string | null;
}

export interface ExpertReviewResult {
  id: string;
  bookingId: string;
  expertUserId: string;
  candidateId: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  hiddenReason: string | null;
  submittedAt: string;
  createdAt: string;
  candidateDisplayName?: string;
}

export interface ExpertRatingAggregate {
  average: number | null;
  count: number;
}

export interface PaginatedExpertReviewResult {
  data: ExpertReviewResult[];
  aggregate: ExpertRatingAggregate;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
