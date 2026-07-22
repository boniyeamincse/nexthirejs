import { z } from 'zod';
export declare const candidateAchievementSchema: z.ZodObject<
  {
    title: z.ZodString;
    issuer: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    achievedAt: z.ZodEffects<
      z.ZodEffects<
        z.ZodEffects<
          z.ZodOptional<z.ZodNullable<z.ZodString>>,
          string | null | undefined,
          string | null | undefined
        >,
        string | null | undefined,
        string | null | undefined
      >,
      string | null | undefined,
      string | null | undefined
    >;
    description: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    referenceUrl: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>,
      string | null | undefined,
      string | null | undefined
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    title: string;
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    achievedAt?: string | null | undefined;
    referenceUrl?: string | null | undefined;
  },
  {
    title: string;
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    achievedAt?: string | null | undefined;
    referenceUrl?: string | null | undefined;
  }
>;
export type CreateCandidateAchievementInput = z.infer<typeof candidateAchievementSchema>;
export declare const updateCandidateAchievementSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    issuer: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    achievedAt: z.ZodOptional<
      z.ZodEffects<
        z.ZodEffects<
          z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >,
          string | null | undefined,
          string | null | undefined
        >,
        string | null | undefined,
        string | null | undefined
      >
    >;
    description: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    referenceUrl: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    title?: string | undefined;
    achievedAt?: string | null | undefined;
    referenceUrl?: string | null | undefined;
  },
  {
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    title?: string | undefined;
    achievedAt?: string | null | undefined;
    referenceUrl?: string | null | undefined;
  }
>;
export type UpdateCandidateAchievementInput = z.infer<typeof updateCandidateAchievementSchema>;
export declare const reorderCandidateAchievementsSchema: z.ZodObject<
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
export type ReorderCandidateAchievementsInput = z.infer<typeof reorderCandidateAchievementsSchema>;
//# sourceMappingURL=candidate-achievements.d.ts.map
