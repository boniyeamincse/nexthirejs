import { z } from 'zod';
import { WorkMode, EmploymentType } from '@nexthire/types';
export declare const candidatePreferenceSchema: z.ZodObject<
  {
    countryCode: z.ZodString;
    currentCity: z.ZodString;
    preferredJobRoles: z.ZodEffects<
      z.ZodEffects<z.ZodArray<z.ZodString, 'many'>, string[], string[]>,
      string[],
      string[]
    >;
    preferredWorkModes: z.ZodEffects<
      z.ZodArray<z.ZodNativeEnum<typeof WorkMode>, 'many'>,
      WorkMode[],
      WorkMode[]
    >;
    preferredEmploymentTypes: z.ZodEffects<
      z.ZodArray<z.ZodNativeEnum<typeof EmploymentType>, 'many'>,
      EmploymentType[],
      EmploymentType[]
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    countryCode: string;
    currentCity: string;
    preferredJobRoles: string[];
    preferredWorkModes: WorkMode[];
    preferredEmploymentTypes: EmploymentType[];
  },
  {
    countryCode: string;
    currentCity: string;
    preferredJobRoles: string[];
    preferredWorkModes: WorkMode[];
    preferredEmploymentTypes: EmploymentType[];
  }
>;
export type CandidatePreferenceInput = z.infer<typeof candidatePreferenceSchema>;
//# sourceMappingURL=candidate-preferences.d.ts.map
