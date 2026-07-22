import { z } from 'zod';
import { EducationLevel } from '@nexthire/types';

export const educationRecordBaseSchema = z.object({
  educationLevel: z.nativeEnum(EducationLevel),

  institutionName: z
    .string()
    .trim()
    .min(2, 'Institution name must be at least 2 characters')
    .max(200, 'Institution name must not exceed 200 characters'),

  qualification: z
    .string()
    .trim()
    .min(2, 'Qualification must be at least 2 characters')
    .max(150, 'Qualification must not exceed 150 characters'),

  fieldOfStudy: z
    .string()
    .trim()
    .max(150, 'Field of study must not exceed 150 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  startDate: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO date string' })
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return date <= new Date();
      },
      { message: 'Start date cannot be in the future' },
    ),

  currentlyStudying: z.boolean(),

  endDate: z
    .string()
    .datetime({ message: 'End date must be a valid ISO date string' })
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  grade: z
    .string()
    .trim()
    .max(100, 'Grade must not exceed 100 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

export const educationRecordSchema = educationRecordBaseSchema
  .refine(
    (data) => {
      if (!data.currentlyStudying && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date is required when not currently studying',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (!data.currentlyStudying && data.endDate) {
        return new Date(data.endDate) <= new Date();
      }
      return true;
    },
    {
      message: 'Historical end date cannot be in the future',
      path: ['endDate'],
    },
  );

export type CreateEducationRecordInput = z.infer<typeof educationRecordSchema>;

export const updateEducationRecordSchema = educationRecordBaseSchema.partial();
export type UpdateEducationRecordInput = z.infer<typeof updateEducationRecordSchema>;

export const reorderEducationRecordsSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderEducationRecordsInput = z.infer<typeof reorderEducationRecordsSchema>;
