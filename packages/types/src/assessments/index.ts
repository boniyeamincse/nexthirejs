export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  RETIRED = 'RETIRED',
}

export enum AssessmentVisibility {
  CANDIDATE_CATALOG = 'CANDIDATE_CATALOG',
  INVITE_ONLY = 'INVITE_ONLY',
  INTERNAL = 'INTERNAL',
}

export enum AssessmentDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum AssessmentType {
  PRACTICE = 'PRACTICE',
  CERTIFICATION = 'CERTIFICATION',
  SCREENING = 'SCREENING',
  SKILL_CHECK = 'SKILL_CHECK',
}

export enum AssessmentAvailability {
  AVAILABLE = 'AVAILABLE',
  COMING_SOON = 'COMING_SOON',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface AssessmentCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface AssessmentCatalogItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: AssessmentCategorySummary;
  type: AssessmentType;
  difficulty: AssessmentDifficulty;
  availability: AssessmentAvailability;
  estimatedDurationMinutes: number;
  questionCount: number;
  publishedAt: string | null;
}

export interface AssessmentCatalogDetail extends AssessmentCatalogItem {
  description: string | null;
  instructions: string | null;
}

export interface AssessmentCatalogQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: AssessmentType;
  difficulty?: AssessmentDifficulty;
  availability?: AssessmentAvailability;
}

export interface AssessmentCatalogFilterOptions {
  categories: AssessmentCategorySummary[];
  types: AssessmentType[];
  difficulties: AssessmentDifficulty[];
  availability: AssessmentAvailability[];
}

export interface PaginatedAssessmentCatalogResult {
  items: AssessmentCatalogItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: AssessmentCatalogFilterOptions;
}

export * from './management.js';
