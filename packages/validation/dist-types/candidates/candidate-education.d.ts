import { z } from 'zod';
import { EducationLevel } from '@nexthire/types';
export declare const educationRecordBaseSchema: z.ZodObject<
  {
    educationLevel: z.ZodNativeEnum<typeof EducationLevel>;
    institutionName: z.ZodString;
    qualification: z.ZodString;
    fieldOfStudy: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    currentlyStudying: z.ZodBoolean;
    endDate: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    grade: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
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
    educationLevel: EducationLevel;
    institutionName: string;
    qualification: string;
    startDate: string;
    currentlyStudying: boolean;
    fieldOfStudy?: string | null | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  },
  {
    educationLevel: EducationLevel;
    institutionName: string;
    qualification: string;
    startDate: string;
    currentlyStudying: boolean;
    fieldOfStudy?: string | null | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  }
>;
export declare const educationRecordSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodEffects<
      z.ZodObject<
        {
          educationLevel: z.ZodNativeEnum<typeof EducationLevel>;
          institutionName: z.ZodString;
          qualification: z.ZodString;
          fieldOfStudy: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
          startDate: z.ZodEffects<z.ZodString, string, string>;
          currentlyStudying: z.ZodBoolean;
          endDate: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
          grade: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
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
          educationLevel: EducationLevel;
          institutionName: string;
          qualification: string;
          startDate: string;
          currentlyStudying: boolean;
          fieldOfStudy?: string | null | undefined;
          endDate?: string | null | undefined;
          grade?: string | null | undefined;
          description?: string | null | undefined;
        },
        {
          educationLevel: EducationLevel;
          institutionName: string;
          qualification: string;
          startDate: string;
          currentlyStudying: boolean;
          fieldOfStudy?: string | null | undefined;
          endDate?: string | null | undefined;
          grade?: string | null | undefined;
          description?: string | null | undefined;
        }
      >,
      {
        educationLevel: EducationLevel;
        institutionName: string;
        qualification: string;
        startDate: string;
        currentlyStudying: boolean;
        fieldOfStudy?: string | null | undefined;
        endDate?: string | null | undefined;
        grade?: string | null | undefined;
        description?: string | null | undefined;
      },
      {
        educationLevel: EducationLevel;
        institutionName: string;
        qualification: string;
        startDate: string;
        currentlyStudying: boolean;
        fieldOfStudy?: string | null | undefined;
        endDate?: string | null | undefined;
        grade?: string | null | undefined;
        description?: string | null | undefined;
      }
    >,
    {
      educationLevel: EducationLevel;
      institutionName: string;
      qualification: string;
      startDate: string;
      currentlyStudying: boolean;
      fieldOfStudy?: string | null | undefined;
      endDate?: string | null | undefined;
      grade?: string | null | undefined;
      description?: string | null | undefined;
    },
    {
      educationLevel: EducationLevel;
      institutionName: string;
      qualification: string;
      startDate: string;
      currentlyStudying: boolean;
      fieldOfStudy?: string | null | undefined;
      endDate?: string | null | undefined;
      grade?: string | null | undefined;
      description?: string | null | undefined;
    }
  >,
  {
    educationLevel: EducationLevel;
    institutionName: string;
    qualification: string;
    startDate: string;
    currentlyStudying: boolean;
    fieldOfStudy?: string | null | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  },
  {
    educationLevel: EducationLevel;
    institutionName: string;
    qualification: string;
    startDate: string;
    currentlyStudying: boolean;
    fieldOfStudy?: string | null | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  }
>;
export type CreateEducationRecordInput = z.infer<typeof educationRecordSchema>;
export declare const updateEducationRecordSchema: z.ZodObject<
  {
    educationLevel: z.ZodOptional<z.ZodNativeEnum<typeof EducationLevel>>;
    institutionName: z.ZodOptional<z.ZodString>;
    qualification: z.ZodOptional<z.ZodString>;
    fieldOfStudy: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    currentlyStudying: z.ZodOptional<z.ZodBoolean>;
    endDate: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    grade: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
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
  },
  'strip',
  z.ZodTypeAny,
  {
    educationLevel?: EducationLevel | undefined;
    institutionName?: string | undefined;
    qualification?: string | undefined;
    fieldOfStudy?: string | null | undefined;
    startDate?: string | undefined;
    currentlyStudying?: boolean | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  },
  {
    educationLevel?: EducationLevel | undefined;
    institutionName?: string | undefined;
    qualification?: string | undefined;
    fieldOfStudy?: string | null | undefined;
    startDate?: string | undefined;
    currentlyStudying?: boolean | undefined;
    endDate?: string | null | undefined;
    grade?: string | null | undefined;
    description?: string | null | undefined;
  }
>;
export type UpdateEducationRecordInput = z.infer<typeof updateEducationRecordSchema>;
export declare const reorderEducationRecordsSchema: z.ZodObject<
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
export type ReorderEducationRecordsInput = z.infer<typeof reorderEducationRecordsSchema>;
//# sourceMappingURL=candidate-education.d.ts.map
