/**
 * Currency Constants
 *
 * Supported currencies with display metadata.
 */

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'PKR'] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Currency display information.
 */
export interface CurrencyInfo {
  /** ISO 4217 currency code */
  code: SupportedCurrencyCode;
  /** English currency name */
  name: string;
  /** Currency symbol for display */
  symbol: string;
  /** Number of decimal places */
  decimals: number;
}

/**
 * Map of currency code to currency information.
 */
export const CURRENCY_MAP: Record<SupportedCurrencyCode, CurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
  },
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    decimals: 2,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    decimals: 2,
  },
} as const;

// Validate that all currency codes have corresponding entries
SUPPORTED_CURRENCIES.forEach((code) => {
  if (!CURRENCY_MAP[code]) {
    throw new Error(`Missing currency info for code: ${code}`);
  }
});
