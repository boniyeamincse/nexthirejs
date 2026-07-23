import { z } from 'zod';
import { LessonProgressStatus } from '@nexthire/types';

export const updateLessonProgressSchema = z
  .object({
    status: z.nativeEnum(LessonProgressStatus),
    lastPositionSeconds: z.number().int().min(0).max(86400).optional(),
  })
  .strict();
