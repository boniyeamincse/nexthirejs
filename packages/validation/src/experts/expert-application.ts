/**
 * Expert Application Validation
 *
 * Schemas for application lifecycle actions, reviewer decisions, document
 * upload metadata and the admin queue query.
 */

import { z } from 'zod';
import {
  EXPERT_LIMITS,
  EXPERT_DOCUMENT_TYPES,
  EXPERT_APPLICATION_STATUSES,
  EXPERT_REJECTION_REASONS,
} from '@nexthire/constants';
import type { ExpertApplicationStatusValue } from '@nexthire/types';

/**
 * Application lifecycle state machine.
 *
 * A single source of truth for which transitions are legal. Services enforce
 * these when acting on an application so the applicant and reviewer flows can
 * never diverge, and the transitions are unit-tested independently.
 */
export const EXPERT_APPLICATION_TRANSITIONS: Record<
  ExpertApplicationStatusValue,
  readonly ExpertApplicationStatusValue[]
> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  CHANGES_REQUESTED: ['SUBMITTED', 'WITHDRAWN'],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** Statuses from which an applicant may (re)submit. */
export const SUBMITTABLE_STATUSES: readonly ExpertApplicationStatusValue[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

/** Statuses from which an applicant may withdraw. */
export const WITHDRAWABLE_STATUSES: readonly ExpertApplicationStatusValue[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
];

/** Statuses a reviewer may act on. */
export const REVIEWABLE_STATUSES: readonly ExpertApplicationStatusValue[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
];

/** Statuses in which the applicant may still edit the profile/documents. */
export const APPLICANT_EDITABLE_STATUSES: readonly ExpertApplicationStatusValue[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

/** Absorbing / final statuses that permit no further transitions. */
export const TERMINAL_STATUSES: readonly ExpertApplicationStatusValue[] = [
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
];

/** True when `to` is a legal next status from `from`. */
export function canTransitionExpertApplication(
  from: ExpertApplicationStatusValue,
  to: ExpertApplicationStatusValue,
): boolean {
  return (EXPERT_APPLICATION_TRANSITIONS[from] ?? []).includes(to);
}

export const isSubmittableStatus = (s: ExpertApplicationStatusValue): boolean =>
  SUBMITTABLE_STATUSES.includes(s);
export const isWithdrawableStatus = (s: ExpertApplicationStatusValue): boolean =>
  WITHDRAWABLE_STATUSES.includes(s);
export const isReviewableStatus = (s: ExpertApplicationStatusValue): boolean =>
  REVIEWABLE_STATUSES.includes(s);
export const isApplicantEditableStatus = (s: ExpertApplicationStatusValue): boolean =>
  APPLICANT_EDITABLE_STATUSES.includes(s);
export const isTerminalStatus = (s: ExpertApplicationStatusValue): boolean =>
  TERMINAL_STATUSES.includes(s);

/** Applicant submits their application for review. */
export const submitExpertApplicationSchema = z
  .object({
    applicantResponse: z.string().trim().max(EXPERT_LIMITS.MAX_APPLICANT_RESPONSE).optional(),
  })
  .strict();
export type SubmitExpertApplicationSchemaInput = z.infer<typeof submitExpertApplicationSchema>;

/** Reviewer approves an application (optional congratulatory note). */
export const approveExpertApplicationSchema = z
  .object({
    reviewerNote: z.string().trim().max(EXPERT_LIMITS.MAX_REVIEW_NOTE).optional(),
  })
  .strict();
export type ApproveExpertApplicationSchemaInput = z.infer<typeof approveExpertApplicationSchema>;

/** Reviewer rejects an application; reason code + note are mandatory. */
export const rejectExpertApplicationSchema = z
  .object({
    reasonCode: z.enum([...EXPERT_REJECTION_REASONS] as [string, ...string[]]),
    reviewerNote: z
      .string()
      .trim()
      .min(1, 'A reviewer note is required when rejecting')
      .max(EXPERT_LIMITS.MAX_REVIEW_NOTE),
  })
  .strict();
export type RejectExpertApplicationSchemaInput = z.infer<typeof rejectExpertApplicationSchema>;

/** Reviewer requests changes; note explaining required changes is mandatory. */
export const requestChangesExpertApplicationSchema = z
  .object({
    reviewerNote: z
      .string()
      .trim()
      .min(1, 'A reviewer note is required when requesting changes')
      .max(EXPERT_LIMITS.MAX_REVIEW_NOTE),
  })
  .strict();
export type RequestChangesExpertApplicationSchemaInput = z.infer<
  typeof requestChangesExpertApplicationSchema
>;

/** Metadata accompanying a verification document upload (multipart field). */
export const uploadDocumentMetadataSchema = z
  .object({
    type: z.enum([...EXPERT_DOCUMENT_TYPES] as [string, ...string[]]),
  })
  .strict();
export type UploadDocumentMetadataSchemaInput = z.infer<typeof uploadDocumentMetadataSchema>;

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

/** Admin queue query parameters. */
export const expertApplicationListQuerySchema = z.object({
  page: coerceInt(1, 1, 100000),
  pageSize: coerceInt(20, 1, 100),
  search: z.string().trim().max(200).optional(),
  status: z.enum([...EXPERT_APPLICATION_STATUSES] as [string, ...string[]]).optional(),
  country: z.string().trim().max(64).optional(),
  submittedFrom: z.string().datetime().optional(),
  submittedTo: z.string().datetime().optional(),
});
export type ExpertApplicationListQuerySchemaInput = z.infer<
  typeof expertApplicationListQuerySchema
>;
