import { z } from 'zod';
import { LanguageProficiency } from '@nexthire/types';
export declare const candidateLanguageSchema: z.ZodObject<
  {
    name: z.ZodString;
    speaking: z.ZodNativeEnum<typeof LanguageProficiency>;
    reading: z.ZodNativeEnum<typeof LanguageProficiency>;
    writing: z.ZodNativeEnum<typeof LanguageProficiency>;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    speaking: LanguageProficiency;
    reading: LanguageProficiency;
    writing: LanguageProficiency;
  },
  {
    name: string;
    speaking: LanguageProficiency;
    reading: LanguageProficiency;
    writing: LanguageProficiency;
  }
>;
export declare const updateCandidateLanguageSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    speaking: z.ZodOptional<z.ZodNativeEnum<typeof LanguageProficiency>>;
    reading: z.ZodOptional<z.ZodNativeEnum<typeof LanguageProficiency>>;
    writing: z.ZodOptional<z.ZodNativeEnum<typeof LanguageProficiency>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    name?: string | undefined;
    speaking?: LanguageProficiency | undefined;
    reading?: LanguageProficiency | undefined;
    writing?: LanguageProficiency | undefined;
  },
  {
    name?: string | undefined;
    speaking?: LanguageProficiency | undefined;
    reading?: LanguageProficiency | undefined;
    writing?: LanguageProficiency | undefined;
  }
>;
export declare const reorderCandidateLanguagesSchema: z.ZodObject<
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
export type CreateCandidateLanguageInput = z.infer<typeof candidateLanguageSchema>;
export type UpdateCandidateLanguageInput = z.infer<typeof updateCandidateLanguageSchema>;
export type ReorderCandidateLanguagesInput = z.infer<typeof reorderCandidateLanguagesSchema>;
//# sourceMappingURL=candidate-languages.d.ts.map
