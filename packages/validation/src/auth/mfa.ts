import { z } from 'zod';
import { MFA_RECOVERY_CODE_LENGTH, MFA_TOTP_DIGITS } from '@nexthire/constants';

const totpCodePattern = new RegExp(`^[0-9]{${MFA_TOTP_DIGITS}}$`);
const recoveryCodePattern = new RegExp(`^[A-Z0-9]{${MFA_RECOVERY_CODE_LENGTH}}$`, 'i');
const challengeTokenPattern = /^[a-f0-9]{64}$/i;

export const mfaTotpCodeSchema = z
  .string()
  .trim()
  .regex(totpCodePattern, `Enter the ${MFA_TOTP_DIGITS}-digit code from your authenticator app`);

export const mfaRecoveryCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(
    z
      .string()
      .regex(
        recoveryCodePattern,
        `Recovery codes are ${MFA_RECOVERY_CODE_LENGTH} letters and numbers`,
      ),
  );

export const beginMfaEnrollmentSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Current password must be at most 128 characters'),
  })
  .strict();

export const confirmMfaEnrollmentSchema = z
  .object({
    code: mfaTotpCodeSchema,
  })
  .strict();

export const disableMfaSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Current password must be at most 128 characters'),
    code: z.union([mfaTotpCodeSchema, mfaRecoveryCodeSchema]),
  })
  .strict();

export const regenerateMfaRecoveryCodesSchema = z
  .object({
    code: mfaTotpCodeSchema,
  })
  .strict();

export const verifyMfaChallengeSchema = z
  .object({
    challengeToken: z.string().trim().regex(challengeTokenPattern, 'Invalid challenge token'),
    method: z.enum(['TOTP', 'RECOVERY_CODE']),
    code: z.string().trim().min(1, 'Code is required').max(64),
    trustDevice: z.boolean().optional(),
    deviceName: z.string().trim().max(120, 'Device name is too long').optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.method === 'TOTP' && !totpCodePattern.test(data.code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: `Enter the ${MFA_TOTP_DIGITS}-digit code from your authenticator app`,
      });
    }
    if (
      data.method === 'RECOVERY_CODE' &&
      !recoveryCodePattern.test(data.code.replace(/[\s-]/g, ''))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: `Recovery codes are ${MFA_RECOVERY_CODE_LENGTH} letters and numbers`,
      });
    }
  });

export type BeginMfaEnrollmentSchemaInput = z.infer<typeof beginMfaEnrollmentSchema>;
export type ConfirmMfaEnrollmentSchemaInput = z.infer<typeof confirmMfaEnrollmentSchema>;
export type DisableMfaSchemaInput = z.infer<typeof disableMfaSchema>;
export type RegenerateMfaRecoveryCodesSchemaInput = z.infer<
  typeof regenerateMfaRecoveryCodesSchema
>;
export type VerifyMfaChallengeSchemaInput = z.infer<typeof verifyMfaChallengeSchema>;
