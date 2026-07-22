import { describe, it, expect } from 'vitest';
import { deactivateCandidateAccountSchema } from '../src/candidates/candidate-account-lifecycle';

const validInput = {
  currentPassword: 'Str0ng!Pass',
  confirmation: 'DEACTIVATE' as const,
};

describe('deactivateCandidateAccountSchema', () => {
  it('should accept valid input', () => {
    const result = deactivateCandidateAccountSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject missing current password', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      confirmation: 'DEACTIVATE',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty current password', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      currentPassword: '',
      confirmation: 'DEACTIVATE',
    });
    expect(result.success).toBe(false);
  });

  it('should reject wrong confirmation text (lowercase)', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      ...validInput,
      confirmation: 'deactivate',
    });
    expect(result.success).toBe(false);
  });

  it('should reject wrong confirmation text (capitalized)', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      ...validInput,
      confirmation: 'Deactivate',
    });
    expect(result.success).toBe(false);
  });

  it('should reject wrong confirmation text (CANCEL)', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      ...validInput,
      confirmation: 'CANCEL',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty confirmation', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      ...validInput,
      confirmation: '',
    });
    expect(result.success).toBe(false);
  });

  it('should strip unexpected fields', () => {
    const result = deactivateCandidateAccountSchema.safeParse({
      ...validInput,
      extraField: 'should be stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('extraField');
    }
  });
});
