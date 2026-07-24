export interface CompanyProfileInput {
  name: string;
  legalName?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  headquartersCountryId: string;
  headquartersCity?: string | null;
  description: string;
}

export interface CompanyProfileResult {
  id: string;
  ownerUserId: string;
  name: string;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  headquartersCountryId: string;
  headquartersCity: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}
