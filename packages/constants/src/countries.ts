/**
 * Country Constants
 *
 * Supported markets with metadata.
 */

export const SUPPORTED_COUNTRIES = ['BD', 'PK', 'IN'] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Country information interface.
 */
export interface CountryInfo {
  /** ISO 3166-1 alpha-2 country code */
  code: SupportedCountryCode;
  /** English country name */
  name: string;
  /** International calling code */
  callingCode: string;
  /** Default currency code */
  defaultCurrency: string;
  /** IANA timezone identifier */
  timezone: string;
}

/**
 * Map of country code to country information.
 */
export const COUNTRY_MAP: Record<SupportedCountryCode, CountryInfo> = {
  BD: {
    code: 'BD',
    name: 'Bangladesh',
    callingCode: '+880',
    defaultCurrency: 'BDT',
    timezone: 'Asia/Dhaka',
  },
  PK: {
    code: 'PK',
    name: 'Pakistan',
    callingCode: '+92',
    defaultCurrency: 'PKR',
    timezone: 'Asia/Karachi',
  },
  IN: {
    code: 'IN',
    name: 'India',
    callingCode: '+91',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata',
  },
} as const;

// Validate that all country codes in SUPPORTED_COUNTRIES have corresponding entries
SUPPORTED_COUNTRIES.forEach((code) => {
  if (!COUNTRY_MAP[code]) {
    throw new Error(`Missing country info for code: ${code}`);
  }
});
