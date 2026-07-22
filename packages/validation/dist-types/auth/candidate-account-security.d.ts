import { z } from 'zod';
export declare const changePasswordSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodObject<
      {
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
        confirmNewPassword: z.ZodString;
      },
      'strip',
      z.ZodTypeAny,
      {
        currentPassword: string;
        newPassword: string;
        confirmNewPassword: string;
      },
      {
        currentPassword: string;
        newPassword: string;
        confirmNewPassword: string;
      }
    >,
    {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    },
    {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }
  >,
  {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  },
  {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }
>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=candidate-account-security.d.ts.map
