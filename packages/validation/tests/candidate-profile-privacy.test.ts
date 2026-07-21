import { describe, it, expect } from 'vitest';
import { candidateProfilePrivacySchema } from '../src/candidates/candidate-profile-privacy';

const validInput = {
  overallDiscoverability: 'PRIVATE',
  sections: {
    BASIC_PROFILE: 'PLATFORM_ONLY',
    LOCATION_AND_PREFERENCES: 'HIDDEN',
    EDUCATION: 'PLATFORM_ONLY',
    WORK_EXPERIENCE: 'PLATFORM_ONLY',
    SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
    CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
    ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
  },
};

describe('candidateProfilePrivacySchema', () => {
  it('accepts complete valid settings', () => {
    const result = candidateProfilePrivacySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts LINK_ONLY discoverability', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      overallDiscoverability: 'LINK_ONLY',
    });
    expect(result.success).toBe(true);
  });

  it('accepts PLATFORM_DISCOVERABLE discoverability', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      overallDiscoverability: 'PLATFORM_DISCOVERABLE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid discoverability', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      overallDiscoverability: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid section visibility', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      sections: { ...validInput.sections, BASIC_PROFILE: 'INVALID' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing section', () => {
    const { EDUCATION, ...partialSections } = validInput.sections;
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      sections: partialSections,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown section', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      sections: { ...validInput.sections, UNKNOWN_SECTION: 'PUBLIC' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unexpected fields at root', () => {
    const result = candidateProfilePrivacySchema.safeParse({
      ...validInput,
      unexpectedField: 'value',
    });
    expect(result.success).toBe(false);
  });

  it('defaults include every supported section', () => {
    const sectionKeys = Object.keys(validInput.sections);
    expect(sectionKeys).toEqual([
      'BASIC_PROFILE',
      'LOCATION_AND_PREFERENCES',
      'EDUCATION',
      'WORK_EXPERIENCE',
      'SKILLS_AND_LANGUAGES',
      'CERTIFICATIONS_AND_TRAINING',
      'ACHIEVEMENTS_AND_LINKS',
    ]);
  });
});
