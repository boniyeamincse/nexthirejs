import { describe, it, expect } from 'vitest';
import { candidateRegistrationSchema } from '../src/auth/candidate-registration';

const validInput = {
  email: 'candidate@example.com',
  password: 'StrongP@ss1',
  confirmPassword: 'StrongP@ss1',
  acceptTerms: true as const,
};

describe('candidateRegistrationSchema', () => {
  it('should accept valid input', () => {
    const result = candidateRegistrationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject email over 320 characters', () => {
    const localPart = 'a'.repeat(300);
    const domain = 'b'.repeat(20);
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      email: `${localPart}@${domain}.com`,
    });
    expect(result.success).toBe(false);
  });

  it('should reject password under 10 characters', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'Abc1!',
      confirmPassword: 'Abc1!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'lowercase1!',
      confirmPassword: 'lowercase1!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'UPPERCASE1!',
      confirmPassword: 'UPPERCASE1!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'NoNumber!A',
      confirmPassword: 'NoNumber!A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'NoSpecial1A',
      confirmPassword: 'NoSpecial1A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password over 128 characters', () => {
    const longPw = 'A1!' + 'a'.repeat(126);
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: longPw,
      confirmPassword: longPw,
    });
    expect(result.success).toBe(false);
  });

  it('should reject password equal to email', () => {
    const email = 'candidate@example.com';
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      email,
      password: email,
      confirmPassword: email,
    });
    expect(result.success).toBe(false);
  });

  it('should reject confirmation mismatch', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      password: 'StrongP@ss1',
      confirmPassword: 'DifferentP@ss2',
    });
    expect(result.success).toBe(false);
  });

  it('should reject terms not accepted', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      // @ts-expect-error testing false value
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = candidateRegistrationSchema.safeParse({
      ...validInput,
      email: 'CANDIDATE@Example.Com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('candidate@example.com');
    }
  });
});
