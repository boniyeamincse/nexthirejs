import { describe, it, expect } from 'vitest';
import { cursorPaginationQuerySchema } from '../src/pagination.js';

describe('Cursor Pagination Schema', () => {
  it('should accept valid pagination query with defaults', () => {
    const result = cursorPaginationQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBeUndefined();
      expect(result.data.perPage).toBe(20);
    }
  });

  it('should default perPage to 20', () => {
    const result = cursorPaginationQuerySchema.safeParse({ cursor: undefined });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perPage).toBe(20);
    }
  });

  it('should accept valid cursor', () => {
    const result = cursorPaginationQuerySchema.safeParse({
      cursor: 'abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe('abc123');
    }
  });

  it('should reject blank cursor when provided', () => {
    const result = cursorPaginationQuerySchema.safeParse({
      cursor: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('should accept perPage within valid range', () => {
    const minResult = cursorPaginationQuerySchema.safeParse({ perPage: 1 });
    expect(minResult.success).toBe(true);

    const maxResult = cursorPaginationQuerySchema.safeParse({ perPage: 50 });
    expect(maxResult.success).toBe(true);
  });

  it('should reject perPage greater than 50', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: 51 });
    expect(result.success).toBe(false);
  });

  it('should reject perPage of 0', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject negative perPage', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject decimal perPage values', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: 10.5 });
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric string perPage', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should accept string perPage and coerce to number', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perPage).toBe(25);
    }
  });

  it('should reject invalid string perPage that becomes NaN', () => {
    const result = cursorPaginationQuerySchema.safeParse({ perPage: 'abc' });
    expect(result.success).toBe(false);
  });
});
