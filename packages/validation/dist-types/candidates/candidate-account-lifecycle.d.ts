import { z } from 'zod';
export declare const deactivateCandidateAccountSchema: z.ZodObject<
  {
    currentPassword: z.ZodString;
    confirmation: z.ZodLiteral<'DEACTIVATE'>;
  },
  'strip',
  z.ZodTypeAny,
  {
    currentPassword: string;
    confirmation: 'DEACTIVATE';
  },
  {
    currentPassword: string;
    confirmation: 'DEACTIVATE';
  }
>;
export type DeactivateCandidateAccountInput = z.infer<typeof deactivateCandidateAccountSchema>;
//# sourceMappingURL=candidate-account-lifecycle.d.ts.map
