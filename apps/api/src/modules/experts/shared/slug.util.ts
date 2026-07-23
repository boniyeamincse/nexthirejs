import { randomBytes } from 'node:crypto';

const MAX_BASE_LENGTH = 60;

function slugifyBase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, '');
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}

/**
 * Generates a URL-safe public slug from a professional title plus a short
 * random suffix, retrying against `isTaken` until a free one is found (or
 * throwing after a bounded number of attempts — a collision on an 8-hex-char
 * suffix is astronomically unlikely, so repeated failures indicate `isTaken`
 * itself is broken rather than genuine exhaustion).
 */
export async function generateUniqueExpertSlug(
  professionalTitle: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyBase(professionalTitle) || 'expert';

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error('EXPERT_SLUG_GENERATION_FAILED');
}
