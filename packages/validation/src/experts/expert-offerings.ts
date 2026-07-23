import { z } from 'zod';
import {
  EXPERT_SERVICE_TYPES,
  EXPERT_SERVICE_ALLOWED_DURATIONS,
  EXPERT_EXPERTISE_LEVELS,
  EXPERT_AVAILABILITY_OVERRIDE_TYPES,
  EXPERT_OFFERING_LIMITS,
  SUPPORTED_CURRENCIES,
} from '@nexthire/constants';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const expertExpertiseItemSchema = z.object({
  expertiseAreaId: z.string().uuid('Invalid expertise area ID'),
  level: z.enum(EXPERT_EXPERTISE_LEVELS),
  yearsExperience: z
    .number()
    .int()
    .min(EXPERT_OFFERING_LIMITS.YEARS_EXPERIENCE_MIN)
    .max(EXPERT_OFFERING_LIMITS.YEARS_EXPERIENCE_MAX)
    .optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const expertExpertiseSchema = z
  .object({
    items: z
      .array(expertExpertiseItemSchema)
      .min(1, 'At least one expertise area is required')
      .max(
        EXPERT_OFFERING_LIMITS.MAX_EXPERTISE_AREAS,
        `Maximum ${EXPERT_OFFERING_LIMITS.MAX_EXPERTISE_AREAS} expertise areas allowed`,
      ),
  })
  .refine(
    (data) => {
      const primaryCount = data.items.filter((i) => i.isPrimary).length;
      return primaryCount <= EXPERT_OFFERING_LIMITS.MAX_PRIMARY_EXPERTISE;
    },
    {
      message: `Maximum ${EXPERT_OFFERING_LIMITS.MAX_PRIMARY_EXPERTISE} primary expertise areas allowed`,
      path: ['items'],
    },
  )
  .refine(
    (data) => {
      const ids = data.items.map((i) => i.expertiseAreaId);
      return new Set(ids).size === ids.length;
    },
    { message: 'Duplicate expertise areas are not allowed', path: ['items'] },
  );

export const moneyAmountSchema = z.object({
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'Amount must be a valid decimal number with up to 2 decimal places',
    ),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export const expertServiceSchema = z.object({
  expertiseAreaId: z.string().uuid('Invalid expertise area ID'),
  type: z.enum(EXPERT_SERVICE_TYPES),
  title: z
    .string()
    .trim()
    .min(EXPERT_OFFERING_LIMITS.SERVICE_TITLE_MIN)
    .max(EXPERT_OFFERING_LIMITS.SERVICE_TITLE_MAX),
  shortDescription: z
    .string()
    .trim()
    .min(EXPERT_OFFERING_LIMITS.SERVICE_SHORT_DESC_MIN)
    .max(EXPERT_OFFERING_LIMITS.SERVICE_SHORT_DESC_MAX),
  detailedDescription: z
    .string()
    .trim()
    .min(EXPERT_OFFERING_LIMITS.SERVICE_DETAILED_DESC_MIN)
    .max(EXPERT_OFFERING_LIMITS.SERVICE_DETAILED_DESC_MAX),
  durationMinutes: z
    .number()
    .int()
    .refine((v) => (EXPERT_SERVICE_ALLOWED_DURATIONS as readonly number[]).includes(v), {
      message: 'Duration must be 30, 35, or 40 minutes',
    }),
  price: moneyAmountSchema,
  languageCodes: z
    .array(z.string().min(2).max(10))
    .min(EXPERT_OFFERING_LIMITS.SERVICE_LANGUAGES_MIN, 'At least one language is required')
    .max(
      EXPERT_OFFERING_LIMITS.SERVICE_LANGUAGES_MAX,
      `Maximum ${EXPERT_OFFERING_LIMITS.SERVICE_LANGUAGES_MAX} languages allowed`,
    ),
  preparationInstructions: z
    .string()
    .max(EXPERT_OFFERING_LIMITS.SERVICE_PREP_INSTRUCTIONS_MAX)
    .optional()
    .nullable(),
});

export const expertAvailabilityProfileSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  bufferBeforeMinutes: z
    .number()
    .int()
    .min(EXPERT_OFFERING_LIMITS.BUFFER_MIN)
    .max(EXPERT_OFFERING_LIMITS.BUFFER_MAX)
    .default(0),
  bufferAfterMinutes: z
    .number()
    .int()
    .min(EXPERT_OFFERING_LIMITS.BUFFER_MIN)
    .max(EXPERT_OFFERING_LIMITS.BUFFER_MAX)
    .default(0),
  minimumNoticeHours: z
    .number()
    .int()
    .min(EXPERT_OFFERING_LIMITS.MINIMUM_NOTICE_HOURS_MIN)
    .max(EXPERT_OFFERING_LIMITS.MINIMUM_NOTICE_HOURS_MAX)
    .default(12),
  bookingWindowDays: z
    .number()
    .int()
    .min(EXPERT_OFFERING_LIMITS.BOOKING_WINDOW_DAYS_MIN)
    .max(EXPERT_OFFERING_LIMITS.BOOKING_WINDOW_DAYS_MAX)
    .default(30),
});

export const weeklyWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startLocalTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
    endLocalTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
  })
  .refine(
    (data) => {
      const [sh = 0, sm = 0] = data.startLocalTime.split(':').map(Number);
      const [eh = 0, em = 0] = data.endLocalTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return startMin < endMin;
    },
    { message: 'End time must be after start time', path: ['endLocalTime'] },
  );

