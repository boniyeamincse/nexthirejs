import { z } from 'zod';
export declare const SaveAssessmentDraftAnswerInputSchema: z.ZodObject<
  {
    selectedOptionIds: z.ZodDefault<z.ZodArray<z.ZodString, 'many'>>;
    shortTextAnswer: z.ZodDefault<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    selectedOptionIds: string[];
    shortTextAnswer: string | null;
  },
  {
    selectedOptionIds?: string[] | undefined;
    shortTextAnswer?: string | null | undefined;
  }
>;
export declare const SubmitAssessmentAttemptInputSchema: z.ZodObject<
  {
    confirmation: z.ZodLiteral<'SUBMIT'>;
  },
  'strip',
  z.ZodTypeAny,
  {
    confirmation: 'SUBMIT';
  },
  {
    confirmation: 'SUBMIT';
  }
>;
//# sourceMappingURL=attempts.d.ts.map
