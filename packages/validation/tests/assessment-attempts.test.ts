import { describe, it, expect } from 'vitest';
import {
  SaveAssessmentDraftAnswerInputSchema,
  SubmitAssessmentAttemptInputSchema,
  AssessmentResultHistoryQuerySchema,
  AssessmentPerformanceQuerySchema,
  AssessmentLeaderboardQuerySchema,
  CategoryLeaderboardQuerySchema,
  UpdateLeaderboardParticipationInputSchema,
} from '../src/assessments/attempts';

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
      expect((result.data as Record<string, unknown>).extraField).toBeUndefined();
    }
  });
});

describe('AssessmentResultHistoryQuerySchema', () => {

  it('valid history query passes', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({
      page: 1,
      pageSize: 12,
      search: 'test',
    });
    expect(result.success).toBe(true);
  });

  it('invalid page fails (page < 1)', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('oversized page size fails (> 50)', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({ pageSize: 100 });
    expect(result.success).toBe(false);
  });

  it('invalid enum filter fails', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({
      resultStatus: 'INVALID_STATUS',
    });
    expect(result.success).toBe(false);
  });

  it('invalid date range fails (dateFrom > dateTo)', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({
      dateFrom: '2024-06-01',
      dateTo: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('excessive date range fails (> 5 years)', () => {
    const result = AssessmentResultHistoryQuerySchema.safeParse({
      dateFrom: '2020-01-01',
      dateTo: '2030-01-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('SubmitAssessmentAttemptInputSchema', () => {
  it('accepts explicit SUBMIT confirmation', () => {
    const result = SubmitAssessmentAttemptInputSchema.safeParse({
      confirmation: 'SUBMIT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid confirmation values', () => {
    const result = SubmitAssessmentAttemptInputSchema.safeParse({
      confirmation: 'submit',
    });
    expect(result.success).toBe(false);
  });
});

describe('AssessmentPerformanceQuerySchema', () => {
  it('valid report query passes', () => {
    const result = AssessmentPerformanceQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('valid report query with all filters passes', () => {
    const result = AssessmentPerformanceQuerySchema.safeParse({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      assessmentType: 'PRACTICE',
      difficulty: 'INTERMEDIATE',
      category: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('invalid date range fails', () => {
    const result = AssessmentPerformanceQuerySchema.safeParse({
      dateFrom: '2024-06-01',
      dateTo: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('invalid enum filter fails', () => {
    const result = AssessmentPerformanceQuerySchema.safeParse({
      assessmentType: 'INVALID',
    });
    expect(result.success).toBe(false);
  });
});

describe('AssessmentLeaderboardQuerySchema', () => {
  it('valid leaderboard query passes', () => {
    const result = AssessmentLeaderboardQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('invalid page fails (< 1)', () => {
    const result = AssessmentLeaderboardQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('oversized page size fails (> 100)', () => {
    const result = AssessmentLeaderboardQuerySchema.safeParse({ pageSize: 200 });
    expect(result.success).toBe(false);
  });
});

describe('CategoryLeaderboardQuerySchema', () => {
  it('valid category leaderboard query passes', () => {
    const result = CategoryLeaderboardQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('UpdateLeaderboardParticipationInputSchema', () => {
  it('valid settings input passes', () => {
    const result = UpdateLeaderboardParticipationInputSchema.safeParse({
      enabled: true,
      displayName: 'Security Learner',
    });
    expect(result.success).toBe(true);
  });

  it('valid settings without alias passes', () => {
    const result = UpdateLeaderboardParticipationInputSchema.safeParse({
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('unsafe/oversized alias fails', () => {
    const result = UpdateLeaderboardParticipationInputSchema.safeParse({
      enabled: true,
      displayName: 'a',
    });
    expect(result.success).toBe(false);
  });

  it('unexpected fields are stripped', () => {
    const result = UpdateLeaderboardParticipationInputSchema.safeParse({
      enabled: true,
      extraField: 'should be stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extraField).toBeUndefined();
    }
  });
});
