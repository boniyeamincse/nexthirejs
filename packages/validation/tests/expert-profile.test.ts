import { describe, it, expect } from 'vitest';
import {
  expertProfileSchema,
  submitExpertApplicationSchema,
  rejectExpertApplicationSchema,
  requestChangesExpertApplicationSchema,
  uploadDocumentMetadataSchema,
  expertApplicationListQuerySchema,
} from '../src/experts';

const validProfile = {
  professionalTitle: 'Senior Software Engineer',
  professionalSummary:
    'Experienced engineer with over a decade of building large scale systems and mentoring candidates through technical interviews and career growth.',
  yearsOfExperience: 10,
  interviewLanguages: ['en'],
  countryId: '11111111-1111-1111-1111-111111111111',
};

describe('expertProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(expertProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects a short professional title', () => {
    const r = expertProfileSchema.safeParse({ ...validProfile, professionalTitle: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects a too-short summary', () => {
    const r = expertProfileSchema.safeParse({ ...validProfile, professionalSummary: 'too short' });
    expect(r.success).toBe(false);
  });

  it('rejects years of experience out of range', () => {
    expect(expertProfileSchema.safeParse({ ...validProfile, yearsOfExperience: 0 }).success).toBe(
      false,
    );
    expect(expertProfileSchema.safeParse({ ...validProfile, yearsOfExperience: 61 }).success).toBe(
      false,
    );
  });

  it('rejects duplicate interview languages', () => {
    const r = expertProfileSchema.safeParse({ ...validProfile, interviewLanguages: ['en', 'en'] });
    expect(r.success).toBe(false);
  });

  it('requires at least one interview language', () => {
    const r = expertProfileSchema.safeParse({ ...validProfile, interviewLanguages: [] });
    expect(r.success).toBe(false);
  });

  it('rejects a non-uuid countryId', () => {
    const r = expertProfileSchema.safeParse({ ...validProfile, countryId: 'BD' });
    expect(r.success).toBe(false);
  });

  describe('URL safety', () => {
    it('accepts https URLs', () => {
      const r = expertProfileSchema.safeParse({
        ...validProfile,
        linkedinUrl: 'https://www.linkedin.com/in/someone',
      });
      expect(r.success).toBe(true);
    });

    it('accepts http URLs', () => {
      const r = expertProfileSchema.safeParse({
        ...validProfile,
        portfolioUrl: 'http://my-portfolio.dev',
      });
      expect(r.success).toBe(true);
    });

    it('rejects javascript: scheme', () => {
      const r = expertProfileSchema.safeParse({
        ...validProfile,
        linkedinUrl: 'javascript:alert(1)',
      });
      expect(r.success).toBe(false);
    });

    it('rejects data: scheme', () => {
      const r = expertProfileSchema.safeParse({
        ...validProfile,
        personalWebsiteUrl: 'data:text/html;base64,PHN2Zz4=',
      });
      expect(r.success).toBe(false);
    });

    it('rejects non-url text', () => {
      const r = expertProfileSchema.safeParse({ ...validProfile, linkedinUrl: 'not a url' });
      expect(r.success).toBe(false);
    });

    it('allows null/undefined optional URLs', () => {
      expect(expertProfileSchema.safeParse({ ...validProfile, linkedinUrl: null }).success).toBe(
        true,
      );
    });
  });
});

describe('expert application action schemas', () => {
  it('submit accepts empty body', () => {
    expect(submitExpertApplicationSchema.safeParse({}).success).toBe(true);
  });

  it('reject requires reasonCode and note', () => {
    expect(rejectExpertApplicationSchema.safeParse({}).success).toBe(false);
    expect(
      rejectExpertApplicationSchema.safeParse({
        reasonCode: 'INVALID_CREDENTIALS',
        reviewerNote: 'documents unreadable',
      }).success,
    ).toBe(true);
  });

  it('reject rejects unknown reason codes', () => {
    expect(
      rejectExpertApplicationSchema.safeParse({ reasonCode: 'NOPE', reviewerNote: 'x' }).success,
    ).toBe(false);
  });

  it('request-changes requires a note', () => {
    expect(requestChangesExpertApplicationSchema.safeParse({ reviewerNote: '' }).success).toBe(
      false,
    );
    expect(
      requestChangesExpertApplicationSchema.safeParse({ reviewerNote: 'add ID' }).success,
    ).toBe(true);
  });

  it('upload metadata validates document type enum', () => {
    expect(uploadDocumentMetadataSchema.safeParse({ type: 'GOVERNMENT_ID' }).success).toBe(true);
    expect(uploadDocumentMetadataSchema.safeParse({ type: 'SELFIE' }).success).toBe(false);
  });

  it('list query coerces defaults', () => {
    const r = expertApplicationListQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.pageSize).toBe(20);
    }
  });

  it('list query enforces pageSize bounds', () => {
    expect(expertApplicationListQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});
