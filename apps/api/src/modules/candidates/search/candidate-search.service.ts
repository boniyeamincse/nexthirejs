import { Injectable } from '@nestjs/common';
import { CandidateSearchRepository } from './candidate-search.repository';
import { CandidatePrivacyDecisionService } from '../privacy/candidate-privacy-decision.service';
import { CandidatePrivacyPolicyService } from '../privacy/candidate-privacy-policy.service';
import type {
  CompanyCandidateSearchQuery,
  CompanyCandidateSearchResultCard,
  PaginatedCompanyCandidateSearchResult,
} from '@nexthire/types';

@Injectable()
export class CandidateSearchService {
  constructor(
    private readonly repository: CandidateSearchRepository,
    private readonly decisionService: CandidatePrivacyDecisionService,
    private readonly policyService: CandidatePrivacyPolicyService,
  ) {}

  async search(
    query: Required<Pick<CompanyCandidateSearchQuery, 'page' | 'pageSize'>> &
      CompanyCandidateSearchQuery,
  ): Promise<PaginatedCompanyCandidateSearchResult> {
    const { total, rows } = await this.repository.search(query);

    const data: CompanyCandidateSearchResultCard[] = rows.map((row) => {
      const settings = row.profilePrivacy
        ? this.policyService.toResult(row.profilePrivacy)
        : this.policyService.getDefaultSettings();

      const locationVisible = this.decisionService.canExternalViewerReadSection(
        settings,
        'LOCATION_AND_PREFERENCES',
        'COMPANY_VERIFIED',
      );
      const skillsVisible = this.decisionService.canExternalViewerReadSection(
        settings,
        'SKILLS_AND_LANGUAGES',
        'COMPANY_VERIFIED',
      );

      return {
        candidateUserId: row.id,
        displayName: row.candidateProfile?.fullName ?? '',
        professionalHeadline: row.candidateProfile?.professionalHeadline ?? null,
        location: locationVisible
          ? {
              city: row.candidatePreference?.currentCity ?? null,
              countryName: row.candidatePreference?.country?.name ?? null,
            }
          : null,
        topSkills: skillsVisible ? row.skills.map((s) => s.name) : [],
      };
    });

    return {
      data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async isDiscoverable(candidateUserId: string): Promise<boolean> {
    const found = await this.repository.findDiscoverableById(candidateUserId);
    return found !== null;
  }
}
