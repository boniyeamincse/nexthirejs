import { z } from 'zod';
import {
  COMPANY_LIMITS,
  COMPANY_DOCUMENT_TYPES,
  COMPANY_VERIFICATION_STATUSES,
  COMPANY_REJECTION_REASONS,
} from '@nexthire/constants';
import type { CompanyVerificationStatusValue } from '@nexthire/types';

/** Application lifecycle state machine — mirrors the expert-application transitions. */
export const COMPANY_APPLICATION_TRANSITIONS: Record<
  CompanyVerificationStatusValue,
  readonly CompanyVerificationStatusValue[]
> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  CHANGES_REQUESTED: ['SUBMITTED', 'WITHDRAWN'],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export const SUBMITTABLE_COMPANY_STATUSES: readonly CompanyVerificationStatusValue[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];
export const WITHDRAWABLE_COMPANY_STATUSES: readonly CompanyVerificationStatusValue[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
];
export const REVIEWABLE_COMPANY_STATUSES: readonly CompanyVerificationStatusValue[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
];
export const APPLICANT_EDITABLE_COMPANY_STATUSES: readonly CompanyVerificationStatusValue[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

export function canTransitionCompanyApplication(
  from: CompanyVerificationStatusValue,
  to: CompanyVerificationStatusValue,
): boolean {
  return (COMPANY_APPLICATION_TRANSITIONS[from] ?? []).includes(to);
}

export const submitCompanyApplicationSchema = z
  .object({
    applicantResponse: z.string().trim().max(COMPANY_LIMITS.MAX_APPLICANT_RESPONSE).optional(),
  })
  .strict();

export const approveCompanyApplicationSchema = z
  .object({
    reviewerNote: z.string().trim().max(COMPANY_LIMITS.MAX_REVIEW_NOTE).optional(),
  })
  .strict();

export const rejectCompanyApplicationSchema = z
  .object({
    reasonCode: z.enum(COMPANY_REJECTION_REASONS),
    reviewerNote: z
      .string()
      .trim()
      .min(1, 'A reviewer note is required when rejecting')
      .max(COMPANY_LIMITS.MAX_REVIEW_NOTE),
  })
  .strict();

export const requestChangesCompanyApplicationSchema = z
  .object({
    reviewerNote: z
      .string()
      .trim()
      .min(1, 'A reviewer note is required when requesting changes')
      .max(COMPANY_LIMITS.MAX_REVIEW_NOTE),
  })
  .strict();

export const uploadCompanyDocumentMetadataSchema = z
  .object({
    type: z.enum(COMPANY_DOCUMENT_TYPES),
  })
  .strict();

const coerceInt = (fallback: number, min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return fallback;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? fallback : parsed;
      }
      return val;
    })
    .pipe(z.number().int().min(min).max(max));

export const companyApplicationListQuerySchema = z.object({
  page: coerceInt(1, 1, 100000),
  pageSize: coerceInt(20, 1, 100),
  search: z.string().trim().max(200).optional(),
  status: z.enum(COMPANY_VERIFICATION_STATUSES).optional(),
  submittedFrom: z.string().datetime().optional(),
  submittedTo: z.string().datetime().optional(),
});
