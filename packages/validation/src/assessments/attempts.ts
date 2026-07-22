import { z } from 'zod';

export const SaveAssessmentDraftAnswerInputSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  shortTextAnswer: z.string().max(5000).nullable().default(null),
});

export const SubmitAssessmentAttemptInputSchema = z.object({
  confirmation: z.literal('SUBMIT'),
});

const resultStatusEnum = z.enum(['PASSED', 'FAILED']);
const finalizationReasonEnum = z.enum(['CANDIDATE_SUBMITTED', 'DEADLINE_REACHED', 'ADMIN_FINALIZED']);
const assessmentTypeEnum = z.enum(['PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK']);
const difficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);

export const AssessmentResultHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(12),
  search: z.string().max(100).optional(),
  resultStatus: resultStatusEnum.optional(),
  finalizationReason: finalizationReasonEnum.optional(),
  assessmentType: assessmentTypeEnum.optional(),
  difficulty: difficultyEnum.optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  { message: 'dateFrom must be before or equal to dateTo' },
).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      const diffMs = new Date(data.dateTo).getTime() - new Date(data.dateFrom).getTime();
      const maxRangeMs = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years
      return diffMs <= maxRangeMs;
    }
    return true;
  },
  { message: 'Date range must not exceed 5 years' },
);

export type AssessmentResultHistoryQueryInput = z.infer<typeof AssessmentResultHistoryQuerySchema>;
