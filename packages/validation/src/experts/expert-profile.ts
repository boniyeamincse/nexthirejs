/**
 * Expert Profile Validation
 *
 * Zod schema for creating/updating an expert profile. Bounds are derived from
 * shared EXPERT_LIMITS so API, web and tests stay in sync.
 */

import { z } from 'zod';
import { EXPERT_LIMITS } from '@nexthire/constants';
import { languageCodeSchema } from '../common.js';
import { safeUrlSchema } from './expert-url.js';

const optionalTrimmedString = (max: number) => z.string().trim().max(max).nullable().optional();

export const expertProfileSchema = z
  .object({
    professionalTitle: z
      .string()
      .trim()
      .min(
        EXPERT_LIMITS.MIN_PROFESSIONAL_TITLE,
        `Professional title must be at least ${EXPERT_LIMITS.MIN_PROFESSIONAL_TITLE} characters`,
      )
      .max(
        EXPERT_LIMITS.MAX_PROFESSIONAL_TITLE,
        `Professional title must not exceed ${EXPERT_LIMITS.MAX_PROFESSIONAL_TITLE} characters`,
      ),

    professionalSummary: z
      .string()
      .trim()
      .min(
        EXPERT_LIMITS.MIN_PROFESSIONAL_SUMMARY,
        `Professional summary must be at least ${EXPERT_LIMITS.MIN_PROFESSIONAL_SUMMARY} characters`,
      )
      .max(
        EXPERT_LIMITS.MAX_PROFESSIONAL_SUMMARY,
        `Professional summary must not exceed ${EXPERT_LIMITS.MAX_PROFESSIONAL_SUMMARY} characters`,
      ),

    yearsOfExperience: z
      .number({ invalid_type_error: 'Years of experience must be a number' })
      .int('Years of experience must be a whole number')
      .min(EXPERT_LIMITS.MIN_YEARS_EXPERIENCE, 'Years of experience is too low')
      .max(EXPERT_LIMITS.MAX_YEARS_EXPERIENCE, 'Years of experience is too high'),

    currentCompany: optionalTrimmedString(EXPERT_LIMITS.MAX_CURRENT_COMPANY),
    currentPosition: optionalTrimmedString(EXPERT_LIMITS.MAX_CURRENT_POSITION),
    highestEducation: optionalTrimmedString(EXPERT_LIMITS.MAX_HIGHEST_EDUCATION),

    linkedinUrl: safeUrlSchema(),
    portfolioUrl: safeUrlSchema(),
    personalWebsiteUrl: safeUrlSchema(),

    interviewLanguages: z
      .array(languageCodeSchema)
      .min(EXPERT_LIMITS.MIN_INTERVIEW_LANGUAGES, 'At least one interview language is required')
      .max(EXPERT_LIMITS.MAX_INTERVIEW_LANGUAGES, 'Too many interview languages')
      .refine((langs) => new Set(langs).size === langs.length, {
        message: 'Interview languages must be unique',
      }),

    countryId: z.string().uuid('countryId must be a valid UUID'),

    city: optionalTrimmedString(EXPERT_LIMITS.MAX_CITY),
  })
  .strict();

export type ExpertProfileSchemaInput = z.infer<typeof expertProfileSchema>;

export const expertProfileVisibilitySchema = z.object({
  isPublic: z.boolean(),
});
