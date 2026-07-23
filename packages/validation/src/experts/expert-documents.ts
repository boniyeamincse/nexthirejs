/**
 * Expert Verification Document Validation
 *
 * Reusable, framework-free helpers and Zod schemas for validating expert
 * verification document metadata BEFORE it is trusted or persisted.
 *
 * Security posture:
 * - The document `type` must be one of the known enum values.
 * - Only PDF / JPEG / PNG MIME types are accepted (with `image/jpg` normalized
 *   to `image/jpeg`). Real content-type is additionally verified server-side by
 *   inspecting magic bytes — never trust the declared MIME alone.
 * - Size is bounded by `EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES` (10MB).
 * - Filenames are sanitized to strip path components and dangerous characters
 *   so a crafted name can never traverse directories or inject markup.
 * - Checksums are compared in constant time to avoid timing side channels.
 *
 * This module is intentionally dependency-light (no Node `crypto`, no DOM) so
 * it can run unchanged in the API, the web client and in unit tests.
 */

import { z } from 'zod';
import {
  EXPERT_LIMITS,
  EXPERT_DOCUMENT_TYPES,
  EXPERT_ALLOWED_MIME_TYPES,
} from '@nexthire/constants';

/** Canonical MIME types accepted for verification documents. */
export const EXPERT_DOCUMENT_MIME_TYPES = EXPERT_ALLOWED_MIME_TYPES;

/** A SHA-256 digest rendered as 64 lowercase/uppercase hex characters. */
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Normalizes a declared MIME type. Browsers and some upload clients send
 * `image/jpg`, which is not an official IANA type; we fold it onto
 * `image/jpeg` so downstream comparisons are consistent.
 */
export function normalizeDocumentMime(mimeType: string): string {
  const trimmed = (mimeType ?? '').trim().toLowerCase();
  return trimmed === 'image/jpg' ? 'image/jpeg' : trimmed;
}

/** True when the (normalized) MIME type is one of the permitted types. */
export function isAllowedDocumentMime(mimeType: string): boolean {
  const normalized = normalizeDocumentMime(mimeType);
  return (EXPERT_ALLOWED_MIME_TYPES as readonly string[]).includes(normalized);
}

/**
 * True when the byte count is a positive integer no larger than the configured
 * maximum. Non-integer, zero, negative and oversized values are rejected.
 */
export function isAllowedDocumentSize(sizeBytes: number): boolean {
  return (
    Number.isInteger(sizeBytes) &&
    sizeBytes > 0 &&
    sizeBytes <= EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES
  );
}

/**
 * Sanitizes an uploaded filename into a safe, storable label.
 *
 * - Drops any directory components (`../../etc/passwd` -> `passwd`).
 * - Replaces every character outside `[A-Za-z0-9._- ]` with `_` so no markup,
 *   quotes or control characters survive.
 * - Collapses runs of whitespace and trims the ends.
 * - Strips leading dots so the result can never become a hidden/`..` entry.
 * - Bounds the length to 255 characters (matches the DB column) and falls back
 *   to `document` when nothing usable remains.
 */
export function sanitizeDocumentFileName(name: string | null | undefined): string {
  const base = (name ?? '').split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .replace(/[^\w.\- ]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 255);
  return cleaned.length > 0 ? cleaned : 'document';
}

/**
 * Constant-time, case-insensitive comparison of two SHA-256 hex digests.
 *
 * Used to confirm that a stored object's checksum matches the value computed at
 * upload time (integrity check). Returns false for any malformed input and
 * never short-circuits on the first differing character.
 */
export function checksumsMatch(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = a.trim().toLowerCase();
  const bb = b.trim().toLowerCase();
  if (!SHA256_HEX_REGEX.test(aa) || !SHA256_HEX_REGEX.test(bb)) return false;
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) {
    diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  }
  return diff === 0;
}

/** Verification document type enum. */
export const expertDocumentTypeSchema = z.enum([...EXPERT_DOCUMENT_TYPES] as [string, ...string[]]);

/** Declared MIME type, normalized then constrained to the allow-list. */
export const expertDocumentMimeSchema = z
  .string()
  .trim()
  .transform(normalizeDocumentMime)
  .refine(isAllowedDocumentMime, { message: 'Unsupported document MIME type' });

/** Size in bytes: positive integer bounded by the 10MB policy. */
export const expertDocumentSizeSchema = z
  .number({ invalid_type_error: 'Document size must be a number' })
  .int('Document size must be a whole number of bytes')
  .positive('Document must not be empty')
  .max(
    EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES,
    `Document must not exceed ${EXPERT_LIMITS.MAX_DOCUMENT_SIZE_MB}MB`,
  );

/** SHA-256 checksum as hex. */
export const sha256HexSchema = z
  .string()
  .trim()
  .regex(SHA256_HEX_REGEX, 'Checksum must be a 64-character hex SHA-256 digest');

/**
 * Full server-side descriptor for a verification document. Unknown keys are
 * rejected outright; the filename is sanitized as part of parsing so callers
 * receive a safe value.
 */
export const expertDocumentDescriptorSchema = z
  .object({
    type: expertDocumentTypeSchema,
    mimeType: expertDocumentMimeSchema,
    sizeBytes: expertDocumentSizeSchema,
    originalFileName: z
      .string()
      .min(1, 'A filename is required')
      .max(1024, 'Filename is unreasonably long')
      .transform(sanitizeDocumentFileName),
    checksumSha256: sha256HexSchema,
  })
  .strict();

export type ExpertDocumentDescriptorInput = z.infer<typeof expertDocumentDescriptorSchema>;
