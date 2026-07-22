import { z } from 'zod';
export declare const candidateForgotPasswordSchema: z.ZodObject<
  {
    email: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
  },
  {
    email: string;
  }
>;
export declare const candidateResetPasswordSchema: z.ZodEffects<
  z.ZodObject<
    {
      token: z.ZodString;
      password: z.ZodString;
      confirmPassword: z.ZodString;
    },
    'strip',
    z.ZodTypeAny,
    {
      password: string;
      confirmPassword: string;
      token: string;
    },
    {
      password: string;
      confirmPassword: string;
      token: string;
    }
  >,
  {
    password: string;
    confirmPassword: string;
    token: string;
  },
  {
    password: string;
    confirmPassword: string;
    token: string;
  }
>;
export type CandidateForgotPasswordDto = z.infer<typeof candidateForgotPasswordSchema>;
export type CandidateResetPasswordDto = z.infer<typeof candidateResetPasswordSchema>;
//# sourceMappingURL=candidate-password-reset.d.ts.map
