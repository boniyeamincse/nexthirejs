import { generateUniqueExpertSlug } from './slug.util';

describe('generateUniqueExpertSlug', () => {
  it('slugifies the title and appends a random suffix', async () => {
    const slug = await generateUniqueExpertSlug('Senior Backend Engineer!', async () => false);
    expect(slug).toMatch(/^senior-backend-engineer-[0-9a-f]{8}$/);
  });

  it('collapses whitespace/punctuation and strips leading/trailing dashes', async () => {
    const slug = await generateUniqueExpertSlug('  Staff  --  Engineer @ Acme!!  ', async () => false);
    expect(slug).toMatch(/^staff-engineer-acme-[0-9a-f]{8}$/);
  });

  it('falls back to "expert" when the title has no usable characters', async () => {
    const slug = await generateUniqueExpertSlug('!!!', async () => false);
    expect(slug).toMatch(/^expert-[0-9a-f]{8}$/);
  });

  it('retries when the candidate slug is already taken', async () => {
    let calls = 0;
    const isTaken = async () => {
      calls += 1;
      return calls < 3;
    };
    const slug = await generateUniqueExpertSlug('Product Manager', isTaken);
    expect(calls).toBe(3);
    expect(slug).toMatch(/^product-manager-[0-9a-f]{8}$/);
  });

  it('throws after exhausting retries against a persistently-taken slug', async () => {
    await expect(
      generateUniqueExpertSlug('Product Manager', async () => true),
    ).rejects.toThrow('EXPERT_SLUG_GENERATION_FAILED');
  });
});
