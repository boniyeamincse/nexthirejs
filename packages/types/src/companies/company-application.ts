export type CompanyVerificationStatusValue =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type CompanyDocumentTypeValue =
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CERTIFICATE'
  | 'AUTHORIZATION_LETTER'
  | 'OTHER_SUPPORTING_DOCUMENT';

export interface CompanyApplicationDetail {
  id: string;
  companyId: string;
  status: CompanyVerificationStatusValue;
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
  createdAt: string;
  updatedAt: string;
}

export interface CompanyApplicationReadiness {
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

export interface CompanyVerificationDocumentResult {
  id: string;
  applicationId: string;
  type: CompanyDocumentTypeValue;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  uploadedAt: string;
  removedAt?: string | null;
}

export interface SubmitCompanyApplicationInput {
  applicantResponse?: string;
}

export interface ReviewCompanyApplicationInput {
  reasonCode: string;
  reviewerNote: string;
}

export interface CompanyApplicationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CompanyVerificationStatusValue;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface PaginatedCompanyApplicationResult {
  data: Array<{
    id: string;
    companyId: string;
    status: CompanyVerificationStatusValue;
    submissionVersion: number;
    submittedAt?: string | null;
    documentCount: number;
    company: {
      name: string;
      industry: string | null;
      headquartersCountryId: string;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CompanyApplicationReviewDetail extends CompanyApplicationDetail {
  applicant: {
    displayName: string;
    countryId: string;
  };
  company: CompanyProfileResultLike;
  documents: Array<
    CompanyVerificationDocumentResult & { signedUrl?: { url: string; expiresAt: string } }
  >;
}

/** Avoids a hard import cycle with company-profile.ts while keeping the shape aligned. */
interface CompanyProfileResultLike {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  headquartersCountryId: string;
  headquartersCity: string | null;
  description: string;
}
