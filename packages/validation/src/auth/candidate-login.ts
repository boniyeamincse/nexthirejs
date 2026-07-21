import { z } from 'zod';

export const candidateLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type CandidateLoginInput = z.infer<typeof candidateLoginSchema>;
