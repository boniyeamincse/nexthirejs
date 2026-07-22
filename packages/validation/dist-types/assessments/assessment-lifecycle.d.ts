import { z } from 'zod';
import { AssessmentStatus, AssessmentVisibility, AssessmentAvailability } from '@nexthire/types';
export declare const assessmentLifecycleSchema: z.ZodObject<
  {
    status: z.ZodNativeEnum<typeof AssessmentStatus>;
    visibility: z.ZodNativeEnum<typeof AssessmentVisibility>;
    availability: z.ZodNativeEnum<typeof AssessmentAvailability>;
    publishedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    questionCount: z.ZodOptional<z.ZodNumber>;
  },
  'strip',
  z.ZodTypeAny,
  {
    status: AssessmentStatus;
    availability: AssessmentAvailability;
    visibility: AssessmentVisibility;
    publishedAt?: string | null | undefined;
    questionCount?: number | undefined;
  },
  {
    status: AssessmentStatus;
    availability: AssessmentAvailability;
    visibility: AssessmentVisibility;
    publishedAt?: string | null | undefined;
    questionCount?: number | undefined;
  }
>;
export type AssessmentLifecycleInput = z.infer<typeof assessmentLifecycleSchema>;
//# sourceMappingURL=assessment-lifecycle.d.ts.map
