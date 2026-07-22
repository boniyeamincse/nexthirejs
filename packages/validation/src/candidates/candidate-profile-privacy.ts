import { z } from 'zod';

const discoverabilityValues = ['PRIVATE', 'LINK_ONLY', 'PLATFORM_DISCOVERABLE'] as const;
const visibilityValues = ['HIDDEN', 'PLATFORM_ONLY', 'PUBLIC'] as const;

const SUPPORTED_SECTION_KEYS = [
  'BASIC_PROFILE',
  'LOCATION_AND_PREFERENCES',
  'EDUCATION',
  'WORK_EXPERIENCE',
  'SKILLS_AND_LANGUAGES',
  'CERTIFICATIONS_AND_TRAINING',
  'ACHIEVEMENTS_AND_LINKS',
] as const;

const sectionVisibilitySchema = z
  .object(
    Object.fromEntries(
      SUPPORTED_SECTION_KEYS.map((section) => [section, z.enum(visibilityValues)]),
    ),
  )
  .strict();

export const candidateProfilePrivacySchema = z
  .object({
    overallDiscoverability: z.enum(discoverabilityValues),
    sections: sectionVisibilitySchema,
  })
  .strict();

export type CandidateProfilePrivacyInput = z.infer<typeof candidateProfilePrivacySchema>;
