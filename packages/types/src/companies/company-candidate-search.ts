import type { PublicCandidateProfile } from '../candidates/candidate-public-profile.js';

export interface CompanyCandidateSearchQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  countryId?: string;
  skill?: string;
}

export interface CompanyCandidateSearchResultCard {
  candidateUserId: string;
  displayName: string;
  professionalHeadline: string | null;
  location: { city: string | null; countryName: string | null } | null;
  topSkills: string[];
}

export interface PaginatedCompanyCandidateSearchResult {
  data: CompanyCandidateSearchResultCard[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CompanyVisibleCvSummary {
  id: string;
  title: string;
  template: string;
  completionScore: number;
  updatedAt: string;
}

export interface CompanyCandidateDetail {
  profile: PublicCandidateProfile;
  publicCvs: CompanyVisibleCvSummary[];
}
