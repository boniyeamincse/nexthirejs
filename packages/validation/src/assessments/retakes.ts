import { z } from 'zod';

export const UpdateAssessmentRetakePolicySchema = z
  .object({
    retakeEnabled: z.boolean().optional(),
    maximumAttempts: z
      .union([z.number().int().min(1).max(100), z.null()])
      .optional(),
    retakeCooldownHours: z.number().int().min(0).max(8760).optional(),
    certificateEnabled: z.boolean().optional(),
    certificateValidityDays: z
      .union([z.number().int().min(1).max(3650), z.null()])
      .optional(),
  })
  .strict();
