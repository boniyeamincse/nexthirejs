import { z } from 'zod';
import { AssessmentType, AssessmentDifficulty, AssessmentVisibility, AssessmentAvailability } from '@nexthire/types';

export const createAssessmentSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().toLowerCase().min(3).max(220).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  shortDescription: z.string().trim().min(10).max(500),
  description: z.string().trim().max(10000).nullable().optional(),
  instructions: z.string().trim().max(10000).nullable().optional(),
  type: z.nativeEnum(AssessmentType),
  difficulty: z.nativeEnum(AssessmentDifficulty),
  visibility: z.nativeEnum(AssessmentVisibility),
  availability: z.nativeEnum(AssessmentAvailability),
  estimatedDurationMinutes: z.number().int().min(1).max(480),
  passingScorePercentage: z.number().int().min(1).max(100).optional(),
  maximumAttempts: z.number().int().min(1).max(100).nullable().optional(),
}).strict();

export const updateAssessmentSchema = createAssessmentSchema.partial().strict();

export const createAssessmentSectionSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  instructions: z.string().trim().max(5000).nullable().optional(),
  isRequired: z.boolean().optional(),
}).strict();

export const updateAssessmentSectionSchema = createAssessmentSectionSchema.partial().strict();

export const reorderAssessmentSectionsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
}).strict();

export const assignAssessmentQuestionsSchema = z.object({
  sectionId: z.string().uuid(),
  questionIds: z.array(z.string().uuid()).min(1).max(100),
  points: z.number().min(0.25).max(100),
  isRequired: z.boolean().optional(),
}).strict();

export const updateAssessmentQuestionAssignmentSchema = z.object({
  sectionId: z.string().uuid().optional(),
  points: z.number().min(0.25).max(100).optional(),
  isRequired: z.boolean().optional(),
}).strict();

export const reorderAssessmentSectionQuestionsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
}).strict();

export const assessmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  type: z.nativeEnum(AssessmentType).optional(),
  difficulty: z.nativeEnum(AssessmentDifficulty).optional(),
  visibility: z.nativeEnum(AssessmentVisibility).optional(),
  availability: z.nativeEnum(AssessmentAvailability).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'RETIRED']).optional(),
});
