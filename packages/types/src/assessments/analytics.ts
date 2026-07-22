import type { AssessmentAttemptResultStatus, AssessmentType, AssessmentDifficulty } from './index.js';

export interface AssessmentPerformanceSummary {
  totalFinalizedAttempts: number;
  uniqueAssessmentsCompleted: number;
  averagePercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
}

export interface AssessmentPerformanceTrendPoint {
  attemptId: string;
  assessmentTitle: string;
  submittedAt: string;
  percentage: number;
  resultStatus: AssessmentAttemptResultStatus;
}

export interface AssessmentPerformanceBreakdownItem {
  key: string;
  label: string;
  attemptCount: number;
  averagePercentage: number;
  bestPercentage: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
}

export interface AssessmentPerformanceReport {
  summary: AssessmentPerformanceSummary;
  trend: AssessmentPerformanceTrendPoint[];
  byCategory: AssessmentPerformanceBreakdownItem[];
  byType: AssessmentPerformanceBreakdownItem[];
  byDifficulty: AssessmentPerformanceBreakdownItem[];
  recentActivity: AssessmentAttemptHistoryActivityItem[];
}

export interface AssessmentAttemptHistoryActivityItem {
  attemptId: string;
  assessmentTitle: string;
  assessmentSlug: string;
  submittedAt: string;
  percentage: number;
  resultStatus: AssessmentAttemptResultStatus;
}

export interface LeaderboardParticipationSettings {
  enabled: boolean;
  displayName: string | null;
  enabledAt: string | null;
}

export interface UpdateLeaderboardParticipationInput {
  enabled: boolean;
  displayName?: string | null;
}

export interface AssessmentLeaderboardEntry {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  percentage: number;
  scoreEarned: number;
  scorePossible: number;
  unansweredCount: number;
  durationSeconds: number;
  submittedAt: string;
  isCurrentCandidate: boolean;
}

export interface CategoryLeaderboardEntry {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  averagePercentage: number;
  bestPercentage: number;
  completedAssessmentCount: number;
  passedAssessmentCount: number;
  passRate: number;
  isCurrentCandidate: boolean;
}

export interface LeaderboardPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AssessmentLeaderboardQuery {
  page?: number;
  pageSize?: number;
}

export interface CategoryLeaderboardQuery {
  page?: number;
  pageSize?: number;
}

export interface MyLeaderboardRank {
  rank: number;
  eligible: boolean;
}

export interface AssessmentLeaderboardResponse {
  assessmentTitle: string;
  assessmentSlug: string;
  entries: AssessmentLeaderboardEntry[];
  pagination: LeaderboardPagination;
  myRank: MyLeaderboardRank | null;
}

export interface CategoryLeaderboardResponse {
  categoryName: string;
  entries: CategoryLeaderboardEntry[];
  pagination: LeaderboardPagination;
  myRank: MyLeaderboardRank | null;
}

export interface AssessmentPerformanceQuery {
  dateFrom?: string;
  dateTo?: string;
  assessmentType?: AssessmentType;
  difficulty?: AssessmentDifficulty;
  category?: string;
}
