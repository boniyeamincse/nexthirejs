import { describe, it, expect } from 'vitest';
import { createAssessmentQuestionSchema } from '../src/assessments/management';
import { AssessmentQuestionType, AssessmentDifficulty } from '@nexthire/types';

describe('createAssessmentQuestionSchema', () => {
  it('should validate a correct MULTIPLE_CHOICE question', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.MULTIPLE_CHOICE,
      difficulty: AssessmentDifficulty.INTERMEDIATE,
      prompt: 'Which are fruits?',
      options: [
        { label: 'Apple', isCorrect: true, sortOrder: 1 },
        { label: 'Banana', isCorrect: true, sortOrder: 2 },
        { label: 'Carrot', isCorrect: false, sortOrder: 3 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject MULTIPLE_CHOICE with less than 2 correct options', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.MULTIPLE_CHOICE,
      difficulty: AssessmentDifficulty.INTERMEDIATE,
      prompt: 'Which are fruits?',
      options: [
        { label: 'Apple', isCorrect: true, sortOrder: 1 },
        { label: 'Carrot', isCorrect: false, sortOrder: 2 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 2 correct');
    }
  });

  it('should reject SINGLE_CHOICE with multiple correct options', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.SINGLE_CHOICE,
      difficulty: AssessmentDifficulty.INTERMEDIATE,
      prompt: 'Which is a fruit?',
      options: [
        { label: 'Apple', isCorrect: true, sortOrder: 1 },
        { label: 'Banana', isCorrect: true, sortOrder: 2 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should validate a correct TRUE_FALSE question', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.TRUE_FALSE,
      difficulty: AssessmentDifficulty.BEGINNER,
      prompt: 'The sky is blue.',
      options: [
        { label: 'True', isCorrect: true, sortOrder: 1 },
        { label: 'False', isCorrect: false, sortOrder: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should validate a correct SHORT_TEXT question', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.SHORT_TEXT,
      difficulty: AssessmentDifficulty.BEGINNER,
      prompt: 'What is the capital of France?',
      acceptedAnswers: ['Paris', 'paris '],
    });
    expect(result.success).toBe(true);
  });

  it('should reject SHORT_TEXT with options', () => {
    const result = createAssessmentQuestionSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      type: AssessmentQuestionType.SHORT_TEXT,
      difficulty: AssessmentDifficulty.BEGINNER,
      prompt: 'What is the capital of France?',
      options: [
        { label: 'Paris', isCorrect: true, sortOrder: 1 }
      ],
      acceptedAnswers: ['Paris'],
    });
    expect(result.success).toBe(false);
  });
});
