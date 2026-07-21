import { z } from 'zod';
import { SkillLevel } from '@nexthire/types';

export const candidateSkillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Skill name must be at least 2 characters')
    .max(100, 'Skill name must not exceed 100 characters')
    .regex(/[a-zA-Z0-9]/, 'Skill name must contain at least one letter or number'),

  level: z.nativeEnum(SkillLevel, { required_error: 'Skill level is required' }),

  yearsOfExperience: z
    .number()
    .min(0, 'Years of experience cannot be negative')
    .max(60, 'Years of experience must not exceed 60')
    .nullable()
    .optional()
    .transform((val) => (val === undefined || val === null ? null : val)),
});

export const updateCandidateSkillSchema = candidateSkillSchema.partial();

export const reorderCandidateSkillsSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type CreateCandidateSkillInput = z.infer<typeof candidateSkillSchema>;
export type UpdateCandidateSkillInput = z.infer<typeof updateCandidateSkillSchema>;
export type ReorderCandidateSkillsInput = z.infer<typeof reorderCandidateSkillsSchema>;
