import { z } from 'zod';
export declare const candidateProfileBasicsSchema: z.ZodObject<
  {
    fullName: z.ZodString;
    professionalHeadline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    professionalSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    fullName: string;
    professionalHeadline?: string | null | undefined;
    professionalSummary?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
  },
  {
    fullName: string;
    professionalHeadline?: string | null | undefined;
    professionalSummary?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
  }
>;
export type CandidateProfileBasicsInput = z.infer<typeof candidateProfileBasicsSchema>;
//# sourceMappingURL=candidate-profile-basics.d.ts.map
