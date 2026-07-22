import { z } from 'zod';
import { AssessmentQuestionType, AssessmentQuestionStatus, AssessmentDifficulty } from '@nexthire/types';

export const createAssessmentCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().min(2).max(140).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateAssessmentCategorySchema = createAssessmentCategorySchema.partial().strict();

export const reorderAssessmentCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1),
}).strict();

export const assessmentQuestionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(1000),
  isCorrect: z.boolean(),
  sortOrder: z.number().int().min(0),
}).strict();

const assessmentQuestionBaseSchema = z.object({
  categoryId: z.string().uuid(),
  type: z.nativeEnum(AssessmentQuestionType),
  difficulty: z.nativeEnum(AssessmentDifficulty),
  prompt: z.string().trim().min(5).max(5000),
  explanation: z.string().trim().max(5000).nullable().optional(),
  options: z.array(assessmentQuestionOptionSchema).optional(),
  acceptedAnswers: z.array(z.string().trim().min(1).max(300)).max(10).optional(),
  tags: z.array(z.string().trim().min(2).max(50)).max(20).optional(),
  sourceReference: z.string().trim().max(300).nullable().optional(),
  estimatedSeconds: z.number().int().min(10).max(3600).nullable().optional(),
  status: z.nativeEnum(AssessmentQuestionStatus).optional(),
}).strict();

export const createAssessmentQuestionSchema = assessmentQuestionBaseSchema.superRefine((data, ctx) => {
  // Normalize tags: lowercase and unique
  if (data.tags) {
    const normalizedTags = data.tags.map(t => t.toLowerCase());
    const uniqueTags = new Set(normalizedTags);
    if (uniqueTags.size !== data.tags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tags must be unique (case-insensitive)',
        path: ['tags'],
      });
    }
  }

  // Option and Accepted Answer validation based on question type
  if (data.type === AssessmentQuestionType.SHORT_TEXT) {
    if (data.options && data.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SHORT_TEXT questions cannot have options',
        path: ['options'],
      });
    }
    if (!data.acceptedAnswers || data.acceptedAnswers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SHORT_TEXT questions must have at least one accepted answer',
        path: ['acceptedAnswers'],
      });
    }
  } else {
    // Other types must have options, no acceptedAnswers
    if (data.acceptedAnswers && data.acceptedAnswers.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only SHORT_TEXT questions can have acceptedAnswers',
        path: ['acceptedAnswers'],
      });
    }
    
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multiple choice/single choice/true false questions must have at least 2 options',
        path: ['options'],
      });
      return;
    }

    if (data.options.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 10 options allowed',
        path: ['options'],
      });
    }

    // Check duplicate option labels
    const optionLabels = data.options.map(o => o.label.toLowerCase());
    if (new Set(optionLabels).size !== optionLabels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Option labels must be unique (case-insensitive)',
        path: ['options'],
      });
    }

    // Check duplicate sort orders
    const optionSorts = data.options.map(o => o.sortOrder);
    if (new Set(optionSorts).size !== optionSorts.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Option sort orders must be unique',
        path: ['options'],
      });
    }

    const correctCount = data.options.filter(o => o.isCorrect).length;

    if (data.type === AssessmentQuestionType.SINGLE_CHOICE) {
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SINGLE_CHOICE questions must have exactly 1 correct option',
          path: ['options'],
        });
      }
    } else if (data.type === AssessmentQuestionType.MULTIPLE_CHOICE) {
      if (correctCount < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MULTIPLE_CHOICE questions must have at least 2 correct options',
          path: ['options'],
        });
      }
      if (correctCount === data.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MULTIPLE_CHOICE questions cannot have all options correct',
          path: ['options'],
        });
      }
    } else if (data.type === AssessmentQuestionType.TRUE_FALSE) {
      if (data.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TRUE_FALSE questions must have exactly 2 options',
          path: ['options'],
        });
      }
      
      const hasTrue = optionLabels.includes('true');
      const hasFalse = optionLabels.includes('false');
      
      if (!hasTrue || !hasFalse) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TRUE_FALSE options must be exactly "True" and "False"',
          path: ['options'],
        });
      }

      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TRUE_FALSE questions must have exactly 1 correct option',
          path: ['options'],
        });
      }
    }
  }
});

// Update schema can be a deep partial, but since the array of options replaces all options,
// we will validate the entire object if options/type are provided, or just make it completely identical
// with optional root keys.
export const updateAssessmentQuestionSchema = assessmentQuestionBaseSchema.partial().strict();

export const assessmentQuestionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  type: z.nativeEnum(AssessmentQuestionType).optional(),
  difficulty: z.nativeEnum(AssessmentDifficulty).optional(),
  status: z.nativeEnum(AssessmentQuestionStatus).optional(),
  tag: z.string().optional(),
});
