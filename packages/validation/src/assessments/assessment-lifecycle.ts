import { z } from 'zod';
import { AssessmentStatus, AssessmentVisibility, AssessmentAvailability } from '@nexthire/types';

export const assessmentLifecycleSchema = z.object({
  status: z.nativeEnum(AssessmentStatus),
  visibility: z.nativeEnum(AssessmentVisibility),
  availability: z.nativeEnum(AssessmentAvailability),
  publishedAt: z.string().datetime().nullable().optional(),
  questionCount: z.number().int().min(0).optional(),
});

export type AssessmentLifecycleInput = z.infer<typeof assessmentLifecycleSchema>;
