/**
 * Expert URL Validation
 *
 * Safe URL schema for expert profile links. Only http(s) URLs are accepted
 * and HTTPS is preferred. Dangerous schemes such as `javascript:`, `data:`,
 * `file:` and `vbscript:` are rejected outright to prevent stored-XSS style
 * payloads from being persisted or surfaced to reviewers.
 */

import { z } from 'zod';
import { EXPERT_LIMITS } from '@nexthire/constants';

const DANGEROUS_SCHEME_REGEX = /^\s*(javascript|data|vbscript|file|blob):/i;

/**
 * Absolute http(s) URL with a non-empty host. Intentionally strict — no
 * whitespace, must carry an explicit http/https scheme. HTTPS is preferred
 * but plain http is accepted for compatibility with legacy portfolio hosts.
 * The DOM `URL` global is not available in this package's TS lib, so parsing
 * is done via a bounded regex.
 */
const HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

/**
 * Builds a validated, optional, nullable safe-URL schema.
 *
 * Rules:
 * - Protocol must be `http:` or `https:` (HTTPS preferred).
 * - Dangerous schemes (javascript:, data:, vbscript:, file:, blob:) are rejected.
 * - Must contain a host and no whitespace.
 * - Max length is bounded by EXPERT_LIMITS.MAX_URL.
 */
export function safeUrlSchema() {
  return z
    .string()
    .trim()
    .max(EXPERT_LIMITS.MAX_URL, `URL must not exceed ${EXPERT_LIMITS.MAX_URL} characters`)
    .refine((val) => !DANGEROUS_SCHEME_REGEX.test(val), {
      message: 'URL scheme is not allowed',
    })
    .refine((val) => HTTP_URL_REGEX.test(val), {
      message: 'URL must be a valid http(s) URL',
    })
    .nullable()
    .optional();
}
