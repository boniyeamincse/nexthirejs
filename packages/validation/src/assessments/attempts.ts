import { z } from 'zod';

export const SaveAssessmentDraftAnswerInputSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  shortTextAnswer: z.string().max(5000).nullable().default(null),
});
