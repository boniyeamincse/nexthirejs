import { z } from 'zod';
import { EXPERT_FEEDBACK_LIMITS } from '@nexthire/constants';

const score = z
  .number()
  .int()
  .min(EXPERT_FEEDBACK_LIMITS.SCORE_MIN)
  .max(EXPERT_FEEDBACK_LIMITS.SCORE_MAX);

export const createExpertSessionEvaluationSchema = z.object({
  communication: score,
  technicalKnowledge: score,
  confidence: score,
  problemSolving: score,
  strengths: z.string().trim().max(EXPERT_FEEDBACK_LIMITS.STRENGTHS_MAX).optional().nullable(),
  improvements: z
    .string()
    .trim()
    .max(EXPERT_FEEDBACK_LIMITS.IMPROVEMENTS_MAX)
    .optional()
    .nullable(),
  nextSteps: z.string().trim().max(EXPERT_FEEDBACK_LIMITS.NEXT_STEPS_MAX).optional().nullable(),
});

export const createExpertReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(EXPERT_FEEDBACK_LIMITS.RATING_MIN)
    .max(EXPERT_FEEDBACK_LIMITS.RATING_MAX),
  comment: z.string().trim().max(EXPERT_FEEDBACK_LIMITS.REVIEW_COMMENT_MAX).optional().nullable(),
});

export const moderateExpertReviewSchema = z.object({
  reason: z.string().trim().max(EXPERT_FEEDBACK_LIMITS.HIDDEN_REASON_MAX).optional().nullable(),
});

const coerceInt = (fallback: number, min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return fallback;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? fallback : parsed;
      }
      return val;
    })
    .pipe(z.number().int().min(min).max(max));

export const expertReviewListQuerySchema = z.object({
  page: coerceInt(1, 1, 100000),
  pageSize: coerceInt(20, 1, 50),
});
