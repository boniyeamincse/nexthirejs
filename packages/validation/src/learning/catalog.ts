import { z } from 'zod';
import { CourseDifficulty } from '@nexthire/types';

export const courseCatalogQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 1;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 1 : parsed;
      }
      return val < 1 ? 1 : val;
    })
    .pipe(z.number().int()),
  pageSize: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 12;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) || parsed < 1 ? 12 : parsed;
      }
      return val < 1 ? 12 : val;
    })
    .pipe(z.number().int().max(50)),
  search: z
    .string()
    .trim()
    .max(100, 'Search must not exceed 100 characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  category: z
    .string()
    .trim()
    .max(140)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
});

export type CourseCatalogQueryInput = z.infer<typeof courseCatalogQuerySchema>;
