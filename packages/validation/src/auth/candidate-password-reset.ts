import { z } from 'zod';
import { candidatePasswordSchema } from './candidate-registration';

export const candidateForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(320, 'Email address must not exceed 320 characters'),
});

export const candidateResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: candidatePasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type CandidateForgotPasswordDto = z.infer<typeof candidateForgotPasswordSchema>;
export type CandidateResetPasswordDto = z.infer<typeof candidateResetPasswordSchema>;
