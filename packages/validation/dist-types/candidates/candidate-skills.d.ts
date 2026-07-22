import { z } from 'zod';
import { SkillLevel } from '@nexthire/types';
export declare const candidateSkillSchema: z.ZodObject<
  {
    name: z.ZodString;
    level: z.ZodNativeEnum<typeof SkillLevel>;
    yearsOfExperience: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodNumber>>,
      number | null,
      number | null | undefined
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    level: SkillLevel;
    yearsOfExperience: number | null;
  },
  {
    name: string;
    level: SkillLevel;
    yearsOfExperience?: number | null | undefined;
  }
>;
export declare const updateCandidateSkillSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodNativeEnum<typeof SkillLevel>>;
    yearsOfExperience: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodNumber>>,
        number | null,
        number | null | undefined
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    name?: string | undefined;
    level?: SkillLevel | undefined;
    yearsOfExperience?: number | null | undefined;
  },
  {
    name?: string | undefined;
    level?: SkillLevel | undefined;
    yearsOfExperience?: number | null | undefined;
  }
>;
export declare const reorderCandidateSkillsSchema: z.ZodObject<
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
export type CreateCandidateSkillInput = z.infer<typeof candidateSkillSchema>;
export type UpdateCandidateSkillInput = z.infer<typeof updateCandidateSkillSchema>;
export type ReorderCandidateSkillsInput = z.infer<typeof reorderCandidateSkillsSchema>;
//# sourceMappingURL=candidate-skills.d.ts.map
