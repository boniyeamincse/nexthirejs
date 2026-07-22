import { describe, it, expect } from 'vitest';
import { UpdateAssessmentRetakePolicySchema } from '../src/assessments/retakes.js';

describe('UpdateAssessmentRetakePolicySchema', () => {
  it('accepts valid full input', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      retakeEnabled: true,
      maximumAttempts: 3,
      retakeCooldownHours: 24,
      certificateEnabled: true,
      certificateValidityDays: 365,
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      retakeEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts null maximumAttempts (unlimited)', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      maximumAttempts: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null certificateValidityDays (no expiry)', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      certificateValidityDays: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects maximumAttempts below 1', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      maximumAttempts: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects maximumAttempts above 100', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      maximumAttempts: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects retakeCooldownHours below 0', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      retakeCooldownHours: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects retakeCooldownHours above 8760', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      retakeCooldownHours: 8761,
    });
    expect(result.success).toBe(false);
  });

  it('rejects certificateValidityDays below 1', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      certificateValidityDays: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects certificateValidityDays above 3650', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      certificateValidityDays: 3651,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unexpected fields', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      extraField: 'value',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer maximumAttempts', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      maximumAttempts: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects boolean for retakeCooldownHours', () => {
    const result = UpdateAssessmentRetakePolicySchema.safeParse({
      retakeCooldownHours: true,
    });
    expect(result.success).toBe(false);
  });
});
