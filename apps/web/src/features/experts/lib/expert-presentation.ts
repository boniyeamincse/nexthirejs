import type {
  ExpertApplicationStatusValue,
  ExpertVerificationDocumentTypeValue,
} from '@nexthire/types';

/**
 * Presentation helpers for the expert verification feature.
 *
 * Status is NEVER conveyed by colour alone: every status carries an explicit
 * text label and a short glyph/word marker so it remains understandable to
 * users who cannot perceive colour.
 */

export interface StatusPresentation {
  label: string;
  /** Non-colour marker (text/symbol) shown alongside the label. */
  marker: string;
  description: string;
  tone: 'neutral' | 'info' | 'progress' | 'success' | 'danger' | 'warning';
}

export const APPLICATION_STATUS_PRESENTATION: Record<
  ExpertApplicationStatusValue,
  StatusPresentation
> = {
  DRAFT: {
    label: 'Draft',
    marker: '✎',
    description: 'You are still preparing this application. It has not been submitted.',
    tone: 'neutral',
  },
  SUBMITTED: {
    label: 'Submitted',
    marker: '›',
    description: 'Your application has been submitted and is awaiting a reviewer.',
    tone: 'info',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    marker: '⟳',
    description: 'A reviewer is currently evaluating your application.',
    tone: 'progress',
  },
  CHANGES_REQUESTED: {
    label: 'Changes requested',
    marker: '!',
    description: 'The reviewer needs updates before a decision can be made.',
    tone: 'warning',
  },
  APPROVED: {
    label: 'Approved',
    marker: '✓',
    description: 'Your application was approved. You now have the Expert role.',
    tone: 'success',
  },
  REJECTED: {
    label: 'Rejected',
    marker: '✕',
    description: 'Your application was not approved.',
    tone: 'danger',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    marker: '⊘',
    description: 'This application was withdrawn.',
    tone: 'neutral',
  },
};

/** Ordered lifecycle used to render the applicant timeline. */
export const APPLICATION_LIFECYCLE_ORDER: ExpertApplicationStatusValue[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
];

export const TERMINAL_STATUSES: ExpertApplicationStatusValue[] = [
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
];

export const EDITABLE_STATUSES: ExpertApplicationStatusValue[] = ['DRAFT', 'CHANGES_REQUESTED'];

export function isApplicationEditable(status: ExpertApplicationStatusValue): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function isApplicationTerminal(status: ExpertApplicationStatusValue): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export interface DocumentTypePresentation {
  label: string;
  description: string;
  /** True when at least one active document of this type is required to submit. */
  requiredForGovernmentId?: boolean;
  /** True when this type can satisfy the "professional proof" requirement. */
  satisfiesProfessionalProof?: boolean;
}

export const DOCUMENT_TYPE_PRESENTATION: Record<
  ExpertVerificationDocumentTypeValue,
  DocumentTypePresentation
> = {
  GOVERNMENT_ID: {
    label: 'Government-issued ID',
    description: 'A passport, national ID card, or driver’s licence confirming your identity.',
    requiredForGovernmentId: true,
  },
  PROFESSIONAL_CERTIFICATE: {
    label: 'Professional certificate',
    description: 'A recognised professional qualification or industry certification.',
    satisfiesProfessionalProof: true,
  },
  EMPLOYMENT_PROOF: {
    label: 'Proof of employment',
    description: 'An employment letter, contract, or pay statement confirming your role.',
    satisfiesProfessionalProof: true,
  },
  EDUCATION_CERTIFICATE: {
    label: 'Education certificate',
    description: 'A degree, diploma, or transcript from a recognised institution.',
    satisfiesProfessionalProof: true,
  },
  OTHER_SUPPORTING_DOCUMENT: {
    label: 'Other supporting document',
    description: 'Any additional document that strengthens your application.',
  },
};

export const PROFESSIONAL_PROOF_TYPES: ExpertVerificationDocumentTypeValue[] = [
  'PROFESSIONAL_CERTIFICATE',
  'EMPLOYMENT_PROOF',
  'EDUCATION_CERTIFICATE',
];

/**
 * Role codes that are permitted to review expert applications.
 *
 * Frontend route visibility is NOT authorization — the API is authoritative and
 * will return 403 for unauthorized reviewers. This gate only avoids showing
 * management UI to obviously ineligible users.
 */
export const EXPERT_REVIEWER_ROLE_CODES = [
  'admin',
  'super_admin',
  'platform_admin',
  'expert_reviewer',
  'expert_application_reviewer',
];

export function canReviewExpertApplications(roleCodes: string[] | undefined | null): boolean {
  if (!roleCodes) return false;
  return roleCodes.some((code) => EXPERT_REVIEWER_ROLE_CODES.includes(code));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number | string): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, exponent);
  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export const REJECTION_REASON_LABELS: Record<string, string> = {
  INSUFFICIENT_EXPERIENCE: 'Insufficient experience',
  INVALID_CREDENTIALS: 'Invalid or unverifiable credentials',
  DOCUMENT_QUALITY: 'Document quality or legibility issue',
  COMPLIANCE_ISSUE: 'Compliance or policy issue',
  OTHER: 'Other',
};