export const expertWeeklyAvailabilitySchema = z
  .object({
    windows: z
      .array(weeklyWindowSchema)
      .max(
        EXPERT_OFFERING_LIMITS.WEEKLY_WINDOWS_MAX_TOTAL,
        `Maximum ${EXPERT_OFFERING_LIMITS.WEEKLY_WINDOWS_MAX_TOTAL} weekly windows allowed`,
      ),
  })
  .refine(
    (data) => {
      const perDay = new Map<number, number>();
      for (const w of data.windows) {
        perDay.set(w.dayOfWeek, (perDay.get(w.dayOfWeek) ?? 0) + 1);
      }
      return Array.from(perDay.values()).every(
        (count) => count <= EXPERT_OFFERING_LIMITS.WEEKLY_WINDOWS_MAX_PER_DAY,
      );
    },
    {
      message: `Maximum ${EXPERT_OFFERING_LIMITS.WEEKLY_WINDOWS_MAX_PER_DAY} windows per day allowed`,
      path: ['windows'],
    },
  )
  .refine(
    (data) => {
      for (const w of data.windows) {
        const [sh = 0, sm = 0] = w.startLocalTime.split(':').map(Number);
        const [eh = 0, em = 0] = w.endLocalTime.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (endMin - startMin < EXPERT_OFFERING_LIMITS.WEEKLY_WINDOW_MIN_MINUTES) return false;
      }
      return true;
    },
    {
      message: `Each window must be at least ${EXPERT_OFFERING_LIMITS.WEEKLY_WINDOW_MIN_MINUTES} minutes`,
      path: ['windows'],
    },
  );

export const overrideWindowSchema = z.object({
  startLocalTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
  endLocalTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
});

export const expertAvailabilityOverrideSchema = z
  .object({
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    type: z.enum(EXPERT_AVAILABILITY_OVERRIDE_TYPES),
    reason: z.string().max(300).optional().nullable(),
    windows: z.array(overrideWindowSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'UNAVAILABLE') return true;
      return (data.windows && data.windows.length >= 1) ?? false;
    },
    {
      message: 'CUSTOM_HOURS override must have at least one window',
      path: ['windows'],
    },
  );

export const serviceLifecycleActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'archive']),
});

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const expertAvailabilitySlotPreviewQuerySchema = z
  .object({
    from: z.string().regex(isoDateRegex, 'from must be in YYYY-MM-DD format'),
    to: z.string().regex(isoDateRegex, 'to must be in YYYY-MM-DD format'),
    durationMinutes: z.coerce
      .number()
      .int()
      .refine((v) => (EXPERT_SERVICE_ALLOWED_DURATIONS as readonly number[]).includes(v), {
        message: 'Duration must be 30, 35, or 40 minutes',
      })
      .default(30),
  })
  .refine((data) => data.from <= data.to, {
    message: 'from must not be after to',
    path: ['to'],
  })
  .refine(
    (data) => {
      const fromDate = new Date(`${data.from}T00:00:00Z`);
      const toDate = new Date(`${data.to}T00:00:00Z`);
      const rangeDays = (toDate.getTime() - fromDate.getTime()) / 86_400_000;
      return rangeDays <= EXPERT_OFFERING_LIMITS.SLOT_PREVIEW_MAX_RANGE_DAYS;
    },
    {
      message: `Preview range must not exceed ${EXPERT_OFFERING_LIMITS.SLOT_PREVIEW_MAX_RANGE_DAYS} days`,
      path: ['to'],
    },
  );
