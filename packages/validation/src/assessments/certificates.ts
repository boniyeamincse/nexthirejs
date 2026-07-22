import { z } from 'zod';

export const AssessmentCertificateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
  status: z.string().optional(),
});

export const CertificateRetryInputSchema = z.object({}).strict();
