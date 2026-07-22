/**
 * Pure mapping helpers converting Prisma records into API result DTOs.
 * These never expose storage keys, checksums or reviewer-internal fields that
 * should not reach the wrong audience.
 */

import type {
  ExpertProfileResult,
  ExpertApplicationDetail,
  ExpertApplicationSummary,
  ExpertVerificationDocumentResult,
  ExpertApplicationStatusValue,
  ExpertVerificationDocumentTypeValue,
} from '@nexthire/types';

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProfile(record: any): ExpertProfileResult {
  return {
    id: record.id,
    userId: record.userId,
    professionalTitle: record.professionalTitle,
    professionalSummary: record.professionalSummary,
    yearsOfExperience: record.yearsOfExperience,
    currentCompany: record.currentCompany,
    currentPosition: record.currentPosition,
    highestEducation: record.highestEducation,
    linkedinUrl: record.linkedinUrl,
    portfolioUrl: record.portfolioUrl,
    personalWebsiteUrl: record.personalWebsiteUrl,
    interviewLanguages: (record.interviewLanguages as string[]) ?? [],
    countryId: record.countryId,
    city: record.city,
    profilePhotoFileId: record.profilePhotoFileId ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDocument(record: any): ExpertVerificationDocumentResult {
  return {
    id: record.id,
    applicationId: record.applicationId,
    type: record.type as ExpertVerificationDocumentTypeValue,
    originalFileName: record.originalFileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes.toString(),
    uploadedAt: record.uploadedAt.toISOString(),
    removedAt: iso(record.removedAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApplicationSummary(record: any): ExpertApplicationSummary {
  return {
    id: record.id,
    expertProfileId: record.expertProfileId,
    status: record.status as ExpertApplicationStatusValue,
    submissionVersion: record.submissionVersion,
    submittedAt: iso(record.submittedAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Maps a full application. `includeReviewerNote` controls whether the internal
 * reviewer note is surfaced (applicants may see it only after a decision, which
 * the caller decides).
 */
export function mapApplicationDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any,
  options: { includeReviewerNote: boolean },
): ExpertApplicationDetail {
  return {
    id: record.id,
    expertProfileId: record.expertProfileId,
    status: record.status as ExpertApplicationStatusValue,
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
