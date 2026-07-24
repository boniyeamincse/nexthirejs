export type CompanyMemberRoleValue = 'OWNER' | 'ADMIN' | 'RECRUITER' | 'VIEWER';

export type CompanyInvitableRoleValue = Exclude<CompanyMemberRoleValue, 'OWNER'>;

export type CompanyInvitationStatusValue =
  'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED' | 'EXPIRED';

export interface CompanyMemberResult {
  id: string;
  userId: string;
  role: CompanyMemberRoleValue;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface CompanyInvitationResult {
  id: string;
  email: string;
  role: CompanyInvitableRoleValue;
  status: CompanyInvitationStatusValue;
  invitedByDisplayName: string;
  expiresAt: string;
  createdAt: string;
}

export interface MyCompanyInvitationResult {
  id: string;
  companyName: string;
  role: CompanyInvitableRoleValue;
  status: CompanyInvitationStatusValue;
  expiresAt: string;
}

export interface CreateCompanyInvitationInput {
  email: string;
  role: CompanyInvitableRoleValue;
}

export interface UpdateCompanyMemberRoleInput {
  role: CompanyInvitableRoleValue;
}

export interface MyCompanyTeamRoleResult {
  role: CompanyMemberRoleValue | null;
}
