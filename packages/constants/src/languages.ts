/**
 * Language Constants
 *
 * Supported languages with metadata.
 */

export const SUPPORTED_LANGUAGES = ['en', 'bn', 'ur', 'hi'] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Text direction for UI rendering.
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Language information interface.
 */
export interface LanguageInfo {
  /** ISO 639-1 language code */
  code: SupportedLanguageCode;
  /** English language name */
  name: string;
  /** Native language name */
  nativeName: string;
  /** Text direction for UI rendering */
  direction: TextDirection;
}

/**
 * Map of language code to language information.
 */
export const LANGUAGE_MAP: Record<SupportedLanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    direction: 'ltr',
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    direction: 'rtl',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
  },
} as const;

// Validate that all language codes have corresponding entries
SUPPORTED_LANGUAGES.forEach((code) => {
  if (!LANGUAGE_MAP[code]) {
    throw new Error(`Missing language info for code: ${code}`);
  }
});
