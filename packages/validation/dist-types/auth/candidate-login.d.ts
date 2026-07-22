import { z } from 'zod';
export declare const candidateLoginSchema: z.ZodObject<
  {
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
    password: string;
  },
  {
    email: string;
    password: string;
  }
>;
export type CandidateLoginInput = z.infer<typeof candidateLoginSchema>;
//# sourceMappingURL=candidate-login.d.ts.map
