import { z } from 'zod';

export const candidateProfileBasicsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must not exceed 150 characters')
    .regex(/[a-zA-Z]/, 'Full name must contain letters'),
  
  professionalHeadline: z
    .string()
    .trim()
    .max(160, 'Professional headline must not exceed 160 characters')
    .nullable()
    .optional(),
  
  professionalSummary: z
    .string()
    .trim()
    .max(2000, 'Professional summary must not exceed 2000 characters')
    .nullable()
    .optional(),
    
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Date of birth must be a valid date and not in the future')
    .nullable()
    .optional(),
});

export type CandidateProfileBasicsInput = z.infer<typeof candidateProfileBasicsSchema>;
