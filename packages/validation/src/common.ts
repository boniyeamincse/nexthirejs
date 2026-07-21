/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common validation patterns.
 */

import { z } from 'zod';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
} from '@nexthire/constants';

/**
 * UUID v4 validation schema.
 */
export const uuidSchema = z.string().uuid();

/**
 * Email validation schema.
 * - Emails are trimmed of whitespace
 * - Emails are lowercased for normalization
 * - Validates standard email format
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Invalid email format' });

/**
 * Non-empty trimmed string validation schema.
 * - Rejects strings that are empty after trimming
 * - Trims whitespace from validated strings
 */
export const nonEmptyTrimmedStringSchema = z
  .string()
  .trim()
  .min(1, { message: 'String cannot be empty or whitespace only' });

/**
 * Country code validation schema.
 * Derives from shared constants.
 */
export const countryCodeSchema = z.enum([...SUPPORTED_COUNTRIES] as [string, ...string[]]);

/**
 * Currency code validation schema.
 * Derives from shared constants.
 */
export const currencyCodeSchema = z.enum([...SUPPORTED_CURRENCIES] as [string, ...string[]]);

/**
 * Language code validation schema.
 * Derives from shared constants.
 */
export const languageCodeSchema = z.enum([...SUPPORTED_LANGUAGES] as [string, ...string[]]);
