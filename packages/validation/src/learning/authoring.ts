import { z } from 'zod';
import { CourseDifficulty, CourseVisibility, LessonContentType } from '@nexthire/types';

export const createCourseCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(140)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().trim().max(1000).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateCourseCategorySchema = createCourseCategorySchema.partial().strict();

export const createCourseSchema = z
  .object({
    categoryId: z.string().uuid(),
    title: z.string().trim().min(3).max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(220)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    summary: z.string().trim().min(10).max(500),
    description: z.string().trim().max(10000).nullable().optional(),
    difficulty: z.nativeEnum(CourseDifficulty),
    visibility: z.nativeEnum(CourseVisibility),
    estimatedDurationMinutes: z.number().int().min(0).max(10000).optional(),
  })
  .strict();

export const updateCourseSchema = createCourseSchema.partial().strict();

export const courseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  visibility: z.nativeEnum(CourseVisibility).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const createCourseModuleSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();

export const updateCourseModuleSchema = createCourseModuleSchema.partial().strict();

export const reorderCourseModulesSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1),
  })
  .strict();

export const createLessonSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    contentType: z.nativeEnum(LessonContentType),
    bodyContent: z.string().trim().max(20000).nullable().optional(),
    videoUrl: z.string().trim().url().max(500).nullable().optional(),
    durationMinutes: z.number().int().min(0).max(600).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.contentType === LessonContentType.VIDEO && !data.videoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VIDEO lessons require a videoUrl',
        path: ['videoUrl'],
      });
    }
    if (data.contentType === LessonContentType.ARTICLE && !data.bodyContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ARTICLE lessons require bodyContent',
        path: ['bodyContent'],
      });
    }
  });

export const updateLessonSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    bodyContent: z.string().trim().max(20000).nullable().optional(),
    videoUrl: z.string().trim().url().max(500).nullable().optional(),
    durationMinutes: z.number().int().min(0).max(600).optional(),
  })
  .strict();

export const reorderLessonsSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1),
  })
  .strict();
