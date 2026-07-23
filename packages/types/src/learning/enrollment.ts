import type { CourseEnrollmentStatus, LessonProgressStatus } from './index.js';

export interface EnrollInCourseResult {
  enrollmentId: string;
  courseId: string;
  status: CourseEnrollmentStatus;
  enrolledAt: string;
}

export interface CourseEnrollmentSummary {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: CourseEnrollmentStatus;
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

export interface MyLearningDashboard {
  activeCount: number;
  completedCount: number;
  enrollments: CourseEnrollmentSummary[];
}

export interface EnrollmentLessonProgress {
  lessonId: string;
  title: string;
  contentType: string;
  durationMinutes: number;
  sortOrder: number;
  status: LessonProgressStatus;
  lastPositionSeconds: number | null;
  completedAt: string | null;
}

export interface EnrollmentModuleProgress {
  moduleId: string;
  title: string;
  sortOrder: number;
  lessons: EnrollmentLessonProgress[];
}

export interface MyEnrollmentDetail {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: CourseEnrollmentStatus;
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
  modules: EnrollmentModuleProgress[];
}

export interface UpdateLessonProgressInput {
  status: LessonProgressStatus;
  lastPositionSeconds?: number;
}

export interface UpdateLessonProgressResult {
  lessonId: string;
  status: LessonProgressStatus;
  courseProgressPercentage: number;
  courseCompleted: boolean;
}
