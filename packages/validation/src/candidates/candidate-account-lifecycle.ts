import { z } from 'zod';

export const deactivateCandidateAccountSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Current password must be at most 128 characters'),
  confirmation: z.literal('DEACTIVATE', {
    errorMap: () => ({ message: 'Type DEACTIVATE to confirm' }),
  }),
});

export type DeactivateCandidateAccountInput = z.infer<typeof deactivateCandidateAccountSchema>;
