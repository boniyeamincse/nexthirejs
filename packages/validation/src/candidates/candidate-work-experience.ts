import { z } from 'zod';
import { EmploymentType } from '@nexthire/types';

export const workExperienceRecordBaseSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must not exceed 200 characters'),

  jobTitle: z
    .string()
    .trim()
    .min(2, 'Job title must be at least 2 characters')
    .max(150, 'Job title must not exceed 150 characters'),

  employmentType: z.nativeEnum(EmploymentType),

  location: z
    .string()
    .trim()
    .max(150, 'Location must not exceed 150 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  isRemote: z.boolean().default(false),

  startDate: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO date string' })
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return date <= new Date();
      },
      { message: 'Start date cannot be in the future' }
    ),

  currentlyWorking: z.boolean(),

  endDate: z
    .string()
    .datetime({ message: 'End date must be a valid ISO date string' })
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  responsibilities: z
    .string()
    .trim()
    .max(2000, 'Responsibilities must not exceed 2000 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),

  achievements: z
    .string()
    .trim()
    .max(2000, 'Achievements must not exceed 2000 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

export const workExperienceRecordSchema = workExperienceRecordBaseSchema
  .refine(
    (data) => {
      if (!data.currentlyWorking && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date is required when not currently working',
      path: ['endDate'],
    }
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
    }
  )
  .refine(
    (data) => {
      if (!data.currentlyWorking && data.endDate) {
        return new Date(data.endDate) <= new Date();
      }
      return true;
    },
    {
      message: 'Historical end date cannot be in the future',
      path: ['endDate'],
    }
  );

export type CreateWorkExperienceRecordInput = z.infer<typeof workExperienceRecordSchema>;

export const updateWorkExperienceRecordSchema = workExperienceRecordBaseSchema.partial();
export type UpdateWorkExperienceRecordInput = z.infer<typeof updateWorkExperienceRecordSchema>;

export const reorderWorkExperienceRecordsSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one ID must be provided')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate IDs are not allowed in reordering',
    }),
});

export type ReorderWorkExperienceRecordsInput = z.infer<typeof reorderWorkExperienceRecordsSchema>;
