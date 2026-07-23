import { z } from 'zod';

const coerceInt = (fallback: number, min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return fallback;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? fallback : parsed;
      }
      return val;
    })
    .pipe(z.number().int().min(min).max(max));

export const publicExpertListQuerySchema = z.object({
  page: coerceInt(1, 1, 100000),
  pageSize: coerceInt(20, 1, 50),
  search: z.string().trim().max(200).optional(),
  expertiseAreaId: z.string().uuid().optional(),
  country: z.string().trim().max(64).optional(),
});

export type PublicExpertListQuerySchemaInput = z.infer<typeof publicExpertListQuerySchema>;

export const publicExpertSlugParamSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9-]+$/, 'Invalid slug format');
