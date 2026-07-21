import { z } from 'zod';
import { LanguageProficiency } from '@nexthire/types';

export const candidateLanguageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Language name must be at least 2 characters')
    .max(100, 'Language name must not exceed 100 characters')
    .regex(/[a-zA-Z]/, 'Language name must contain at least one letter'),

  speaking: z.nativeEnum(LanguageProficiency, { required_error: 'Speaking proficiency is required' }),
  reading: z.nativeEnum(LanguageProficiency, { required_error: 'Reading proficiency is required' }),
  writing: z.nativeEnum(LanguageProficiency, { required_error: 'Writing proficiency is required' }),
});

export const updateCandidateLanguageSchema = candidateLanguageSchema.partial();

export const reorderCandidateLanguagesSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type CreateCandidateLanguageInput = z.infer<typeof candidateLanguageSchema>;
export type UpdateCandidateLanguageInput = z.infer<typeof updateCandidateLanguageSchema>;
export type ReorderCandidateLanguagesInput = z.infer<typeof reorderCandidateLanguagesSchema>;
