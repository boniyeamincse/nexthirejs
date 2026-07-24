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

export const companyCandidateSearchQuerySchema = z.object({
  page: coerceInt(1, 1, 100000),
  pageSize: coerceInt(20, 1, 50),
  search: z.string().trim().max(150).optional(),
  countryId: z.string().uuid().optional(),
  skill: z.string().trim().max(100).optional(),
});
