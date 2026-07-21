import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  COUNTRY_MAP,
  LANGUAGE_MAP,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../src/index.js';

describe('Countries', () => {
  it('should contain BD, PK, and IN', () => {
    expect(SUPPORTED_COUNTRIES).toContain('BD');
    expect(SUPPORTED_COUNTRIES).toContain('PK');
    expect(SUPPORTED_COUNTRIES).toContain('IN');
    expect(SUPPORTED_COUNTRIES).toHaveLength(3);
  });

  it('should have correct default currencies', () => {
    expect(COUNTRY_MAP.BD.defaultCurrency).toBe('BDT');
    expect(COUNTRY_MAP.PK.defaultCurrency).toBe('PKR');
    expect(COUNTRY_MAP.IN.defaultCurrency).toBe('INR');
  });

  it('should have no duplicate country codes', () => {
    const uniqueCodes = new Set(SUPPORTED_COUNTRIES);
    expect(uniqueCodes.size).toBe(SUPPORTED_COUNTRIES.length);
  });
});

describe('Languages', () => {
  it('should contain en, bn, ur, and hi', () => {
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('bn');
    expect(SUPPORTED_LANGUAGES).toContain('ur');
    expect(SUPPORTED_LANGUAGES).toContain('hi');
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });

  it('should have Urdu with RTL direction', () => {
    expect(LANGUAGE_MAP.ur.direction).toBe('rtl');
  });

  it('should have all other languages with LTR direction', () => {
    expect(LANGUAGE_MAP.en.direction).toBe('ltr');
    expect(LANGUAGE_MAP.bn.direction).toBe('ltr');
    expect(LANGUAGE_MAP.hi.direction).toBe('ltr');
  });

  it('should have no duplicate language codes', () => {
    const uniqueCodes = new Set(SUPPORTED_LANGUAGES);
    expect(uniqueCodes.size).toBe(SUPPORTED_LANGUAGES.length);
  });
});

describe('Currencies', () => {
  it('should contain BDT, PKR, INR, and USD', () => {
    expect(SUPPORTED_CURRENCIES).toContain('BDT');
    expect(SUPPORTED_CURRENCIES).toContain('PKR');
    expect(SUPPORTED_CURRENCIES).toContain('INR');
    expect(SUPPORTED_CURRENCIES).toContain('USD');
    expect(SUPPORTED_CURRENCIES).toHaveLength(4);
  });

  it('should have no duplicate currency codes', () => {
    const uniqueCodes = new Set(SUPPORTED_CURRENCIES);
    expect(uniqueCodes.size).toBe(SUPPORTED_CURRENCIES.length);
  });
});

describe('HTTP Constants', () => {
  it('should have valid page size values', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(MAX_PAGE_SIZE).toBe(50);
    expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });
});