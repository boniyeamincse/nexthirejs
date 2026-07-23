import { describe, it, expect } from 'vitest';
import {
  beginMfaEnrollmentSchema,
  confirmMfaEnrollmentSchema,
  disableMfaSchema,
  regenerateMfaRecoveryCodesSchema,
  verifyMfaChallengeSchema,
} from '../src/auth/mfa.js';

const validChallengeToken = 'a'.repeat(64);

describe('MFA Validation Schemas', () => {
  describe('beginMfaEnrollmentSchema', () => {
    it('accepts a current password', () => {
      const result = beginMfaEnrollmentSchema.safeParse({ currentPassword: 'Secret123!' });
      expect(result.success).toBe(true);
    });

    it('rejects an empty password', () => {
      const result = beginMfaEnrollmentSchema.safeParse({ currentPassword: '' });
      expect(result.success).toBe(false);
    });

    it('rejects unknown fields', () => {
      const result = beginMfaEnrollmentSchema.safeParse({
        currentPassword: 'Secret123!',
        extra: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('confirmMfaEnrollmentSchema', () => {
    it('accepts a six digit code', () => {
      expect(confirmMfaEnrollmentSchema.safeParse({ code: '123456' }).success).toBe(true);
    });

    it('trims surrounding whitespace', () => {
      const result = confirmMfaEnrollmentSchema.safeParse({ code: ' 123456 ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('123456');
      }
    });

    it('rejects non-numeric and wrong-length codes', () => {
      expect(confirmMfaEnrollmentSchema.safeParse({ code: '12345' }).success).toBe(false);
      expect(confirmMfaEnrollmentSchema.safeParse({ code: 'abcdef' }).success).toBe(false);
    });
  });

  describe('disableMfaSchema', () => {
    it('accepts password with TOTP code', () => {
      const result = disableMfaSchema.safeParse({
        currentPassword: 'Secret123!',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('accepts password with recovery code', () => {
      const result = disableMfaSchema.safeParse({
        currentPassword: 'Secret123!',
        code: 'ABCD1234EFGH',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a malformed code', () => {
      const result = disableMfaSchema.safeParse({
        currentPassword: 'Secret123!',
        code: 'nope',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('regenerateMfaRecoveryCodesSchema', () => {
    it('requires a TOTP code', () => {
      expect(regenerateMfaRecoveryCodesSchema.safeParse({ code: '654321' }).success).toBe(true);
      expect(regenerateMfaRecoveryCodesSchema.safeParse({ code: 'ABCD1234EFGH' }).success).toBe(
        false,
      );
    });
  });

  describe('verifyMfaChallengeSchema', () => {
    it('accepts a TOTP challenge verification', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: validChallengeToken,
        method: 'TOTP',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a recovery code verification with device trust', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: validChallengeToken,
        method: 'RECOVERY_CODE',
        code: 'ABCD-1234-EFGH',
        trustDevice: true,
        deviceName: 'Work laptop',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a TOTP method with a recovery-format code', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: validChallengeToken,
        method: 'TOTP',
        code: 'ABCD1234EFGH',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid challenge token', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: 'short',
        method: 'TOTP',
        code: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown fields', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: validChallengeToken,
        method: 'TOTP',
        code: '123456',
        rememberMe: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects an overlong device name', () => {
      const result = verifyMfaChallengeSchema.safeParse({
        challengeToken: validChallengeToken,
        method: 'TOTP',
        code: '123456',
        trustDevice: true,
        deviceName: 'x'.repeat(121),
      });
      expect(result.success).toBe(false);
    });
  });
});
