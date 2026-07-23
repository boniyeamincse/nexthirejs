import type { MfaChallengeRequiredResult } from './mfa.js';

export interface CandidateLoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  status: 'ACTIVE';
  roleCodes: string[];
}

export interface CandidateLoginResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthenticatedUser;
}

export type CandidateLoginResponse = CandidateLoginResult | MfaChallengeRequiredResult;

export interface RefreshSessionResult {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface LogoutResult {
  message: string;
}
