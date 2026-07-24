import { Injectable } from '@nestjs/common';
import type {
  CandidateProfilePrivacyResult,
  CandidateDiscoverability,
  CandidateProfileSection,
  CandidateSectionVisibility,
} from '@nexthire/types';

export type ViewerContext =
  | 'OWNER'
  | 'PLATFORM_AUTHENTICATED'
  | 'LINK_HOLDER'
  | 'ANONYMOUS'
  | 'INTERNAL_SYSTEM'
  | 'COMPANY_VERIFIED';

@Injectable()
export class CandidatePrivacyDecisionService {
  canPlatformDiscoverCandidate(settings: CandidateProfilePrivacyResult): boolean {
    return settings.overallDiscoverability === 'PLATFORM_DISCOVERABLE';
  }

  canShareByLink(settings: CandidateProfilePrivacyResult): boolean {
    return (
      settings.overallDiscoverability === 'LINK_ONLY' ||
      settings.overallDiscoverability === 'PLATFORM_DISCOVERABLE'
    );
  }

  canExternalViewerReadSection(
    settings: CandidateProfilePrivacyResult,
    section: CandidateProfileSection,
    viewerContext: ViewerContext,
  ): boolean {
    if (viewerContext === 'OWNER') return true;
    if (viewerContext === 'INTERNAL_SYSTEM') return true;

    if (settings.overallDiscoverability === 'PRIVATE') return false;

    const sectionVisibility = settings.sections[section];
    if (!sectionVisibility) return false;

    if (sectionVisibility === 'HIDDEN') return false;

    if (viewerContext === 'ANONYMOUS') {
      return sectionVisibility === 'PUBLIC';
    }

    if (viewerContext === 'LINK_HOLDER') {
      return (
        settings.overallDiscoverability === 'LINK_ONLY' ||
        settings.overallDiscoverability === 'PLATFORM_DISCOVERABLE'
      );
    }

    if (viewerContext === 'PLATFORM_AUTHENTICATED') {
      return settings.overallDiscoverability === 'PLATFORM_DISCOVERABLE';
    }

    if (viewerContext === 'COMPANY_VERIFIED') {
      return settings.overallDiscoverability === 'PLATFORM_DISCOVERABLE';
    }

    return false;
  }

  isDiscoverabilityMode(value: string): value is CandidateDiscoverability {
    return ['PRIVATE', 'LINK_ONLY', 'PLATFORM_DISCOVERABLE'].includes(value);
  }

  isVisibilityMode(value: string): value is CandidateSectionVisibility {
    return ['HIDDEN', 'PLATFORM_ONLY', 'PUBLIC'].includes(value);
  }
}
