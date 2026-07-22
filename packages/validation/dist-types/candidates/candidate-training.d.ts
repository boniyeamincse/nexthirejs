import { z } from 'zod';
export declare const candidateTrainingSchema: z.ZodObject<
  {
    title: z.ZodString;
    provider: z.ZodString;
    completionDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    durationHours: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodNumber>>,
      number | null,
      number | null | undefined
    >;
    description: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    title: string;
    provider: string;
    completionDate: string;
    durationHours: number | null;
    description?: string | null | undefined;
  },
  {
    title: string;
    provider: string;
    completionDate: string;
    description?: string | null | undefined;
    durationHours?: number | null | undefined;
  }
>;
export type CreateCandidateTrainingInput = z.infer<typeof candidateTrainingSchema>;
export declare const updateCandidateTrainingSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    completionDate: z.ZodOptional<
      z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>
    >;
    durationHours: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodNumber>>,
        number | null,
        number | null | undefined
      >
    >;
    description: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    description?: string | null | undefined;
    title?: string | undefined;
    provider?: string | undefined;
    completionDate?: string | undefined;
    durationHours?: number | null | undefined;
  },
  {
    description?: string | null | undefined;
    title?: string | undefined;
    provider?: string | undefined;
    completionDate?: string | undefined;
    durationHours?: number | null | undefined;
  }
>;
export type UpdateCandidateTrainingInput = z.infer<typeof updateCandidateTrainingSchema>;
export declare const reorderCandidateTrainingSchema: z.ZodObject<
  {
    orderedIds: z.ZodEffects<z.ZodArray<z.ZodString, 'many'>, string[], string[]>;
  },
  'strip',
  z.ZodTypeAny,
  {
    orderedIds: string[];
  },
  {
    orderedIds: string[];
  }
>;
export type ReorderCandidateTrainingInput = z.infer<typeof reorderCandidateTrainingSchema>;
//# sourceMappingURL=candidate-training.d.ts.map
