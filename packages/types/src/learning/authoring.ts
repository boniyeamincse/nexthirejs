import type {
  CourseDifficulty,
  CourseVisibility,
  CourseStatus,
  LessonContentType,
} from './index.js';

export interface CourseCategoryManagementItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCourseCategoryInput = Partial<CreateCourseCategoryInput>;

export interface CreateCourseInput {
  categoryId: string;
  title: string;
  slug: string;
  summary: string;
  description?: string | null;
  difficulty: CourseDifficulty;
  visibility: CourseVisibility;
  estimatedDurationMinutes?: number;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

export interface CreateCourseModuleInput {
  title: string;
  description?: string | null;
}

export type UpdateCourseModuleInput = Partial<CreateCourseModuleInput>;

export interface ReorderCourseModulesInput {
  orderedIds: string[];
}

export interface CreateLessonInput {
  title: string;
  contentType: LessonContentType;
  bodyContent?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number;
}

export type UpdateLessonInput = Partial<CreateLessonInput>;

export interface ReorderLessonsInput {
  orderedIds: string[];
}

export interface CourseManagementListItem {
  id: string;
  title: string;
  category: { id: string; name: string };
  difficulty: CourseDifficulty;
  status: CourseStatus;
  visibility: CourseVisibility;
  moduleCount: number;
  lessonCount: number;
  updatedAt: string;
}

export interface LessonDetail {
  id: string;
  courseModuleId: string;
  title: string;
  contentType: LessonContentType;
  bodyContent: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  sortOrder: number;
}

export interface CourseModuleDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: LessonDetail[];
}

export interface CourseManagementDetail {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  difficulty: CourseDifficulty;
  status: CourseStatus;
  visibility: CourseVisibility;
  estimatedDurationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  publishedAt: string | null;
  archivedAt: string | null;
  publicationVersion: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  modules: CourseModuleDetail[];
}

export interface CoursePublicationIssue {
  code: string;
  message: string;
  moduleId?: string;
  lessonId?: string;
}

export interface CoursePublicationReadiness {
  ready: boolean;
  blockers: CoursePublicationIssue[];
  summary: {
    moduleCount: number;
    lessonCount: number;
    estimatedDurationMinutes: number;
  };
}
