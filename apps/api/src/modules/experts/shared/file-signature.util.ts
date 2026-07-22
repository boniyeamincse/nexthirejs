/**
 * File signature (magic byte) validation for verification documents.
 *
 * We never trust the client-supplied MIME type or filename alone. The first
 * bytes of the uploaded buffer are inspected to confirm the real content type
 * and matched against the declared MIME type. Only PDF/JPEG/PNG are permitted.
 */

export type DetectedFileType = 'application/pdf' | 'image/jpeg' | 'image/png';

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(buffer: Buffer, magic: number[]): boolean {
  if (buffer.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

/**
 * Detects the true file type from the buffer's magic bytes.
 * Returns null when the content does not match any allowed type.
 */
export function detectFileType(buffer: Buffer): DetectedFileType | null {
  if (startsWith(buffer, PDF_MAGIC)) return 'application/pdf';
  if (startsWith(buffer, JPEG_MAGIC)) return 'image/jpeg';
  if (startsWith(buffer, PNG_MAGIC)) return 'image/png';
  return null;
}

/**
 * Verifies that the detected content type is allowed and consistent with the
 * declared MIME type. JPEG is allowed to be declared as either image/jpeg or
 * image/jpg. Returns the canonical detected type, or null when invalid.
 */
export function verifyFileSignature(
  buffer: Buffer,
  declaredMimeType: string,
): DetectedFileType | null {
  const detected = detectFileType(buffer);
  if (!detected) return null;

  const normalizedDeclared = declaredMimeType === 'image/jpg' ? 'image/jpeg' : declaredMimeType;

  if (normalizedDeclared !== detected) return null;

  return detected;
}
