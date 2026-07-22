import { describe, it, expect } from 'vitest';
import { changePasswordSchema } from '../src/auth/candidate-account-security';

const validInput = {
  currentPassword: 'OldP@ss1',
  newPassword: 'NewStr0ng!Pass',
  confirmNewPassword: 'NewStr0ng!Pass',
};

describe('changePasswordSchema', () => {
  it('should accept valid input', () => {
    const result = changePasswordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject missing current password', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      currentPassword: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password (too short)', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: 'Sh0rt!A',
      confirmNewPassword: 'Sh0rt!A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password (no uppercase)', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: 'lowercase1!',
      confirmNewPassword: 'lowercase1!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password (no special character)', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: 'NoSpecial1A',
      confirmNewPassword: 'NoSpecial1A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject confirmation mismatch', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: 'NewStr0ng!Pass',
      confirmNewPassword: 'DifferentP@ss2',
    });
    expect(result.success).toBe(false);
  });

  it('should reject reused password (new matches current)', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      currentPassword: 'SameP@ss1',
      newPassword: 'SameP@ss1',
      confirmNewPassword: 'SameP@ss1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject excessive length', () => {
    const longPw = 'A1!' + 'a'.repeat(126);
    const result = changePasswordSchema.safeParse({
      ...validInput,
      currentPassword: 'OldP@ss1',
      newPassword: longPw,
      confirmNewPassword: longPw,
    });
    expect(result.success).toBe(false);
  });

  it('should not silently trim whitespace in new password', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: '  ',
      confirmNewPassword: '  ',
    });
    expect(result.success).toBe(false);
  });

  it('should strip unexpected fields', () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      extraField: 'should be stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('extraField');
    }
  });
});
