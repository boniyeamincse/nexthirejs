import { describe, it, expect } from 'vitest';
import { SaveAssessmentDraftAnswerInputSchema } from '../src/assessments/attempts';

describe('SaveAssessmentDraftAnswerInputSchema', () => {
  it('valid single-choice: one selected option passes', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440000'],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(true);
  });

  it('multiple selected options for single choice passes (type validation is service-level)', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(true);
  });

  it('valid multiple-choice: multiple selected options passes', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(true);
  });

  it('duplicate selected IDs pass schema validation (duplicates handled by service)', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440000',
      ],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(true);
  });

  it('invalid foreign option shape fails', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: ['not-a-uuid'],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(false);
  });

  it('valid true/false: one selected option passes', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440000'],
      shortTextAnswer: null,
    });
    expect(result.success).toBe(true);
  });

  it('valid short text passes', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [],
      shortTextAnswer: 'My answer text',
    });
    expect(result.success).toBe(true);
  });

  it('oversized short text fails', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [],
      shortTextAnswer: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('mixed selected options and short text passes schema validation (service rejects for non-text types)', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440000'],
      shortTextAnswer: 'some text',
    });
    expect(result.success).toBe(true);
  });

  it('unexpected fields are stripped', () => {
    const result = SaveAssessmentDraftAnswerInputSchema.safeParse({
      selectedOptionIds: [],
      shortTextAnswer: null,
      extraField: 'should be stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });
});
