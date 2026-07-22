import { z } from 'zod';
import {
  AssessmentStatus,
  AssessmentType,
  AssessmentDifficulty,
  AssessmentAvailability,
} from '@nexthire/types';

export const assessmentCatalogQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 1;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 1 : parsed;
      }
      return val < 1 ? 1 : val;
    })
    .pipe(z.number().int()),
  pageSize: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 12;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 12 : parsed;
      }
      return val < 1 ? 12 : val;
    })
    .pipe(z.number().int().max(50)),
  search: z
    .string()
    .trim()
    .max(100, 'Search must not exceed 100 characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  category: z
    .string()
    .trim()
    .max(140)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  type: z.nativeEnum(AssessmentType).optional(),
  difficulty: z.nativeEnum(AssessmentDifficulty).optional(),
  availability: z.nativeEnum(AssessmentAvailability).optional(),
});

export type AssessmentCatalogQueryInput = z.infer<typeof assessmentCatalogQuerySchema>;

export interface ValidTransition {
  from: AssessmentStatus;
  to: AssessmentStatus;
}

export const VALID_TRANSITIONS: ValidTransition[] = [
  { from: 'DRAFT' as AssessmentStatus, to: 'PUBLISHED' as AssessmentStatus },
  { from: 'PUBLISHED' as AssessmentStatus, to: 'ARCHIVED' as AssessmentStatus },
  { from: 'ARCHIVED' as AssessmentStatus, to: 'PUBLISHED' as AssessmentStatus },
  { from: 'PUBLISHED' as AssessmentStatus, to: 'RETIRED' as AssessmentStatus },
  { from: 'ARCHIVED' as AssessmentStatus, to: 'RETIRED' as AssessmentStatus },
];

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export const transitionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
}).refine((data) => isValidTransition(data.from, data.to), {
  message: `Invalid status transition. Valid transitions: DRAFT→PUBLISHED, PUBLISHED→ARCHIVED, ARCHIVED→PUBLISHED, PUBLISHED→RETIRED, ARCHIVED→RETIRED`,
});
