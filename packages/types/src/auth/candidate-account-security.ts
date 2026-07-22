export interface CandidateAccountSecuritySummary {
  email: string;
  accountStatus: 'ACTIVE';
  emailVerified: boolean;
  activeSessionCount: number;
  currentSessionCreatedAt: string;
  currentSessionLastUsedAt: string | null;
  passwordLastChangedAt: string | null;
  securityLinks: {
    sessions: string;
    privacy: string;
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  changed: boolean;
  revokedOtherSessionCount: number;
}
