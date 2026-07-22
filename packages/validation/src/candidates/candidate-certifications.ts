import { z } from 'zod';

const certificationBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Certification name must be at least 2 characters')
    .max(200, 'Certification name must not exceed 200 characters'),

  issuer: z
    .string()
    .trim()
    .min(2, 'Issuer must be at least 2 characters')
    .max(200, 'Issuer must not exceed 200 characters'),

  issueDate: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Issue date must be a valid date',
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: 'Issue date cannot be in the future',
    }),

  expiryDate: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(new Date(val).getTime());
      },
      { message: 'Expiry date must be a valid date' },
    )
    .transform((val) => (val === '' ? null : val)),

  doesNotExpire: z.boolean(),

  credentialId: z
    .string()
    .trim()
    .max(150, 'Credential ID must not exceed 150 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  credentialUrl: z
    .string()
    .url('Credential URL must be a valid URL')
    .max(500, 'Credential URL must not exceed 500 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

export const candidateCertificationSchema = certificationBaseSchema
  .refine(
    (data) => {
      if (data.doesNotExpire) {
        return data.expiryDate === null || data.expiryDate === undefined;
      }
      return true;
    },
    {
      message: 'Expiry date must be empty when doesNotExpire is true',
      path: ['expiryDate'],
    },
  )
  .refine(
    (data) => {
      if (data.expiryDate && data.issueDate) {
        return new Date(data.expiryDate) >= new Date(data.issueDate);
      }
      return true;
    },
    {
      message: 'Expiry date cannot be earlier than issue date',
      path: ['expiryDate'],
    },
  );

export type CreateCandidateCertificationInput = z.infer<typeof candidateCertificationSchema>;

export const updateCandidateCertificationSchema = certificationBaseSchema.partial();

export type UpdateCandidateCertificationInput = z.infer<typeof updateCandidateCertificationSchema>;

export const reorderCandidateCertificationsSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderCandidateCertificationsInput = z.infer<
  typeof reorderCandidateCertificationsSchema
>;
