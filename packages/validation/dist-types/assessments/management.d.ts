import { z } from 'zod';
import {
  AssessmentQuestionType,
  AssessmentQuestionStatus,
  AssessmentDifficulty,
} from '@nexthire/types';
export declare const createAssessmentCategorySchema: z.ZodObject<
  {
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
  },
  'strict',
  z.ZodTypeAny,
  {
    name: string;
    slug: string;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  },
  {
    name: string;
    slug: string;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  }
>;
export declare const updateAssessmentCategorySchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
  },
  'strict',
  z.ZodTypeAny,
  {
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  },
  {
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  }
>;
export declare const reorderAssessmentCategoriesSchema: z.ZodObject<
  {
    categoryIds: z.ZodArray<z.ZodString, 'many'>;
  },
  'strict',
  z.ZodTypeAny,
  {
    categoryIds: string[];
  },
  {
    categoryIds: string[];
  }
>;
export declare const assessmentQuestionOptionSchema: z.ZodObject<
  {
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodString;
    isCorrect: z.ZodBoolean;
    sortOrder: z.ZodNumber;
  },
  'strict',
  z.ZodTypeAny,
  {
    label: string;
    sortOrder: number;
    isCorrect: boolean;
    id?: string | undefined;
  },
  {
    label: string;
    sortOrder: number;
    isCorrect: boolean;
    id?: string | undefined;
  }
>;
export declare const createAssessmentQuestionSchema: z.ZodEffects<
  z.ZodObject<
    {
      categoryId: z.ZodString;
      type: z.ZodNativeEnum<typeof AssessmentQuestionType>;
      difficulty: z.ZodNativeEnum<typeof AssessmentDifficulty>;
      prompt: z.ZodString;
      explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
      options: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              id: z.ZodOptional<z.ZodString>;
              label: z.ZodString;
              isCorrect: z.ZodBoolean;
              sortOrder: z.ZodNumber;
            },
            'strict',
            z.ZodTypeAny,
            {
              label: string;
              sortOrder: number;
              isCorrect: boolean;
              id?: string | undefined;
            },
            {
              label: string;
              sortOrder: number;
              isCorrect: boolean;
              id?: string | undefined;
            }
          >,
          'many'
        >
      >;
      acceptedAnswers: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      tags: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      sourceReference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
      estimatedSeconds: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
      status: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentQuestionStatus>>;
    },
    'strict',
    z.ZodTypeAny,
    {
      type: AssessmentQuestionType;
      difficulty: AssessmentDifficulty;
      categoryId: string;
      prompt: string;
      status?: AssessmentQuestionStatus | undefined;
      options?:
        | {
            label: string;
            sortOrder: number;
            isCorrect: boolean;
            id?: string | undefined;
          }[]
        | undefined;
      explanation?: string | null | undefined;
      acceptedAnswers?: string[] | undefined;
      tags?: string[] | undefined;
      sourceReference?: string | null | undefined;
      estimatedSeconds?: number | null | undefined;
    },
    {
      type: AssessmentQuestionType;
      difficulty: AssessmentDifficulty;
      categoryId: string;
      prompt: string;
      status?: AssessmentQuestionStatus | undefined;
      options?:
        | {
            label: string;
            sortOrder: number;
            isCorrect: boolean;
            id?: string | undefined;
          }[]
        | undefined;
      explanation?: string | null | undefined;
      acceptedAnswers?: string[] | undefined;
      tags?: string[] | undefined;
      sourceReference?: string | null | undefined;
      estimatedSeconds?: number | null | undefined;
    }
  >,
  {
    type: AssessmentQuestionType;
    difficulty: AssessmentDifficulty;
    categoryId: string;
    prompt: string;
    status?: AssessmentQuestionStatus | undefined;
    options?:
      | {
          label: string;
          sortOrder: number;
          isCorrect: boolean;
          id?: string | undefined;
        }[]
      | undefined;
    explanation?: string | null | undefined;
    acceptedAnswers?: string[] | undefined;
    tags?: string[] | undefined;
    sourceReference?: string | null | undefined;
    estimatedSeconds?: number | null | undefined;
  },
  {
    type: AssessmentQuestionType;
    difficulty: AssessmentDifficulty;
    categoryId: string;
    prompt: string;
    status?: AssessmentQuestionStatus | undefined;
    options?:
      | {
          label: string;
          sortOrder: number;
          isCorrect: boolean;
          id?: string | undefined;
        }[]
      | undefined;
    explanation?: string | null | undefined;
    acceptedAnswers?: string[] | undefined;
    tags?: string[] | undefined;
    sourceReference?: string | null | undefined;
    estimatedSeconds?: number | null | undefined;
  }
>;
export declare const updateAssessmentQuestionSchema: z.ZodObject<
  {
    categoryId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentQuestionType>>;
    difficulty: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentDifficulty>>;
    prompt: z.ZodOptional<z.ZodString>;
    explanation: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    options: z.ZodOptional<
      z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              id: z.ZodOptional<z.ZodString>;
              label: z.ZodString;
              isCorrect: z.ZodBoolean;
              sortOrder: z.ZodNumber;
            },
            'strict',
            z.ZodTypeAny,
            {
              label: string;
              sortOrder: number;
              isCorrect: boolean;
              id?: string | undefined;
            },
            {
              label: string;
              sortOrder: number;
              isCorrect: boolean;
              id?: string | undefined;
            }
          >,
          'many'
        >
      >
    >;
    acceptedAnswers: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>>;
    sourceReference: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    estimatedSeconds: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<typeof AssessmentQuestionStatus>>>;
  },
  'strict',
  z.ZodTypeAny,
  {
    status?: AssessmentQuestionStatus | undefined;
    options?:
      | {
          label: string;
          sortOrder: number;
          isCorrect: boolean;
          id?: string | undefined;
        }[]
      | undefined;
    type?: AssessmentQuestionType | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    categoryId?: string | undefined;
    prompt?: string | undefined;
    explanation?: string | null | undefined;
    acceptedAnswers?: string[] | undefined;
    tags?: string[] | undefined;
    sourceReference?: string | null | undefined;
    estimatedSeconds?: number | null | undefined;
  },
  {
    status?: AssessmentQuestionStatus | undefined;
    options?:
      | {
          label: string;
          sortOrder: number;
          isCorrect: boolean;
          id?: string | undefined;
        }[]
      | undefined;
    type?: AssessmentQuestionType | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    categoryId?: string | undefined;
    prompt?: string | undefined;
    explanation?: string | null | undefined;
    acceptedAnswers?: string[] | undefined;
    tags?: string[] | undefined;
    sourceReference?: string | null | undefined;
    estimatedSeconds?: number | null | undefined;
  }
>;
export declare const assessmentQuestionListQuerySchema: z.ZodObject<
  {
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentQuestionType>>;
    difficulty: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentDifficulty>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof AssessmentQuestionStatus>>;
    tag: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    status?: AssessmentQuestionStatus | undefined;
    type?: AssessmentQuestionType | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    categoryId?: string | undefined;
    tag?: string | undefined;
  },
  {
    status?: AssessmentQuestionStatus | undefined;
    type?: AssessmentQuestionType | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    difficulty?: AssessmentDifficulty | undefined;
    categoryId?: string | undefined;
    tag?: string | undefined;
  }
>;
//# sourceMappingURL=management.d.ts.map
