import { publicEnv } from './env';

interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
  requestId?: string;
}

export interface RegisterCandidatePayload {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
}

export interface RegisterCandidateResult {
  userId: string;
  email: string;
  status: 'PENDING_VERIFICATION';
  emailVerificationRequired: true;
  createdAt: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors?: ApiErrorDetail[],
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function registerCandidate(
  payload: RegisterCandidatePayload,
): Promise<RegisterCandidateResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/register/candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<RegisterCandidateResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Registration failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export interface LoginCandidatePayload {
  email: string;
  password: string;
}

export interface LoginCandidateResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: {
    id: string;
    email: string;
    status: string;
    roleCodes: string[];
  };
}

export async function loginCandidate(
  payload: LoginCandidatePayload,
): Promise<LoginCandidateResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<LoginCandidateResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Login failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export interface VerifyEmailResult {
  userId: string;
  email: string;
  verifiedAt: string;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/email-verification/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (response.ok) {
    return response.json() as Promise<VerifyEmailResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Verification failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export interface AuthenticatedUserData {
  id: string;
  email: string;
  status: string;
  roleCodes: string[];
  sessionId?: string;
}

export interface RefreshSessionResult {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export async function refreshSession(): Promise<RefreshSessionResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return response.json() as Promise<RefreshSessionResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Refresh failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function getCurrentUser(accessToken: string): Promise<AuthenticatedUserData> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as Promise<AuthenticatedUserData>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Get current user failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function logoutCandidate(accessToken: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Logout failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export interface UserSessionSummary {
  id: string;
  isCurrent: boolean;
  status: string;
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

export interface LogoutAllSessionsResult {
  revokedSessionCount: number;
}

export async function listSessions(accessToken: string): Promise<SessionListResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/sessions`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return response.json() as Promise<SessionListResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `List sessions failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function revokeSession(accessToken: string, sessionId: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Revoke session failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function logoutAllSessions(accessToken: string): Promise<LogoutAllSessionsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/logout-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return response.json() as Promise<LogoutAllSessionsResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Logout all failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export interface ResendVerificationResult {
  message: string;
}

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/email-verification/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    return response.json() as Promise<ResendVerificationResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Resend failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

import type { CandidateProfileBasics, CandidateProfileCompletion } from '@nexthire/types';
import type { CandidateProfileBasicsInput } from '@nexthire/validation';

export interface GetCandidateProfileResult {
  profile: CandidateProfileBasics | null;
  completion: CandidateProfileCompletion;
}

export async function getMyCandidateProfile(accessToken: string): Promise<GetCandidateProfileResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as Promise<GetCandidateProfileResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Get profile failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function updateMyCandidateProfile(
  accessToken: string,
  payload: CandidateProfileBasicsInput
): Promise<CandidateProfileBasics> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<CandidateProfileBasics>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Update profile failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

import type { Country } from '@nexthire/types';

export interface GetCountriesResult {
  countries: Country[];
}

export async function listSupportedCountries(): Promise<GetCountriesResult> {
  const response = await fetch(`${API_BASE_URL}/v1/config/countries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch supported countries');
  }

  return response.json();
}

import type { CandidatePreferenceInput } from '@nexthire/validation';
import type { CandidatePreferenceResult } from '@nexthire/types';

export interface GetCandidatePreferenceResult {
  preferences: CandidatePreferenceResult | null;
  availableOptions: {
    workModes: string[];
    employmentTypes: string[];
  };
}

export async function getMyCandidatePreferences(): Promise<GetCandidatePreferenceResult> {
  return await fetchWithAuth(`${API_BASE_URL}/v1/candidates/me/preferences`, {
    method: 'GET',
  });
}

export async function updateMyCandidatePreferences(
  data: CandidatePreferenceInput
): Promise<CandidatePreferenceResult> {
  return await fetchWithAuth(`${API_BASE_URL}/v1/candidates/me/preferences`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
