import { z } from 'zod';
export declare const candidatePasswordSchema: z.ZodString;
export declare const candidateRegistrationSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodObject<
      {
        email: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
        acceptTerms: z.ZodLiteral<true>;
      },
      'strip',
      z.ZodTypeAny,
      {
        email: string;
        password: string;
        confirmPassword: string;
        acceptTerms: true;
      },
      {
        email: string;
        password: string;
        confirmPassword: string;
        acceptTerms: true;
      }
    >,
    {
      email: string;
      password: string;
      confirmPassword: string;
      acceptTerms: true;
    },
    {
      email: string;
      password: string;
      confirmPassword: string;
      acceptTerms: true;
    }
  >,
  {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: true;
  },
  {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: true;
  }
>;
export type CandidateRegistrationInput = z.infer<typeof candidateRegistrationSchema>;
//# sourceMappingURL=candidate-registration.d.ts.map
