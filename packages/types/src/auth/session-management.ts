export interface UserSessionSummary {
  id: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'COMPROMISED';
  device: {
    browser?: string;
    operatingSystem?: string;
    deviceType?: string;
  };
  ipAddressMasked?: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface SessionListResult {
  sessions: UserSessionSummary[];
}

export interface RevokeSessionResult {
  message: string;
}

export interface LogoutAllSessionsResult {
  revokedSessionCount: number;
}
