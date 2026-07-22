import { z } from 'zod';
export declare const candidateProfessionalLinkSchema: z.ZodObject<
  {
    type: z.ZodEnum<
      [
        'LINKEDIN',
        'GITHUB',
        'PORTFOLIO',
        'PERSONAL_WEBSITE',
        'BEHANCE',
        'DRIBBBLE',
        'STACK_OVERFLOW',
        'MEDIUM',
        'YOUTUBE',
        'OTHER',
      ]
    >;
    label: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    url: z.ZodEffects<z.ZodString, string, string>;
  },
  'strip',
  z.ZodTypeAny,
  {
    type:
      | 'OTHER'
      | 'LINKEDIN'
      | 'GITHUB'
      | 'PORTFOLIO'
      | 'PERSONAL_WEBSITE'
      | 'BEHANCE'
      | 'DRIBBBLE'
      | 'STACK_OVERFLOW'
      | 'MEDIUM'
      | 'YOUTUBE';
    url: string;
    label?: string | null | undefined;
  },
  {
    type:
      | 'OTHER'
      | 'LINKEDIN'
      | 'GITHUB'
      | 'PORTFOLIO'
      | 'PERSONAL_WEBSITE'
      | 'BEHANCE'
      | 'DRIBBBLE'
      | 'STACK_OVERFLOW'
      | 'MEDIUM'
      | 'YOUTUBE';
    url: string;
    label?: string | null | undefined;
  }
>;
export type CreateCandidateProfessionalLinkInput = z.infer<typeof candidateProfessionalLinkSchema>;
export declare const updateCandidateProfessionalLinkSchema: z.ZodObject<
  {
    type: z.ZodOptional<
      z.ZodEnum<
        [
          'LINKEDIN',
          'GITHUB',
          'PORTFOLIO',
          'PERSONAL_WEBSITE',
          'BEHANCE',
          'DRIBBBLE',
          'STACK_OVERFLOW',
          'MEDIUM',
          'YOUTUBE',
          'OTHER',
        ]
      >
    >;
    label: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    url: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    type?:
      | 'OTHER'
      | 'LINKEDIN'
      | 'GITHUB'
      | 'PORTFOLIO'
      | 'PERSONAL_WEBSITE'
      | 'BEHANCE'
      | 'DRIBBBLE'
      | 'STACK_OVERFLOW'
      | 'MEDIUM'
      | 'YOUTUBE'
      | undefined;
    label?: string | null | undefined;
    url?: string | undefined;
  },
  {
    type?:
      | 'OTHER'
      | 'LINKEDIN'
      | 'GITHUB'
      | 'PORTFOLIO'
      | 'PERSONAL_WEBSITE'
      | 'BEHANCE'
      | 'DRIBBBLE'
      | 'STACK_OVERFLOW'
      | 'MEDIUM'
      | 'YOUTUBE'
      | undefined;
    label?: string | null | undefined;
    url?: string | undefined;
  }
>;
export type UpdateCandidateProfessionalLinkInput = z.infer<
  typeof updateCandidateProfessionalLinkSchema
>;
export declare const reorderCandidateProfessionalLinksSchema: z.ZodObject<
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
export type ReorderCandidateProfessionalLinksInput = z.infer<
  typeof reorderCandidateProfessionalLinksSchema
>;
//# sourceMappingURL=candidate-professional-links.d.ts.map
