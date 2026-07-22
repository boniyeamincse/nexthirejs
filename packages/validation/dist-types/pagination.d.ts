/**
 * Pagination Validation Schemas
 *
 * Cursor-based pagination validation schemas.
 */
import { z } from 'zod';
/**
 * Cursor pagination query validation schema.
 *
 * Fields:
 * - cursor: Optional non-empty string for pagination
 * - perPage: Optional integer for items per page (1-50, defaults to 20)
 */
export declare const cursorPaginationQuerySchema: z.ZodObject<
  {
    cursor: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    perPage: z.ZodPipeline<
      z.ZodEffects<
        z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>,
        number | undefined,
        string | number | undefined
      >,
      z.ZodNumber
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    perPage: number;
    cursor?: string | undefined;
  },
  {
    cursor?: string | undefined;
    perPage?: string | number | undefined;
  }
>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationQuerySchema>;
//# sourceMappingURL=pagination.d.ts.map
