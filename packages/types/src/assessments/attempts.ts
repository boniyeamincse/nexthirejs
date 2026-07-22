import type { AssessmentQuestionType } from './management.js';

export enum AssessmentAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
  SUBMITTED = 'SUBMITTED',
  CANCELLED = 'CANCELLED',
}

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
  };
  sections: AssessmentAttemptSectionResult[];
  progress: AssessmentAttemptProgress;
}

export interface SaveAssessmentDraftAnswerInput {
  selectedOptionIds: string[];
  shortTextAnswer: string | null;
}

export interface SaveAssessmentDraftAnswerResult {
  progress: AssessmentAttemptProgress;
  savedAnswer: AssessmentAttemptDraftAnswer;
}
