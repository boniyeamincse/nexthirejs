import { z } from 'zod';

export const candidateTrainingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Training title must be at least 2 characters')
    .max(200, 'Training title must not exceed 200 characters'),

  provider: z
    .string()
    .trim()
    .min(2, 'Provider must be at least 2 characters')
    .max(200, 'Provider must not exceed 200 characters'),

  completionDate: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Completion date must be a valid date' },
    )
    .refine(
      (val) => {
        const date = new Date(val);
        return date <= new Date();
      },
      { message: 'Completion date cannot be in the future' },
    ),

  durationHours: z
    .number()
    .min(0.5, 'Duration must be at least 0.5 hours')
    .max(10000, 'Duration must not exceed 10,000 hours')
    .nullable()
    .optional()
    .transform((val) => (val === undefined || val === null ? null : val)),

  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

export type CreateCandidateTrainingInput = z.infer<typeof candidateTrainingSchema>;

export const updateCandidateTrainingSchema = candidateTrainingSchema.partial();
export type UpdateCandidateTrainingInput = z.infer<typeof updateCandidateTrainingSchema>;

export const reorderCandidateTrainingSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderCandidateTrainingInput = z.infer<typeof reorderCandidateTrainingSchema>;
