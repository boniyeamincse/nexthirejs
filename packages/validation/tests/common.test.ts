import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  emailSchema,
  nonEmptyTrimmedStringSchema,
  countryCodeSchema,
  currencyCodeSchema,
  languageCodeSchema,
} from '../src/common.js';

describe('Email Schema', () => {
  it('should accept valid email', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should trim and lowercase email', () => {
    const result = emailSchema.safeParse('  TEST@EXAMPLE.COM  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should reject invalid email', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('should reject blank email', () => {
    const result = emailSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('UUID Schema', () => {
  it('should accept valid UUID v4', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = uuidSchema.safeParse(uuid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = uuidSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
  });
});

describe('Non-empty Trimmed String Schema', () => {
  it('should accept non-empty string', () => {
    const result = nonEmptyTrimmedStringSchema.safeParse('hello');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello');
    }
  });

  it('should trim whitespace', () => {
    const result = nonEmptyTrimmedStringSchema.safeParse('  hello  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello');
    }
  });

  it('should reject only whitespace', () => {
    const result = nonEmptyTrimmedStringSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = nonEmptyTrimmedStringSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('Country Code Schema', () => {
  it('should accept BD, PK, and IN', () => {
    expect(countryCodeSchema.safeParse('BD').success).toBe(true);
    expect(countryCodeSchema.safeParse('PK').success).toBe(true);
    expect(countryCodeSchema.safeParse('IN').success).toBe(true);
  });

  it('should reject unsupported country codes', () => {
    expect(countryCodeSchema.safeParse('US').success).toBe(false);
    expect(countryCodeSchema.safeParse('UK').success).toBe(false);
    expect(countryCodeSchema.safeParse('').success).toBe(false);
  });
});

describe('Currency Code Schema', () => {
  it('should accept BDT, PKR, INR, and USD', () => {
    expect(currencyCodeSchema.safeParse('BDT').success).toBe(true);
    expect(currencyCodeSchema.safeParse('PKR').success).toBe(true);
    expect(currencyCodeSchema.safeParse('INR').success).toBe(true);
    expect(currencyCodeSchema.safeParse('USD').success).toBe(true);
  });

  it('should reject unsupported currency codes', () => {
    expect(currencyCodeSchema.safeParse('EUR').success).toBe(false);
    expect(currencyCodeSchema.safeParse('GBP').success).toBe(false);
    expect(currencyCodeSchema.safeParse('').success).toBe(false);
  });
});

describe('Language Code Schema', () => {
  it('should accept en, bn, ur, and hi', () => {
    expect(languageCodeSchema.safeParse('en').success).toBe(true);
    expect(languageCodeSchema.safeParse('bn').success).toBe(true);
    expect(languageCodeSchema.safeParse('ur').success).toBe(true);
    expect(languageCodeSchema.safeParse('hi').success).toBe(true);
  });

  it('should reject unsupported language codes', () => {
    expect(languageCodeSchema.safeParse('es').success).toBe(false);
    expect(languageCodeSchema.safeParse('fr').success).toBe(false);
    expect(languageCodeSchema.safeParse('').success).toBe(false);
  });
});