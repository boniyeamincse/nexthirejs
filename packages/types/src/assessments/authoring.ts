import { AssessmentType, AssessmentDifficulty, AssessmentVisibility, AssessmentAvailability, AssessmentStatus } from './index.js';

export interface CreateAssessmentInput {
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description?: string | null;
  instructions?: string | null;
  type: AssessmentType;
  difficulty: AssessmentDifficulty;
  visibility: AssessmentVisibility;
  availability: AssessmentAvailability;
  estimatedDurationMinutes: number;
  passingScorePercentage?: number;
  maximumAttempts?: number | null;
}

export type UpdateAssessmentInput = Partial<CreateAssessmentInput>;

export interface CreateAssessmentSectionInput {
  title: string;
  description?: string | null;
  instructions?: string | null;
  isRequired?: boolean;
}

export type UpdateAssessmentSectionInput = Partial<CreateAssessmentSectionInput>;

export interface UpdateAssessmentQuestionAssignmentInput {
  sectionId?: string;
  points?: number;
  isRequired?: boolean;
}

export interface AssessmentManagementListItem {
  id: string;
  title: string;
  category: { id: string; name: string };
  type: AssessmentType;
  difficulty: AssessmentDifficulty;
  status: AssessmentStatus;
  visibility: AssessmentVisibility;
  availability: AssessmentAvailability;
  questionCount: number;
  totalPoints: number;
  updatedAt: string;
}

export interface AssessmentSectionDetail {
  id: string;
  assessmentId: string;
  title: string;
  description: string | null;
  instructions: string | null;
  sortOrder: number;
  isRequired: boolean;
  questions: AssessmentQuestionAssignmentDetail[];
}

export interface AssessmentQuestionAssignmentDetail {
  id: string;
  assessmentId: string;
  sectionId: string;
  questionId: string;
  sortOrder: number;
  points: number;
  isRequired: boolean;
  question: {
    id: string;
    prompt: string;
    type: string;
    difficulty: string;
    status: string;
  };
}

export interface AssessmentManagementDetail {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  instructions: string | null;
  type: AssessmentType;
  difficulty: AssessmentDifficulty;
  status: AssessmentStatus;
  visibility: AssessmentVisibility;
  availability: AssessmentAvailability;
  estimatedDurationMinutes: number;
  passingScorePercentage: number;
  maximumAttempts: number | null;
  totalPoints: number;
  questionCount: number;
  publishedAt: string | null;
  archivedAt: string | null;
  publicationVersion: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  sections: AssessmentSectionDetail[];
}

export interface AssessmentPublicationIssue {
  code: string;
  message: string;
  sectionId?: string;
  questionId?: string;
}

export interface AssessmentPublicationReadiness {
  ready: boolean;
  blockers: AssessmentPublicationIssue[];
  warnings: AssessmentPublicationIssue[];
  summary: {
    sectionCount: number;
    questionCount: number;
    totalPoints: number;
    estimatedDurationMinutes: number;
  };
}

export interface ReorderAssessmentSectionsInput {
  orderedIds: string[];
}

export interface AssignAssessmentQuestionsInput {
  sectionId: string;
  questionIds: string[];
  points: number;
  isRequired?: boolean;
}

export interface ReorderAssessmentSectionQuestionsInput {
  orderedIds: string[];
}
