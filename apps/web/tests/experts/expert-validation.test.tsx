import { describe, it, expect } from 'vitest';
import {
  validateExpertProfile,
  isSafeUrl,
  hasErrors,
} from '@/features/experts/lib/expert-profile-validation';
import {
  canReviewExpertApplications,
  isApplicationEditable,
  isApplicationTerminal,
  formatBytes,
  APPLICATION_STATUS_PRESENTATION,
} from '@/features/experts/lib/expert-presentation';
import type { ExpertProfileInput } from '@nexthire/types';

const validProfile: ExpertProfileInput = {
  professionalTitle: 'Senior Software Engineer',
  professionalSummary:
    'I have spent more than a decade building large scale distributed systems and mentoring engineers across multiple teams and organisations worldwide.',
  yearsOfExperience: 12,
  currentCompany: 'Acme',
  currentPosition: 'Staff Engineer',
  highestEducation: 'MSc Computer Science',
  linkedinUrl: 'https://www.linkedin.com/in/someone',
  portfolioUrl: '',
  personalWebsiteUrl: '',
  interviewLanguages: ['English', 'Spanish'],
  countryId: 'BD',
  city: 'Dhaka',
};

describe('validateExpertProfile', () => {
  it('accepts a valid profile', () => {
    const errors = validateExpertProfile(validProfile);
    expect(hasErrors(errors)).toBe(false);
  });

  it('rejects a short title and summary', () => {
    const errors = validateExpertProfile({
      ...validProfile,
      professionalTitle: 'ab',
      professionalSummary: 'too short',
    });
    expect(errors.professionalTitle).toBeTruthy();
    expect(errors.professionalSummary).toBeTruthy();
  });

  it('rejects out-of-range years of experience', () => {
    expect(
      validateExpertProfile({ ...validProfile, yearsOfExperience: 0 }).yearsOfExperience,
    ).toBeTruthy();
    expect(
      validateExpertProfile({ ...validProfile, yearsOfExperience: 61 }).yearsOfExperience,
    ).toBeTruthy();
  });

  it('rejects duplicate and empty languages', () => {
    expect(
      validateExpertProfile({ ...validProfile, interviewLanguages: ['English', 'english'] })
        .interviewLanguages,
    ).toBeTruthy();
    expect(
      validateExpertProfile({ ...validProfile, interviewLanguages: [] }).interviewLanguages,
    ).toBeTruthy();
  });

  it('rejects unsafe URLs', () => {
    const errors = validateExpertProfile({
      ...validProfile,
      linkedinUrl: 'javascript:alert(1)',
    });
    expect(errors.linkedinUrl).toBeTruthy();
  });

  it('requires a country', () => {
    expect(validateExpertProfile({ ...validProfile, countryId: '' }).countryId).toBeTruthy();
  });
});

describe('isSafeUrl', () => {
  it('allows https and http', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
  });
  it('allows empty (optional field)', () => {
    expect(isSafeUrl('')).toBe(true);
  });
  it('rejects javascript and other schemes', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('ftp://example.com')).toBe(false);
    expect(isSafeUrl('not a url')).toBe(false);
  });
});

describe('presentation helpers', () => {
  it('marks DRAFT and CHANGES_REQUESTED editable', () => {
    expect(isApplicationEditable('DRAFT')).toBe(true);
    expect(isApplicationEditable('CHANGES_REQUESTED')).toBe(true);
    expect(isApplicationEditable('UNDER_REVIEW')).toBe(false);
    expect(isApplicationEditable('APPROVED')).toBe(false);
  });

  it('marks terminal statuses', () => {
    expect(isApplicationTerminal('APPROVED')).toBe(true);
    expect(isApplicationTerminal('REJECTED')).toBe(true);
    expect(isApplicationTerminal('WITHDRAWN')).toBe(true);
    expect(isApplicationTerminal('DRAFT')).toBe(false);
  });

  it('provides a label and non-empty marker for every status', () => {
    for (const status of Object.keys(APPLICATION_STATUS_PRESENTATION)) {
      const p =
        APPLICATION_STATUS_PRESENTATION[status as keyof typeof APPLICATION_STATUS_PRESENTATION];
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.marker.length).toBeGreaterThan(0);
    }
  });

  it('gates reviewer access by role', () => {
    expect(canReviewExpertApplications(['candidate'])).toBe(false);
    expect(canReviewExpertApplications(['admin'])).toBe(true);
    expect(canReviewExpertApplications(['expert_reviewer'])).toBe(true);
    expect(canReviewExpertApplications(null)).toBe(false);
    expect(canReviewExpertApplications(undefined)).toBe(false);
  });

  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes('2097152')).toBe('2.0 MB');
  });
});
