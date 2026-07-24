import { z } from 'zod';
import { TALENT_PIPELINE_STAGES, TALENT_SHORTLIST_LIMITS } from '@nexthire/constants';

const tagsSchema = z
  .array(z.string().trim().min(1).max(TALENT_SHORTLIST_LIMITS.MAX_TAG_LENGTH))
  .max(TALENT_SHORTLIST_LIMITS.MAX_TAGS)
  .optional();

export const createTalentShortlistSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(TALENT_SHORTLIST_LIMITS.MIN_NAME)
      .max(TALENT_SHORTLIST_LIMITS.MAX_NAME),
    description: z.string().trim().max(TALENT_SHORTLIST_LIMITS.MAX_DESCRIPTION).optional(),
  })
  .strict();

export const updateTalentShortlistSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(TALENT_SHORTLIST_LIMITS.MIN_NAME)
      .max(TALENT_SHORTLIST_LIMITS.MAX_NAME)
      .optional(),
    description: z.string().trim().max(TALENT_SHORTLIST_LIMITS.MAX_DESCRIPTION).optional(),
  })
  .strict();

export const addTalentShortlistMemberSchema = z
  .object({
    candidateUserId: z.string().uuid(),
    notes: z.string().trim().max(TALENT_SHORTLIST_LIMITS.MAX_NOTES).optional(),
    tags: tagsSchema,
  })
  .strict();

export const updateTalentShortlistMemberSchema = z
  .object({
    stage: z.enum(TALENT_PIPELINE_STAGES).optional(),
    targetIndex: z.number().int().min(0).optional(),
    notes: z.string().trim().max(TALENT_SHORTLIST_LIMITS.MAX_NOTES).optional(),
    tags: tagsSchema,
  })
  .strict();
