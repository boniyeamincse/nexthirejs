export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum CourseVisibility {
  CANDIDATE_CATALOG = 'CANDIDATE_CATALOG',
  PRIVATE = 'PRIVATE',
}

export enum CourseDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum LessonContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
}

export enum CourseEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export enum LessonProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface CourseCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface CourseCatalogItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: CourseCategorySummary;
  difficulty: CourseDifficulty;
  estimatedDurationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  publishedAt: string | null;
}

export interface CourseCatalogLessonOutline {
  id: string;
  title: string;
  contentType: LessonContentType;
  durationMinutes: number;
  sortOrder: number;
}

export interface CourseCatalogModuleOutline {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: CourseCatalogLessonOutline[];
}

export interface CourseCatalogDetail extends CourseCatalogItem {
  description: string | null;
  modules: CourseCatalogModuleOutline[];
  enrollment: {
    enrolled: boolean;
    enrollmentId: string | null;
    status: CourseEnrollmentStatus | null;
    progressPercentage: number | null;
  };
}

export interface CourseCatalogQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  difficulty?: CourseDifficulty;
}

export interface CourseCatalogFilterOptions {
  categories: CourseCategorySummary[];
  difficulties: CourseDifficulty[];
}

export interface PaginatedCourseCatalogResult {
  items: CourseCatalogItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: CourseCatalogFilterOptions;
}

export * from './authoring.js';
export * from './enrollment.js';
