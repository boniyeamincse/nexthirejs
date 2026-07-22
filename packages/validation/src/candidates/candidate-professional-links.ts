import { z } from 'zod';

const urlSchema = z
  .string()
  .max(500, 'URL must not exceed 500 characters')
  .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  });

export const candidateProfessionalLinkSchema = z.object({
  type: z.enum(
    [
      'LINKEDIN',
      'GITHUB',
      'PORTFOLIO',
      'PERSONAL_WEBSITE',
      'BEHANCE',
      'DRIBBBLE',
      'STACK_OVERFLOW',
      'MEDIUM',
      'YOUTUBE',
      'OTHER',
    ] as const,
    { required_error: 'Link type is required' },
  ),

  label: z
    .string()
    .trim()
    .max(100, 'Label must not exceed 100 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  url: urlSchema,
});

export type CreateCandidateProfessionalLinkInput = z.infer<typeof candidateProfessionalLinkSchema>;

export const updateCandidateProfessionalLinkSchema = candidateProfessionalLinkSchema.partial();
export type UpdateCandidateProfessionalLinkInput = z.infer<
  typeof updateCandidateProfessionalLinkSchema
>;

export const reorderCandidateProfessionalLinksSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderCandidateProfessionalLinksInput = z.infer<
  typeof reorderCandidateProfessionalLinksSchema
>;
