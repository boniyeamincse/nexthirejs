export type ExpertApplicationStatusValue =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type ExpertVerificationDocumentTypeValue =
  | 'GOVERNMENT_ID'
  | 'PROFESSIONAL_CERTIFICATE'
  | 'EMPLOYMENT_PROOF'
  | 'EDUCATION_CERTIFICATE'
  | 'OTHER_SUPPORTING_DOCUMENT';

export * from './expert-offerings.js';
export interface ExpertProfileInput {
  professionalTitle: string;
  professionalSummary: string;
  yearsOfExperience: number;
  currentCompany?: string | null;
  currentPosition?: string | null;
  highestEducation?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  personalWebsiteUrl?: string | null;
  interviewLanguages: string[];
  countryId: string;
  city?: string | null;
}

export interface ExpertProfileResult {
  id: string;
  userId: string;
  professionalTitle: string;
  professionalSummary: string;
  yearsOfExperience: number;
  currentCompany?: string | null;
  currentPosition?: string | null;
  highestEducation?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  personalWebsiteUrl?: string | null;
  interviewLanguages: string[];
  countryId: string;
  city?: string | null;
  profilePhotoFileId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertApplicationSummary {
  id: string;
  expertProfileId: string;
  status: ExpertApplicationStatusValue;
  submissionVersion: number;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertApplicationDetail {
  id: string;
  expertProfileId: string;
  status: ExpertApplicationStatusValue;
  submissionVersion: number;
  submittedAt?: string | null;
  reviewStartedAt?: string | null;
  reviewedAt?: string | null;
  decisionReasonCode?: string | null;
  reviewerNote?: string | null;
  applicantResponse?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
  readiness?: ExpertApplicationReadiness;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertApplicationReadiness {
  ready: boolean;
  blockers: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  summary: {
    profileComplete: boolean;
    requiredDocumentsPresent: boolean;
    mfaEnabled: boolean;
    documentCount: number;
  };
}

export interface ExpertVerificationDocumentResult {
  id: string;
  applicationId: string;
  type: ExpertVerificationDocumentTypeValue;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  uploadedAt: string;
  removedAt?: string | null;
}

export interface SubmitExpertApplicationInput {
  applicantResponse?: string;
}

export interface ReviewExpertApplicationInput {
  reasonCode: string;
  reviewerNote: string;
}

export interface ExpertApplicationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ExpertApplicationStatusValue;
  country?: string;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface PaginatedExpertApplicationResult {
  data: Array<{
    id: string;
    userId: string;
    expertProfileId: string;
    status: ExpertApplicationStatusValue;
    submissionVersion: number;
    submittedAt?: string | null;
    documentCount: number;
    profile: {
      professionalTitle: string;
      yearsOfExperience: number;
      countryId: string;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
