import { EXPERT_LIMITS } from '@nexthire/constants';
import type { ExpertProfileInput } from '@nexthire/types';

export type ExpertProfileFieldErrors = Partial<Record<keyof ExpertProfileInput, string>>;

const SAFE_URL_SCHEMES = ['http:', 'https:'];

export function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return SAFE_URL_SCHEMES.includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Client-side mirror of the server validation rules. The API remains
 * authoritative; this only provides fast, accessible inline feedback.
 */
export function validateExpertProfile(input: ExpertProfileInput): ExpertProfileFieldErrors {
  const errors: ExpertProfileFieldErrors = {};

  const title = input.professionalTitle?.trim() ?? '';
  if (title.length < EXPERT_LIMITS.MIN_PROFESSIONAL_TITLE) {
    errors.professionalTitle = `Professional title must be at least ${EXPERT_LIMITS.MIN_PROFESSIONAL_TITLE} characters.`;
  } else if (title.length > EXPERT_LIMITS.MAX_PROFESSIONAL_TITLE) {
    errors.professionalTitle = `Professional title must be at most ${EXPERT_LIMITS.MAX_PROFESSIONAL_TITLE} characters.`;
  }

  const summary = input.professionalSummary?.trim() ?? '';
  if (summary.length < EXPERT_LIMITS.MIN_PROFESSIONAL_SUMMARY) {
    errors.professionalSummary = `Summary must be at least ${EXPERT_LIMITS.MIN_PROFESSIONAL_SUMMARY} characters.`;
  } else if (summary.length > EXPERT_LIMITS.MAX_PROFESSIONAL_SUMMARY) {
    errors.professionalSummary = `Summary must be at most ${EXPERT_LIMITS.MAX_PROFESSIONAL_SUMMARY} characters.`;
  }

  const years = input.yearsOfExperience;
  if (!Number.isInteger(years)) {
    errors.yearsOfExperience = 'Years of experience must be a whole number.';
  } else if (years < EXPERT_LIMITS.MIN_YEARS_EXPERIENCE) {
    errors.yearsOfExperience = `Years of experience must be at least ${EXPERT_LIMITS.MIN_YEARS_EXPERIENCE}.`;
  } else if (years > EXPERT_LIMITS.MAX_YEARS_EXPERIENCE) {
    errors.yearsOfExperience = `Years of experience must be at most ${EXPERT_LIMITS.MAX_YEARS_EXPERIENCE}.`;
  }

  if (input.currentCompany && input.currentCompany.length > EXPERT_LIMITS.MAX_CURRENT_COMPANY) {
    errors.currentCompany = `Company must be at most ${EXPERT_LIMITS.MAX_CURRENT_COMPANY} characters.`;
  }
  if (input.currentPosition && input.currentPosition.length > EXPERT_LIMITS.MAX_CURRENT_POSITION) {
    errors.currentPosition = `Position must be at most ${EXPERT_LIMITS.MAX_CURRENT_POSITION} characters.`;
  }
  if (
    input.highestEducation &&
    input.highestEducation.length > EXPERT_LIMITS.MAX_HIGHEST_EDUCATION
  ) {
    errors.highestEducation = `Education must be at most ${EXPERT_LIMITS.MAX_HIGHEST_EDUCATION} characters.`;
  }

  for (const key of ['linkedinUrl', 'portfolioUrl', 'personalWebsiteUrl'] as const) {
    const value = input[key];
    if (!value) continue;
    if (value.length > EXPERT_LIMITS.MAX_URL) {
      errors[key] = `URL must be at most ${EXPERT_LIMITS.MAX_URL} characters.`;
    } else if (!isSafeUrl(value)) {
      errors[key] = 'Enter a valid URL beginning with http:// or https://';
    }
  }

  const languages = input.interviewLanguages ?? [];
  const normalized = languages.map((l) => l.trim()).filter(Boolean);
  const unique = new Set(normalized.map((l) => l.toLowerCase()));
  if (normalized.length < EXPERT_LIMITS.MIN_INTERVIEW_LANGUAGES) {
    errors.interviewLanguages = 'Add at least one interview language.';
  } else if (normalized.length > EXPERT_LIMITS.MAX_INTERVIEW_LANGUAGES) {
    errors.interviewLanguages = `Add at most ${EXPERT_LIMITS.MAX_INTERVIEW_LANGUAGES} languages.`;
  } else if (unique.size !== normalized.length) {
    errors.interviewLanguages = 'Remove duplicate languages.';
  }

  if (!input.countryId) {
    errors.countryId = 'Select a country.';
  }

  if (input.city && input.city.length > EXPERT_LIMITS.MAX_CITY) {
    errors.city = `City must be at most ${EXPERT_LIMITS.MAX_CITY} characters.`;
  }

  return errors;
}

export function hasErrors(errors: ExpertProfileFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
