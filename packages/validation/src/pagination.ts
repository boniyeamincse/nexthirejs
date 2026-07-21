/**
 * Pagination Validation Schemas
 *
 * Cursor-based pagination validation schemas.
 */

import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@nexthire/constants';

/**
 * Cursor pagination query validation schema.
 *
 * Fields:
 * - cursor: Optional non-empty string for pagination
 * - perPage: Optional integer for items per page (1-50, defaults to 20)
 */
export const cursorPaginationQuerySchema = z.object({
  cursor: z
    .string()
    .trim()
    .optional()
    .refine((val) => val === undefined || val.length > 0, {
      message: 'Cursor cannot be empty',
    }),
  perPage: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return DEFAULT_PAGE_SIZE;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .pipe(z.number().int().min(1).max(MAX_PAGE_SIZE)),
});

// Inferred types from schemas
export type CursorPaginationInput = z.infer<typeof cursorPaginationQuerySchema>;
