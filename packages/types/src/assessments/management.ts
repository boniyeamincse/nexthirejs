import { AssessmentDifficulty } from './index.js';

export enum AssessmentQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_TEXT = 'SHORT_TEXT',
}

export enum AssessmentQuestionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface AssessmentCategoryManagementItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateAssessmentCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderAssessmentCategoriesInput {
  categoryIds: string[];
}

export interface AssessmentQuestionOptionInput {
  id?: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface CreateAssessmentQuestionInput {
  categoryId: string;
  type: AssessmentQuestionType;
  difficulty: AssessmentDifficulty;
  prompt: string;
  explanation?: string | null;
  options?: AssessmentQuestionOptionInput[];
  acceptedAnswers?: string[];
  tags?: string[];
  sourceReference?: string | null;
  estimatedSeconds?: number | null;
  status?: AssessmentQuestionStatus;
}

export interface UpdateAssessmentQuestionInput {
  categoryId?: string;
  type?: AssessmentQuestionType;
  difficulty?: AssessmentDifficulty;
  prompt?: string;
  explanation?: string | null;
  options?: AssessmentQuestionOptionInput[];
  acceptedAnswers?: string[];
  tags?: string[];
  sourceReference?: string | null;
  estimatedSeconds?: number | null;
  status?: AssessmentQuestionStatus;
}

export interface AssessmentQuestionOptionManagementDetail {
  id: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface AssessmentQuestionManagementItem {
  id: string;
  categoryId: string;
  type: AssessmentQuestionType;
  status: AssessmentQuestionStatus;
  difficulty: AssessmentDifficulty;
  prompt: string;
  tags: string[];
  estimatedSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestionManagementDetail extends AssessmentQuestionManagementItem {
  explanation: string | null;
  acceptedAnswers: string[];
  sourceReference: string | null;
  options: AssessmentQuestionOptionManagementDetail[];
}

export interface AssessmentQuestionListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  type?: AssessmentQuestionType;
  difficulty?: AssessmentDifficulty;
  status?: AssessmentQuestionStatus;
  tag?: string;
}

export interface PaginatedAssessmentQuestionResult {
  items: AssessmentQuestionManagementItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
