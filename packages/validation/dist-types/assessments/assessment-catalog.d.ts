import { z } from 'zod';
import {
  AssessmentStatus,
  AssessmentType,
  AssessmentDifficulty,
  AssessmentAvailability,
} from '@nexthire/types';
export declare const assessmentCatalogQuerySchema: z.ZodObject<
  {
    page: z.ZodPipeline<
      z.ZodEffects<
        z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>,
        number,
        string | number | undefined
      >,
      z.ZodNumber
    >;
    pageSize: z.ZodPipeline<
      z.ZodEffects<
        z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>,
        number,
        string | number | undefined
      >,
      z.ZodNumber
    >;
    search: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    category: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentType>>;
    difficulty: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentDifficulty>>;
    availability: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentAvailability>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    page: number;
    pageSize: number;
    type?: AssessmentType | undefined;
    search?: string | undefined;
    category?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
  },
  {
    type?: AssessmentType | undefined;
    page?: string | number | undefined;
    pageSize?: string | number | undefined;
    search?: string | undefined;
    category?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
  }
>;
export type AssessmentCatalogQueryInput = z.infer<typeof assessmentCatalogQuerySchema>;
export interface ValidTransition {
  from: AssessmentStatus;
  to: AssessmentStatus;
}
export declare const VALID_TRANSITIONS: ValidTransition[];
export declare function isValidTransition(from: string, to: string): boolean;
export declare const transitionSchema: z.ZodEffects<
  z.ZodObject<
    {
      from: z.ZodString;
      to: z.ZodString;
    },
    'strip',
    z.ZodTypeAny,
    {
      from: string;
      to: string;
    },
    {
      from: string;
      to: string;
    }
  >,
  {
    from: string;
    to: string;
  },
  {
    from: string;
    to: string;
  }
>;
//# sourceMappingURL=assessment-catalog.d.ts.map
