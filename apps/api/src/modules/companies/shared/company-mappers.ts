/**
 * Pure mapping helpers converting Prisma records into API result DTOs.
 * These never expose storage keys, checksums, or reviewer-internal fields
 * that should not reach the wrong audience.
 */

import type {
  CompanyProfileResult,
  CompanyApplicationDetail,
  CompanyVerificationDocumentResult,
  CompanyVerificationStatusValue,
  CompanyDocumentTypeValue,
  CompanyMemberResult,
  CompanyMemberRoleValue,
  CompanyInvitationResult,
  CompanyInvitableRoleValue,
  CompanyInvitationStatusValue,
  MyCompanyInvitationResult,
} from '@nexthire/types';

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompanyProfile(record: any): CompanyProfileResult {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    name: record.name,
    legalName: record.legalName ?? null,
    website: record.website ?? null,
    industry: record.industry ?? null,
    companySize: record.companySize ?? null,
    headquartersCountryId: record.headquartersCountryId,
    headquartersCity: record.headquartersCity ?? null,
    description: record.description,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompanyMember(record: any): CompanyMemberResult {
  return {
    id: record.id,
    userId: record.userId,
    role: record.role as CompanyMemberRoleValue,
    displayName: record.user?.candidateProfile?.fullName ?? record.user?.email ?? 'Unknown',
    email: record.user?.email ?? '',
    joinedAt: record.joinedAt.toISOString(),
  };
}

export function mapCompanyInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any,
  invitedByDisplayName: string,
): CompanyInvitationResult {
  return {
    id: record.id,
    email: record.email,
    role: record.role as CompanyInvitableRoleValue,
    status: record.status as CompanyInvitationStatusValue,
    invitedByDisplayName,
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMyCompanyInvitation(record: any): MyCompanyInvitationResult {
  return {
    id: record.id,
    companyName: record.company.name,
    role: record.role as CompanyInvitableRoleValue,
    status: record.status as CompanyInvitationStatusValue,
    expiresAt: record.expiresAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompanyDocument(record: any): CompanyVerificationDocumentResult {
  return {
    id: record.id,
    applicationId: record.applicationId,
    type: record.type as CompanyDocumentTypeValue,
    originalFileName: record.originalFileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes.toString(),
    uploadedAt: record.uploadedAt.toISOString(),
    removedAt: iso(record.removedAt),
  };
}

export function mapCompanyApplicationDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any,
  options: { includeReviewerNote: boolean },
): CompanyApplicationDetail {
  return {
    id: record.id,
    companyId: record.companyId,
    status: record.status as CompanyVerificationStatusValue,
    submissionVersion: record.submissionVersion,
    submittedAt: iso(record.submittedAt),
    reviewStartedAt: iso(record.reviewStartedAt),
    reviewedAt: iso(record.reviewedAt),
    decisionReasonCode: record.decisionReasonCode ?? null,
    reviewerNote: options.includeReviewerNote ? (record.reviewerNote ?? null) : null,
    applicantResponse: record.applicantResponse ?? null,
    approvedAt: iso(record.approvedAt),
    rejectedAt: iso(record.rejectedAt),
    withdrawnAt: iso(record.withdrawnAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
