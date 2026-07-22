import { describe, it, expect } from 'vitest';
import { assessmentCatalogQuerySchema } from '../src/assessments/assessment-catalog';
import { isValidTransition } from '../src/assessments/assessment-catalog';

describe('assessmentCatalogQuerySchema', () => {
  it('accepts empty query with defaults', () => {
    const result = assessmentCatalogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
    }
  });

  it('accepts valid page and pageSize', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ page: 2, pageSize: 24 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(24);
    }
  });

  it('rejects pageSize over 50', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ pageSize: 51 });
    expect(result.success).toBe(false);
  });

  it('rejects page below 1', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it('rejects search over 100 chars', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ search: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts valid search', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ search: 'javascript' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('javascript');
    }
  });

  it('rejects invalid category slug containing spaces', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ category: 'invalid category' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('invalid category');
    }
  });

  it('rejects invalid type enum', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ type: 'INVALID_TYPE' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid difficulty enum', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ difficulty: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid availability enum', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ availability: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts valid enum filters', () => {
    const result = assessmentCatalogQuerySchema.safeParse({
      type: 'PRACTICE',
      difficulty: 'INTERMEDIATE',
      availability: 'AVAILABLE',
    });
    expect(result.success).toBe(true);
  });

  it('strips empty search to undefined', () => {
    const result = assessmentCatalogQuerySchema.safeParse({ search: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBeUndefined();
    }
  });
});

describe('isValidTransition', () => {
  it('allows DRAFT to PUBLISHED', () => {
    expect(isValidTransition('DRAFT', 'PUBLISHED')).toBe(true);
  });

  it('allows PUBLISHED to ARCHIVED', () => {
    expect(isValidTransition('PUBLISHED', 'ARCHIVED')).toBe(true);
  });

  it('allows ARCHIVED to PUBLISHED', () => {
    expect(isValidTransition('ARCHIVED', 'PUBLISHED')).toBe(true);
  });

  it('allows PUBLISHED to RETIRED', () => {
    expect(isValidTransition('PUBLISHED', 'RETIRED')).toBe(true);
  });

  it('allows ARCHIVED to RETIRED', () => {
    expect(isValidTransition('ARCHIVED', 'RETIRED')).toBe(true);
  });

  it('rejects RETIRED to any active status', () => {
    expect(isValidTransition('RETIRED', 'PUBLISHED')).toBe(false);
    expect(isValidTransition('RETIRED', 'DRAFT')).toBe(false);
    expect(isValidTransition('RETIRED', 'ARCHIVED')).toBe(false);
  });

  it('rejects DRAFT to RETIRED', () => {
    expect(isValidTransition('DRAFT', 'RETIRED')).toBe(false);
  });

  it('rejects DRAFT to ARCHIVED', () => {
    expect(isValidTransition('DRAFT', 'ARCHIVED')).toBe(false);
  });

  it('rejects unknown statuses', () => {
    expect(isValidTransition('UNKNOWN', 'PUBLISHED')).toBe(false);
  });
});
