import { z } from 'zod';
import { WorkMode, EmploymentType } from '@nexthire/types';

export const candidatePreferenceSchema = z.object({
  countryCode: z.string().length(2, 'Country code must be 2 characters').toUpperCase(),

  currentCity: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .regex(/[a-zA-Z]/, 'City must contain letters'),

  preferredJobRoles: z
    .array(
      z
        .string()
        .trim()
        .min(2, 'Job role must be at least 2 characters')
        .max(100, 'Job role must not exceed 100 characters'),
    )
    .min(1, 'At least one preferred job role is required')
    .max(5, 'Maximum of 5 preferred job roles allowed')
    .transform((roles) => roles.filter((r) => r.length > 0))
    .refine(
      (roles) => {
        const lowercased = roles.map((r) => r.toLowerCase());
        return new Set(lowercased).size === roles.length;
      },
      { message: 'Preferred job roles must be unique' },
    ),

  preferredWorkModes: z
    .array(z.nativeEnum(WorkMode))
    .min(1, 'At least one work mode is required')
    .refine((modes) => new Set(modes).size === modes.length, {
      message: 'Work modes must be unique',
    }),

  preferredEmploymentTypes: z
    .array(z.nativeEnum(EmploymentType))
    .min(1, 'At least one employment type is required')
    .refine((types) => new Set(types).size === types.length, {
      message: 'Employment types must be unique',
    }),
});

export type CandidatePreferenceInput = z.infer<typeof candidatePreferenceSchema>;
