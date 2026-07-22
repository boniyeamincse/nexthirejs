import type { AssessmentQuestionType } from './management.js';
import type { AssessmentType, AssessmentDifficulty } from './index.js';

export enum AssessmentAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
  SUBMITTED = 'SUBMITTED',
  CANCELLED = 'CANCELLED',
}

export enum AssessmentAttemptFinalizationReason {
  CANDIDATE_SUBMITTED = 'CANDIDATE_SUBMITTED',
  DEADLINE_REACHED = 'DEADLINE_REACHED',
  ADMIN_FINALIZED = 'ADMIN_FINALIZED',
}

export enum AssessmentAttemptResultStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export const ASSESSMENT_SCORING_VERSION = 1;
export const ASSESSMENT_SCORING_VERSION_LABEL = 'assessment-scoring-v1';

export interface StartAssessmentAttemptResult {
  attemptId: string;
  created: boolean;
  status: AssessmentAttemptStatus;
  deadlineAt: string;
}

export interface AssessmentAttemptOptionResult {
  id: string;
  label: string;
  sortOrder: number;
}

export interface AssessmentAttemptDraftAnswer {
  selectedOptionIds: string[];
  shortTextAnswer: string | null;
  lastSavedAt: string;
}

export interface AssessmentAttemptQuestionResult {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  sortOrder: number;
  options: AssessmentAttemptOptionResult[];
  draftAnswer: AssessmentAttemptDraftAnswer | null;
}

export interface AssessmentAttemptSectionResult {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  sortOrder: number;
  questions: AssessmentAttemptQuestionResult[];
}

export interface AssessmentAttemptProgress {
  answered: number;
  unanswered: number;
  total: number;
  percentage: number;
}

export interface AssessmentAttemptResultSummary {
  scoreEarned: number;
  scorePossible: number;
  percentage: number;
  resultStatus: AssessmentAttemptResultStatus;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionCount: number;
}

export interface AssessmentAttemptSubmissionResult {
  attemptId: string;
  status: AssessmentAttemptStatus.SUBMITTED | AssessmentAttemptStatus.EXPIRED;
  finalizationReason:
    | AssessmentAttemptFinalizationReason.CANDIDATE_SUBMITTED
    | AssessmentAttemptFinalizationReason.DEADLINE_REACHED;
  submittedAt: string;
  scoringVersion: number;
  result: AssessmentAttemptResultSummary;
}

export interface AssessmentAttemptWorkspace {
  attempt: {
    id: string;
    assessmentId: string;
    title: string;
    instructions: string | null;
    status: AssessmentAttemptStatus;
    publicationVersion: number;
    startedAt: string;
    deadlineAt: string;
    serverNow: string;
    remainingSeconds: number;
    questionCount: number;
    totalPoints: number;
    submittedAt: string | null;
    finalizationReason: AssessmentAttemptFinalizationReason | null;
    scoringVersion: number | null;
  };
  sections: AssessmentAttemptSectionResult[];
  progress: AssessmentAttemptProgress;
  submissionSummary: AssessmentAttemptSubmissionResult | null;
}

export interface SaveAssessmentDraftAnswerInput {
  selectedOptionIds: string[];
  shortTextAnswer: string | null;
}

export interface SaveAssessmentDraftAnswerResult {
  progress: AssessmentAttemptProgress;
  savedAnswer: AssessmentAttemptDraftAnswer;
}

export interface SubmitAssessmentAttemptInput {
  confirmation: 'SUBMIT';
}

// --- Result & History Types ---

export interface AssessmentResultAnswer {
  kind: 'OPTIONS' | 'SHORT_TEXT';
  optionIds?: string[];
  text?: string | null;
  acceptedAnswers?: string[];
}

export interface AssessmentResultQuestionOption {
  id: string;
  label: string;
  sortOrder: number;
  selectedByCandidate: boolean;
  isCorrect: boolean;
}

export interface AssessmentResultQuestion {
  id: string;
  number: number;
  type: AssessmentQuestionType;
  prompt: string;
  pointsPossible: number;
  pointsAwarded: number;
  outcome: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
  candidateAnswer: AssessmentResultAnswer | null;
  correctAnswer: AssessmentResultAnswer;
  explanation: string | null;
  options: AssessmentResultQuestionOption[];
}

export interface AssessmentResultSection {
  id: string;
  title: string;
  sortOrder: number;
  scoreEarned: number;
  scorePossible: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questions: AssessmentResultQuestion[];
}

export interface AssessmentAttemptHistoryItem {
  attemptId: string;
  assessment: {
    id: string;
    slug: string;
    title: string;
    categoryName: string | null;
    type: AssessmentType;
    difficulty: AssessmentDifficulty;
    publicationVersion: number;
  };
  result: {
    scoreEarned: number;
    scorePossible: number;
    percentage: number;
    status: AssessmentAttemptResultStatus;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    questionCount: number;
  };
  finalizationReason: AssessmentAttemptFinalizationReason;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
}

export interface AssessmentAttemptResultDetail {
  attempt: {
    id: string;
    assessmentId: string;
    title: string;
    slug: string;
    publicationVersion: number;
    finalizationReason: AssessmentAttemptFinalizationReason;
    startedAt: string;
    submittedAt: string;
    durationSeconds: number;
  };
  result: {
    scoreEarned: number;
    scorePossible: number;
    percentage: number;
    resultStatus: AssessmentAttemptResultStatus;
    passingScorePercentage: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    questionCount: number;
    scoringVersion: number;
  };
  sections: AssessmentResultSection[];
}

export interface AssessmentResultHistoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  resultStatus?: AssessmentAttemptResultStatus;
  finalizationReason?: AssessmentAttemptFinalizationReason;
  assessmentType?: AssessmentType;
  difficulty?: AssessmentDifficulty;
  dateFrom?: string;
  dateTo?: string;
}

export interface AssessmentResultHistoryResponse {
  items: AssessmentAttemptHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    resultStatuses: AssessmentAttemptResultStatus[];
    finalizationReasons: AssessmentAttemptFinalizationReason[];
    assessmentTypes: AssessmentType[];
    difficulties: AssessmentDifficulty[];
  };
}
