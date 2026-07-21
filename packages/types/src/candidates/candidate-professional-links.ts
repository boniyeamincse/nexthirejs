export enum ProfessionalLinkType {
  LINKEDIN = 'LINKEDIN',
  GITHUB = 'GITHUB',
  PORTFOLIO = 'PORTFOLIO',
  PERSONAL_WEBSITE = 'PERSONAL_WEBSITE',
  BEHANCE = 'BEHANCE',
  DRIBBBLE = 'DRIBBBLE',
  STACK_OVERFLOW = 'STACK_OVERFLOW',
  MEDIUM = 'MEDIUM',
  YOUTUBE = 'YOUTUBE',
  OTHER = 'OTHER',
}

export interface CandidateProfessionalLinkResult {
  id: string;
  type: ProfessionalLinkType;
  label: string | null;
  url: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
