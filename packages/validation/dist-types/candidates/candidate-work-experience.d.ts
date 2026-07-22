import { z } from 'zod';
import { EmploymentType } from '@nexthire/types';
export declare const workExperienceRecordBaseSchema: z.ZodObject<
  {
    companyName: z.ZodString;
    jobTitle: z.ZodString;
    employmentType: z.ZodNativeEnum<typeof EmploymentType>;
    location: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    isRemote: z.ZodDefault<z.ZodBoolean>;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    currentlyWorking: z.ZodBoolean;
    endDate: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    responsibilities: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
    achievements: z.ZodEffects<
      z.ZodOptional<z.ZodNullable<z.ZodString>>,
      string | null | undefined,
      string | null | undefined
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    startDate: string;
    companyName: string;
    jobTitle: string;
    employmentType: EmploymentType;
    isRemote: boolean;
    currentlyWorking: boolean;
    endDate?: string | null | undefined;
    location?: string | null | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  },
  {
    startDate: string;
    companyName: string;
    jobTitle: string;
    employmentType: EmploymentType;
    currentlyWorking: boolean;
    endDate?: string | null | undefined;
    location?: string | null | undefined;
    isRemote?: boolean | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  }
>;
export declare const workExperienceRecordSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodEffects<
      z.ZodObject<
        {
          companyName: z.ZodString;
          jobTitle: z.ZodString;
          employmentType: z.ZodNativeEnum<typeof EmploymentType>;
          location: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
          isRemote: z.ZodDefault<z.ZodBoolean>;
          startDate: z.ZodEffects<z.ZodString, string, string>;
          currentlyWorking: z.ZodBoolean;
          endDate: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
          responsibilities: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
          achievements: z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >;
        },
        'strip',
        z.ZodTypeAny,
        {
          startDate: string;
          companyName: string;
          jobTitle: string;
          employmentType: EmploymentType;
          isRemote: boolean;
          currentlyWorking: boolean;
          endDate?: string | null | undefined;
          location?: string | null | undefined;
          responsibilities?: string | null | undefined;
          achievements?: string | null | undefined;
        },
        {
          startDate: string;
          companyName: string;
          jobTitle: string;
          employmentType: EmploymentType;
          currentlyWorking: boolean;
          endDate?: string | null | undefined;
          location?: string | null | undefined;
          isRemote?: boolean | undefined;
          responsibilities?: string | null | undefined;
          achievements?: string | null | undefined;
        }
      >,
      {
        startDate: string;
        companyName: string;
        jobTitle: string;
        employmentType: EmploymentType;
        isRemote: boolean;
        currentlyWorking: boolean;
        endDate?: string | null | undefined;
        location?: string | null | undefined;
        responsibilities?: string | null | undefined;
        achievements?: string | null | undefined;
      },
      {
        startDate: string;
        companyName: string;
        jobTitle: string;
        employmentType: EmploymentType;
        currentlyWorking: boolean;
        endDate?: string | null | undefined;
        location?: string | null | undefined;
        isRemote?: boolean | undefined;
        responsibilities?: string | null | undefined;
        achievements?: string | null | undefined;
      }
    >,
    {
      startDate: string;
      companyName: string;
      jobTitle: string;
      employmentType: EmploymentType;
      isRemote: boolean;
      currentlyWorking: boolean;
      endDate?: string | null | undefined;
      location?: string | null | undefined;
      responsibilities?: string | null | undefined;
      achievements?: string | null | undefined;
    },
    {
      startDate: string;
      companyName: string;
      jobTitle: string;
      employmentType: EmploymentType;
      currentlyWorking: boolean;
      endDate?: string | null | undefined;
      location?: string | null | undefined;
      isRemote?: boolean | undefined;
      responsibilities?: string | null | undefined;
      achievements?: string | null | undefined;
    }
  >,
  {
    startDate: string;
    companyName: string;
    jobTitle: string;
    employmentType: EmploymentType;
    isRemote: boolean;
    currentlyWorking: boolean;
    endDate?: string | null | undefined;
    location?: string | null | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  },
  {
    startDate: string;
    companyName: string;
    jobTitle: string;
    employmentType: EmploymentType;
    currentlyWorking: boolean;
    endDate?: string | null | undefined;
    location?: string | null | undefined;
    isRemote?: boolean | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  }
>;
export type CreateWorkExperienceRecordInput = z.infer<typeof workExperienceRecordSchema>;
export declare const updateWorkExperienceRecordSchema: z.ZodObject<
  {
    companyName: z.ZodOptional<z.ZodString>;
    jobTitle: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodOptional<z.ZodNativeEnum<typeof EmploymentType>>;
    location: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    isRemote: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    currentlyWorking: z.ZodOptional<z.ZodBoolean>;
    endDate: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    responsibilities: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    achievements: z.ZodOptional<
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
    startDate?: string | undefined;
    endDate?: string | null | undefined;
    companyName?: string | undefined;
    jobTitle?: string | undefined;
    employmentType?: EmploymentType | undefined;
    location?: string | null | undefined;
    isRemote?: boolean | undefined;
    currentlyWorking?: boolean | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  },
  {
    startDate?: string | undefined;
    endDate?: string | null | undefined;
    companyName?: string | undefined;
    jobTitle?: string | undefined;
    employmentType?: EmploymentType | undefined;
    location?: string | null | undefined;
    isRemote?: boolean | undefined;
    currentlyWorking?: boolean | undefined;
    responsibilities?: string | null | undefined;
    achievements?: string | null | undefined;
  }
>;
export type UpdateWorkExperienceRecordInput = z.infer<typeof updateWorkExperienceRecordSchema>;
export declare const reorderWorkExperienceRecordsSchema: z.ZodObject<
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
export type ReorderWorkExperienceRecordsInput = z.infer<typeof reorderWorkExperienceRecordsSchema>;
//# sourceMappingURL=candidate-work-experience.d.ts.map
