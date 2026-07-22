import { z } from 'zod';
import {
  AssessmentType,
  AssessmentDifficulty,
  AssessmentVisibility,
  AssessmentAvailability,
} from '@nexthire/types';
export declare const createAssessmentSchema: z.ZodObject<
  {
    categoryId: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    shortDescription: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    instructions: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodNativeEnum<typeof AssessmentType>;
    difficulty: z.ZodNativeEnum<typeof AssessmentDifficulty>;
    visibility: z.ZodNativeEnum<typeof AssessmentVisibility>;
    availability: z.ZodNativeEnum<typeof AssessmentAvailability>;
    estimatedDurationMinutes: z.ZodNumber;
    passingScorePercentage: z.ZodOptional<z.ZodNumber>;
    maximumAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
  },
  'strict',
  z.ZodTypeAny,
  {
    type: AssessmentType;
    title: string;
    difficulty: AssessmentDifficulty;
    availability: AssessmentAvailability;
    visibility: AssessmentVisibility;
    slug: string;
    categoryId: string;
    shortDescription: string;
    estimatedDurationMinutes: number;
    description?: string | null | undefined;
    instructions?: string | null | undefined;
    passingScorePercentage?: number | undefined;
    maximumAttempts?: number | null | undefined;
  },
  {
    type: AssessmentType;
    title: string;
    difficulty: AssessmentDifficulty;
    availability: AssessmentAvailability;
    visibility: AssessmentVisibility;
    slug: string;
    categoryId: string;
    shortDescription: string;
    estimatedDurationMinutes: number;
    description?: string | null | undefined;
    instructions?: string | null | undefined;
    passingScorePercentage?: number | undefined;
    maximumAttempts?: number | null | undefined;
  }
>;
export declare const updateAssessmentSchema: z.ZodObject<
  {
    categoryId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    instructions: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentType>>;
    difficulty: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentDifficulty>>;
    visibility: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentVisibility>>;
    availability: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentAvailability>>;
    estimatedDurationMinutes: z.ZodOptional<z.ZodNumber>;
    passingScorePercentage: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    maximumAttempts: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
  },
  'strict',
  z.ZodTypeAny,
  {
    type?: AssessmentType | undefined;
    description?: string | null | undefined;
    title?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
    visibility?: AssessmentVisibility | undefined;
    slug?: string | undefined;
    categoryId?: string | undefined;
    shortDescription?: string | undefined;
    instructions?: string | null | undefined;
    estimatedDurationMinutes?: number | undefined;
    passingScorePercentage?: number | undefined;
    maximumAttempts?: number | null | undefined;
  },
  {
    type?: AssessmentType | undefined;
    description?: string | null | undefined;
    title?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
    visibility?: AssessmentVisibility | undefined;
    slug?: string | undefined;
    categoryId?: string | undefined;
    shortDescription?: string | undefined;
    instructions?: string | null | undefined;
    estimatedDurationMinutes?: number | undefined;
    passingScorePercentage?: number | undefined;
    maximumAttempts?: number | null | undefined;
  }
>;
export declare const createAssessmentSectionSchema: z.ZodObject<
  {
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    instructions: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
  },
  'strict',
  z.ZodTypeAny,
  {
    title: string;
    description?: string | null | undefined;
    instructions?: string | null | undefined;
    isRequired?: boolean | undefined;
  },
  {
    title: string;
    description?: string | null | undefined;
    instructions?: string | null | undefined;
    isRequired?: boolean | undefined;
  }
>;
export declare const updateAssessmentSectionSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    instructions: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    isRequired: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
  },
  'strict',
  z.ZodTypeAny,
  {
    description?: string | null | undefined;
    title?: string | undefined;
    instructions?: string | null | undefined;
    isRequired?: boolean | undefined;
  },
  {
    description?: string | null | undefined;
    title?: string | undefined;
    instructions?: string | null | undefined;
    isRequired?: boolean | undefined;
  }
>;
export declare const reorderAssessmentSectionsSchema: z.ZodObject<
  {
    orderedIds: z.ZodArray<z.ZodString, 'many'>;
  },
  'strict',
  z.ZodTypeAny,
  {
    orderedIds: string[];
  },
  {
    orderedIds: string[];
  }
>;
export declare const assignAssessmentQuestionsSchema: z.ZodObject<
  {
    sectionId: z.ZodString;
    questionIds: z.ZodArray<z.ZodString, 'many'>;
    points: z.ZodNumber;
    isRequired: z.ZodOptional<z.ZodBoolean>;
  },
  'strict',
  z.ZodTypeAny,
  {
    sectionId: string;
    questionIds: string[];
    points: number;
    isRequired?: boolean | undefined;
  },
  {
    sectionId: string;
    questionIds: string[];
    points: number;
    isRequired?: boolean | undefined;
  }
>;
export declare const updateAssessmentQuestionAssignmentSchema: z.ZodObject<
  {
    sectionId: z.ZodOptional<z.ZodString>;
    points: z.ZodOptional<z.ZodNumber>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
  },
  'strict',
  z.ZodTypeAny,
  {
    isRequired?: boolean | undefined;
    sectionId?: string | undefined;
    points?: number | undefined;
  },
  {
    isRequired?: boolean | undefined;
    sectionId?: string | undefined;
    points?: number | undefined;
  }
>;
export declare const reorderAssessmentSectionQuestionsSchema: z.ZodObject<
  {
    orderedIds: z.ZodArray<z.ZodString, 'many'>;
  },
  'strict',
  z.ZodTypeAny,
  {
    orderedIds: string[];
  },
  {
    orderedIds: string[];
  }
>;
export declare const assessmentListQuerySchema: z.ZodObject<
  {
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentType>>;
    difficulty: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentDifficulty>>;
    visibility: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentVisibility>>;
    availability: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentAvailability>>;
    status: z.ZodOptional<z.ZodEnum<['DRAFT', 'PUBLISHED', 'ARCHIVED', 'RETIRED']>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'RETIRED' | undefined;
    type?: AssessmentType | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
    visibility?: AssessmentVisibility | undefined;
    categoryId?: string | undefined;
  },
  {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'RETIRED' | undefined;
    type?: AssessmentType | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    availability?: AssessmentAvailability | undefined;
    visibility?: AssessmentVisibility | undefined;
    categoryId?: string | undefined;
  }
>;
//# sourceMappingURL=authoring.d.ts.map
