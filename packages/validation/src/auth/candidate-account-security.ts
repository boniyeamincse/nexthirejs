import { z } from 'zod';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_UPPERCASE_ERROR,
  PASSWORD_LOWERCASE_ERROR,
  PASSWORD_DIGIT_ERROR,
  PASSWORD_SPECIAL_ERROR,
} from '@nexthire/constants';

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Current password must be at most 128 characters'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
      .regex(/[A-Z]/, PASSWORD_UPPERCASE_ERROR)
      .regex(/[a-z]/, PASSWORD_LOWERCASE_ERROR)
      .regex(/[0-9]/, PASSWORD_DIGIT_ERROR)
      .regex(/[^a-zA-Z0-9]/, PASSWORD_SPECIAL_ERROR),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
