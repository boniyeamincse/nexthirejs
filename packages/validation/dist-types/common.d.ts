/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common validation patterns.
 */
import { z } from 'zod';
/**
 * UUID v4 validation schema.
 */
export declare const uuidSchema: z.ZodString;
/**
 * Email validation schema.
 * - Emails are trimmed of whitespace
 * - Emails are lowercased for normalization
 * - Validates standard email format
 */
export declare const emailSchema: z.ZodString;
/**
 * Non-empty trimmed string validation schema.
 * - Rejects strings that are empty after trimming
 * - Trims whitespace from validated strings
 */
export declare const nonEmptyTrimmedStringSchema: z.ZodString;
/**
 * Country code validation schema.
 * Derives from shared constants.
 */
export declare const countryCodeSchema: z.ZodEnum<[string, ...string[]]>;
/**
 * Currency code validation schema.
 * Derives from shared constants.
 */
export declare const currencyCodeSchema: z.ZodEnum<[string, ...string[]]>;
/**
 * Language code validation schema.
 * Derives from shared constants.
 */
export declare const languageCodeSchema: z.ZodEnum<[string, ...string[]]>;
//# sourceMappingURL=common.d.ts.map
