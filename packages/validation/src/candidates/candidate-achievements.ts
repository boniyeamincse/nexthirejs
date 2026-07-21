import { z } from 'zod';

const urlSchema = z
  .string()
  .max(500, 'URL must not exceed 500 characters')
  .refine(
    (val) => val.startsWith('http://') || val.startsWith('https://'),
    { message: 'URL must start with http:// or https://' }
  );

export const candidateAchievementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Achievement title must be at least 2 characters')
    .max(200, 'Achievement title must not exceed 200 characters'),

  issuer: z
    .string()
    .trim()
    .max(200, 'Issuer must not exceed 200 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  achievedAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Achieved date must be a valid date' }
    )
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) <= new Date();
      },
      { message: 'Achieved date cannot be in the future' }
    )
    .transform((val) => (val === '' ? null : val)),

  description: z
    .string()
    .trim()
    .max(1500, 'Description must not exceed 1500 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  referenceUrl: urlSchema.nullable().optional().transform((val) => (val === '' ? null : val)),
});

export type CreateCandidateAchievementInput = z.infer<typeof candidateAchievementSchema>;

export const updateCandidateAchievementSchema = candidateAchievementSchema.partial();
export type UpdateCandidateAchievementInput = z.infer<typeof updateCandidateAchievementSchema>;

export const reorderCandidateAchievementsSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderCandidateAchievementsInput = z.infer<typeof reorderCandidateAchievementsSchema>;
