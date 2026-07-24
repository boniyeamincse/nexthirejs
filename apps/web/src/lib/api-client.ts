import { publicEnv } from './env';
import type {
  AssessmentAttemptSubmissionResult,
  AssessmentAttemptWorkspace,
  SaveAssessmentDraftAnswerInput,
  SaveAssessmentDraftAnswerResult,
  StartAssessmentAttemptResult,
  SubmitAssessmentAttemptInput,
  AssessmentResultHistoryResponse,
  AssessmentAttemptResultDetail,
  AssessmentPerformanceReport,
  LeaderboardParticipationSettings,
  UpdateLeaderboardParticipationInput,
  AssessmentLeaderboardResponse,
  CategoryLeaderboardResponse,
  ExpertiseAreaResult,
  ExpertExpertiseResult,
  ExpertExpertiseInput,
  ExpertServiceResult,
  ExpertServiceInput,
  ExpertServiceReadiness,
  ExpertAvailabilityProfileResult,
  ExpertAvailabilityProfileInput,
  ExpertWeeklyAvailabilityResult,
  ExpertWeeklyAvailabilityInput,
  ExpertAvailabilityOverrideResult,
  ExpertAvailabilityOverrideInput,
  ExpertAvailabilitySlotPreviewResult,
  ExpertProfileVisibilityInput,
  ExpertProfileVisibilityResult,
  PublicExpertListQuery,
  PaginatedPublicExpertResult,
  PublicExpertProfileDetail,
  CreateExpertBookingInput,
  ExpertBookingResult,
  UpdateExpertBookingByExpertInput,
  CreateExpertSessionEvaluationInput,
  ExpertSessionEvaluationResult,
  CreateExpertReviewInput,
  ExpertReviewResult,
  PaginatedExpertReviewResult,
  ExpertWalletResult,
  CreateExpertPayoutAccountInput,
  ExpertPayoutAccountResult,
  CreateExpertPayoutRequestInput,
  ExpertPayoutRequestResult,
  ExpertDashboardResult,
} from '@nexthire/types';

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

export interface CandidateForgotPasswordPayload {
  email: string;
}

export interface CandidateResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
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

export interface LoginMfaChallengeResult {
  mfaRequired: true;
  challengeToken: string;
  expiresAt: string;
  allowedMethods: ('TOTP' | 'RECOVERY_CODE')[];
}

export type LoginCandidateResponse = LoginCandidateResult | LoginMfaChallengeResult;

export function isMfaChallenge(result: LoginCandidateResponse): result is LoginMfaChallengeResult {
  return 'mfaRequired' in result && result.mfaRequired === true;
}

export async function loginCandidate(
  payload: LoginCandidatePayload,
): Promise<LoginCandidateResponse> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<LoginCandidateResponse>;
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

export async function requestPasswordReset(
  payload: CandidateForgotPasswordPayload,
): Promise<{ message: string }> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<{ message: string }>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Request failed (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function resetPassword(
  payload: CandidateResetPasswordPayload,
): Promise<{ message: string }> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<{ message: string }>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }

  throw new ApiClientError(
    errorBody?.message ?? `Reset failed (${response.status})`,
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

export async function getMyCandidateProfile(
  accessToken: string,
): Promise<GetCandidateProfileResult> {
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
  payload: CandidateProfileBasicsInput,
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

export async function listSupportedCountries(accessToken: string): Promise<GetCountriesResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/config/countries`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

export async function getMyCandidatePreferences(
  accessToken: string,
): Promise<GetCandidatePreferenceResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/preferences`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error(`Failed to get preferences: ${response.status}`);
}

export async function updateMyCandidatePreferences(
  accessToken: string,
  data: CandidatePreferenceInput,
): Promise<CandidatePreferenceResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/preferences`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error(`Failed to update preferences: ${response.status}`);
}

import type {
  CreateEducationRecordInput,
  UpdateEducationRecordInput,
  ReorderEducationRecordsInput,
} from '@nexthire/validation';
import type { EducationRecordResult } from '@nexthire/types';

export interface GetEducationRecordsResult {
  records: EducationRecordResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateEducationRecordResult {
  record: EducationRecordResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateEducationRecordResult {
  record: EducationRecordResult;
  completion: CandidateProfileCompletion;
}

export async function listMyEducationRecords(
  accessToken: string,
): Promise<GetEducationRecordsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/education`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error(`Failed to list education records: ${response.status}`);
}

export async function createEducationRecord(
  accessToken: string,
  data: CreateEducationRecordInput,
): Promise<CreateEducationRecordResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/education`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error(`Failed to create education record: ${response.status}`);
}

export async function updateEducationRecord(
  accessToken: string,
  id: string,
  data: UpdateEducationRecordInput,
): Promise<UpdateEducationRecordResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/education/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  }

  throw new Error(`Failed to update education record: ${response.status}`);
}

export async function deleteEducationRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/education/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    return;
  }

  throw new Error(`Failed to delete education record: ${response.status}`);
}

export async function reorderEducationRecords(
  accessToken: string,
  data: ReorderEducationRecordsInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/education/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return;
  }

  throw new Error(`Failed to reorder education records: ${response.status}`);
}

import type {
  CreateWorkExperienceRecordInput,
  UpdateWorkExperienceRecordInput,
  ReorderWorkExperienceRecordsInput,
} from '@nexthire/validation';
import type { WorkExperienceRecordResult } from '@nexthire/types';

export interface GetWorkExperienceRecordsResult {
  records: WorkExperienceRecordResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateWorkExperienceRecordResult {
  record: WorkExperienceRecordResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateWorkExperienceRecordResult {
  record: WorkExperienceRecordResult;
  completion: CandidateProfileCompletion;
}

export async function listMyWorkExperienceRecords(
  accessToken: string,
): Promise<GetWorkExperienceRecordsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/experience`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list work experience records: ${response.status}`);
}

export async function createWorkExperienceRecord(
  accessToken: string,
  data: CreateWorkExperienceRecordInput,
): Promise<CreateWorkExperienceRecordResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/experience`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create work experience record: ${response.status}`);
}

export async function updateWorkExperienceRecord(
  accessToken: string,
  id: string,
  data: UpdateWorkExperienceRecordInput,
): Promise<UpdateWorkExperienceRecordResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/experience/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update work experience record: ${response.status}`);
}

export async function deleteWorkExperienceRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/experience/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete work experience record: ${response.status}`);
}

export async function reorderWorkExperienceRecords(
  accessToken: string,
  data: ReorderWorkExperienceRecordsInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/experience/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder work experience records: ${response.status}`);
}

import type {
  CreateCandidateSkillInput,
  UpdateCandidateSkillInput,
  ReorderCandidateSkillsInput,
} from '@nexthire/validation';
import type { CandidateSkillResult } from '@nexthire/types';

export interface GetCandidateSkillsResult {
  records: CandidateSkillResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateSkillResult {
  record: CandidateSkillResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateSkillResult {
  record: CandidateSkillResult;
  completion: CandidateProfileCompletion;
}

export async function listMySkillRecords(accessToken: string): Promise<GetCandidateSkillsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/skills`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list skills: ${response.status}`);
}

export async function createSkillRecord(
  accessToken: string,
  data: CreateCandidateSkillInput,
): Promise<CreateCandidateSkillResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create skill: ${response.status}`);
}

export async function updateSkillRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateSkillInput,
): Promise<UpdateCandidateSkillResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/skills/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update skill: ${response.status}`);
}

export async function deleteSkillRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/skills/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete skill: ${response.status}`);
}

export async function reorderSkillRecords(
  accessToken: string,
  data: ReorderCandidateSkillsInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/skills/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder skills: ${response.status}`);
}

import type {
  CreateCandidateLanguageInput,
  UpdateCandidateLanguageInput,
  ReorderCandidateLanguagesInput,
} from '@nexthire/validation';
import type {
  CreateCandidateCertificationInput,
  UpdateCandidateCertificationInput,
  ReorderCandidateCertificationsInput,
} from '@nexthire/validation';
import type {
  CreateCandidateTrainingInput,
  UpdateCandidateTrainingInput,
  ReorderCandidateTrainingInput,
} from '@nexthire/validation';
import type {
  CreateCandidateAchievementInput,
  UpdateCandidateAchievementInput,
  ReorderCandidateAchievementsInput,
} from '@nexthire/validation';
import type {
  CreateCandidateProfessionalLinkInput,
  UpdateCandidateProfessionalLinkInput,
  ReorderCandidateProfessionalLinksInput,
} from '@nexthire/validation';
import type { CandidateLanguageResult } from '@nexthire/types';
import type {
  CandidateCertificationResult,
  CandidateTrainingResult,
  CandidateAchievementResult,
  CandidateProfessionalLinkResult,
} from '@nexthire/types';

export interface GetCandidateLanguagesResult {
  records: CandidateLanguageResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateLanguageResult {
  record: CandidateLanguageResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateLanguageResult {
  record: CandidateLanguageResult;
  completion: CandidateProfileCompletion;
}

export async function listMyLanguageRecords(
  accessToken: string,
): Promise<GetCandidateLanguagesResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/languages`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list languages: ${response.status}`);
}

export async function createLanguageRecord(
  accessToken: string,
  data: CreateCandidateLanguageInput,
): Promise<CreateCandidateLanguageResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/languages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create language: ${response.status}`);
}

export async function updateLanguageRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateLanguageInput,
): Promise<UpdateCandidateLanguageResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/languages/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update language: ${response.status}`);
}

export async function deleteLanguageRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/languages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete language: ${response.status}`);
}

export async function reorderLanguageRecords(
  accessToken: string,
  data: ReorderCandidateLanguagesInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/languages/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder languages: ${response.status}`);
}

export interface GetCandidateCertificationsResult {
  records: CandidateCertificationResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateCertificationResult {
  record: CandidateCertificationResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateCertificationResult {
  record: CandidateCertificationResult;
  completion: CandidateProfileCompletion;
}

export async function listMyCertificationRecords(
  accessToken: string,
): Promise<GetCandidateCertificationsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list certifications: ${response.status}`);
}

export async function createCertificationRecord(
  accessToken: string,
  data: CreateCandidateCertificationInput,
): Promise<CreateCandidateCertificationResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certifications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create certification: ${response.status}`);
}

export async function updateCertificationRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateCertificationInput,
): Promise<UpdateCandidateCertificationResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certifications/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update certification: ${response.status}`);
}

export async function deleteCertificationRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete certification: ${response.status}`);
}

export async function reorderCertificationRecords(
  accessToken: string,
  data: ReorderCandidateCertificationsInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certifications/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder certifications: ${response.status}`);
}

export interface GetCandidateTrainingResult {
  records: CandidateTrainingResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateTrainingResult {
  record: CandidateTrainingResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateTrainingResult {
  record: CandidateTrainingResult;
  completion: CandidateProfileCompletion;
}

export async function listMyTrainingRecords(
  accessToken: string,
): Promise<GetCandidateTrainingResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/training`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list training: ${response.status}`);
}

export async function createTrainingRecord(
  accessToken: string,
  data: CreateCandidateTrainingInput,
): Promise<CreateCandidateTrainingResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/training`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create training: ${response.status}`);
}

export async function updateTrainingRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateTrainingInput,
): Promise<UpdateCandidateTrainingResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/training/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update training: ${response.status}`);
}

export async function deleteTrainingRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/training/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete training: ${response.status}`);
}

export async function reorderTrainingRecords(
  accessToken: string,
  data: ReorderCandidateTrainingInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/training/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder training: ${response.status}`);
}

export interface GetCandidateAchievementsResult {
  records: CandidateAchievementResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateAchievementResult {
  record: CandidateAchievementResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateAchievementResult {
  record: CandidateAchievementResult;
  completion: CandidateProfileCompletion;
}

export async function listMyAchievementRecords(
  accessToken: string,
): Promise<GetCandidateAchievementsResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/achievements`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list achievements: ${response.status}`);
}

export async function createAchievementRecord(
  accessToken: string,
  data: CreateCandidateAchievementInput,
): Promise<CreateCandidateAchievementResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/achievements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create achievement: ${response.status}`);
}

export async function updateAchievementRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateAchievementInput,
): Promise<UpdateCandidateAchievementResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/achievements/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update achievement: ${response.status}`);
}

export async function deleteAchievementRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/achievements/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete achievement: ${response.status}`);
}

export async function reorderAchievementRecords(
  accessToken: string,
  data: ReorderCandidateAchievementsInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/achievements/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder achievements: ${response.status}`);
}

export interface GetCandidateProfessionalLinksResult {
  records: CandidateProfessionalLinkResult[];
  completion: CandidateProfileCompletion;
}

export interface CreateCandidateProfessionalLinkResult {
  record: CandidateProfessionalLinkResult;
  completion: CandidateProfileCompletion;
}

export interface UpdateCandidateProfessionalLinkResult {
  record: CandidateProfessionalLinkResult;
  completion: CandidateProfileCompletion;
}

export async function listMyProfessionalLinkRecords(
  accessToken: string,
): Promise<GetCandidateProfessionalLinksResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/professional-links`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to list professional links: ${response.status}`);
}

export async function createProfessionalLinkRecord(
  accessToken: string,
  data: CreateCandidateProfessionalLinkInput,
): Promise<CreateCandidateProfessionalLinkResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/professional-links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create professional link: ${response.status}`);
}

export async function updateProfessionalLinkRecord(
  accessToken: string,
  id: string,
  data: UpdateCandidateProfessionalLinkInput,
): Promise<UpdateCandidateProfessionalLinkResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/professional-links/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update professional link: ${response.status}`);
}

export async function deleteProfessionalLinkRecord(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/professional-links/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return;
  throw new Error(`Failed to delete professional link: ${response.status}`);
}

export async function reorderProfessionalLinkRecords(
  accessToken: string,
  data: ReorderCandidateProfessionalLinksInput,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/professional-links/reorder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return;
  throw new Error(`Failed to reorder professional links: ${response.status}`);
}

export interface GetProfilePrivacyResult {
  overallDiscoverability: string;
  sections: Record<string, string>;
  policyVersion: string;
  source: 'DEFAULT' | 'PERSISTED';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateProfilePrivacyInput {
  overallDiscoverability: string;
  sections: Record<string, string>;
}

export async function getMyProfilePrivacy(accessToken: string): Promise<GetProfilePrivacyResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/privacy`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to get privacy settings: ${response.status}`);
}

export async function updateMyProfilePrivacy(
  accessToken: string,
  data: UpdateProfilePrivacyInput,
): Promise<GetProfilePrivacyResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/privacy`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update privacy settings: ${response.status}`);
}

import type { OwnerProfilePreview, PublicCandidateProfile, ShareLinkResult } from '@nexthire/types';

export async function getMyProfilePreview(accessToken: string): Promise<OwnerProfilePreview> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/preview`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to get profile preview: ${response.status}`);
}

export async function getPublicProfileById(
  publicId: string,
): Promise<PublicCandidateProfile | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/public/candidates/${publicId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.ok) return response.json();
  if (response.status === 404) return null;
  throw new Error(`Failed to get public profile: ${response.status}`);
}

export async function getSharedProfile(token: string): Promise<PublicCandidateProfile | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/public/candidate-profile?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (response.ok) return response.json();
  if (response.status === 404) return null;
  throw new Error(`Failed to get shared profile: ${response.status}`);
}

export async function rotateProfileShareLink(accessToken: string): Promise<ShareLinkResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/share-link/rotate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to rotate share link: ${response.status}`);
}

export async function setProfileShareLinkEnabled(
  accessToken: string,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/share-link`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update share link: ${response.status}`);
}

export async function getProfileShareLinkStatus(
  accessToken: string,
): Promise<{ enabled: boolean; rotatedAt: string | null } | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/share-link`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) return response.json();
  if (response.status === 404) return null;
  throw new Error(`Failed to get share link status: ${response.status}`);
}

export interface CandidateProfileSectionProgress {
  section: string;
  label: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  earnedPoints: number;
  possiblePoints: number;
  percentage: number;
  route: string;
  missingItems: string[];
}

export interface CandidateProfileCompletionAction {
  id: string;
  section: string;
  title: string;
  description: string;
  route: string;
  priority: number;
  pointsAvailable: number;
}

export interface CandidateProfileCompletionDashboard {
  completion: {
    percentage: number;
    earnedPoints: number;
    totalPoints: number;
    version: string;
    updatedAt: string;
  };
  summary: {
    completedSections: number;
    inProgressSections: number;
    notStartedSections: number;
    totalSections: number;
  };
  sections: CandidateProfileSectionProgress[];
  nextActions: CandidateProfileCompletionAction[];
}

export async function getMyProfileCompletionDashboard(
  accessToken: string,
): Promise<CandidateProfileCompletionDashboard> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile-completion`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      /* ignore */
    }
    throw new ApiClientError(
      errorData?.message ?? `Failed to fetch profile completion (${response.status})`,
      response.status,
      errorData?.errors ?? [
        {
          code: response.status.toString(),
          message: errorData?.message ?? 'Failed to fetch profile completion',
        },
      ],
      errorData?.requestId,
    );
  }
  return response.json() as Promise<CandidateProfileCompletionDashboard>;
}

// --- Account Security ---

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

export interface ChangePasswordResponse {
  changed: boolean;
  revokedOtherSessionCount: number;
}

export async function getMyAccountSecuritySummary(
  accessToken: string,
): Promise<CandidateAccountSecuritySummary> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/account-security`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return response.json() as Promise<CandidateAccountSecuritySummary>;
  throw new Error(`Failed to fetch account security summary: ${response.status}`);
}

export async function changePassword(
  accessToken: string,
  data: { currentPassword: string; newPassword: string; confirmNewPassword: string },
): Promise<ChangePasswordResponse> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json() as Promise<ChangePasswordResponse>;
  const errorText = await response.text().catch(() => 'Unknown error');
  throw new Error(`Failed to change password: ${response.status} ${errorText}`);
}

// --- Data Export & Account Lifecycle ---

export interface RequestDataExportResult {
  id: string;
  status: string;
  requestedAt: string;
}

export interface DataExportStatusResult {
  id: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  fileSizeBytes: number | null;
  downloadAvailable: boolean;
}

export interface DataExportDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface DeactivateAccountResult {
  deactivated: boolean;
  sessionsRevoked: number;
}

export async function requestMyDataExport(accessToken: string): Promise<RequestDataExportResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/data-exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (response.ok) return response.json() as Promise<RequestDataExportResult>;
  const text = await response.text().catch(() => '');
  throw new Error(text || `Failed to request data export: ${response.status}`);
}

export async function listMyDataExports(accessToken: string): Promise<DataExportStatusResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/data-exports`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return response.json() as Promise<DataExportStatusResult[]>;
  throw new Error(`Failed to list data exports: ${response.status}`);
}

export async function getMyDataExportStatus(
  accessToken: string,
  exportId: string,
): Promise<DataExportStatusResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/data-exports/${encodeURIComponent(exportId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return response.json() as Promise<DataExportStatusResult>;
  throw new Error(`Failed to get export status: ${response.status}`);
}

export async function getMyDataExportDownload(
  accessToken: string,
  exportId: string,
): Promise<DataExportDownloadResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/data-exports/${encodeURIComponent(exportId)}/download`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return response.json() as Promise<DataExportDownloadResult>;
  const text = await response.text().catch(() => '');
  throw new Error(text || `Failed to get download access: ${response.status}`);
}

export async function deactivateMyAccount(
  accessToken: string,
  data: { currentPassword: string; confirmation: string },
): Promise<DeactivateAccountResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/deactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json() as Promise<DeactivateAccountResult>;
  const text = await response.text().catch(() => '');
  throw new Error(text || `Failed to deactivate account: ${response.status}`);
}

// --- Assessment Catalog ---

import type {
  PaginatedAssessmentCatalogResult,
  AssessmentCatalogDetail,
  AssessmentRetakeEligibility,
  AssessmentRetakePolicy,
  AssessmentCertificateListItem,
  AssessmentCertificateDetail,
  AssessmentCertificateDownloadResult,
  AssessmentCertificateVerificationResult,
} from '@nexthire/types';

export async function listAssessments(
  accessToken: string,
  queryString: string,
): Promise<PaginatedAssessmentCatalogResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessments${queryString ? `?${queryString}` : ''}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );

  if (response.ok) {
    return response.json() as Promise<PaginatedAssessmentCatalogResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to list assessments (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function getAssessmentDetail(
  accessToken: string,
  assessmentIdOrSlug: string,
): Promise<AssessmentCatalogDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessments/${encodeURIComponent(assessmentIdOrSlug)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentCatalogDetail>;
  }

  if (response.status === 404) {
    throw new ApiClientError('Assessment not found.', 404);
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to get assessment (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

// --- Assessment Management (Authoring) ---
import type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
  CreateAssessmentSectionInput,
  UpdateAssessmentSectionInput,
  AssignAssessmentQuestionsInput,
  UpdateAssessmentQuestionAssignmentInput,
  AssessmentManagementDetail,
  AssessmentPublicationReadiness,
} from '@nexthire/types';

export async function createAssessment(
  accessToken: string,
  data: CreateAssessmentInput,
): Promise<AssessmentManagementDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/manage/assessments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to create assessment: ${response.status}`);
}

export async function getManagedAssessment(
  accessToken: string,
  id: string,
): Promise<AssessmentManagementDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/manage/assessments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to get managed assessment: ${response.status}`);
}

export async function updateAssessment(
  accessToken: string,
  id: string,
  data: UpdateAssessmentInput,
): Promise<AssessmentManagementDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/manage/assessments/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (response.ok) return response.json();
  throw new Error(`Failed to update assessment: ${response.status}`);
}

export async function createAssessmentSection(
  accessToken: string,
  assessmentId: string,
  data: CreateAssessmentSectionInput,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/sections`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to create section: ${response.status}`);
}

export async function updateAssessmentSection(
  accessToken: string,
  assessmentId: string,
  sectionId: string,
  data: UpdateAssessmentSectionInput,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/sections/${sectionId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to update section: ${response.status}`);
}

export async function deleteAssessmentSection(
  accessToken: string,
  assessmentId: string,
  sectionId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/sections/${sectionId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to delete section: ${response.status}`);
}

export async function reorderAssessmentSections(
  accessToken: string,
  assessmentId: string,
  orderedIds: string[],
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/sections/reorder`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to reorder sections: ${response.status}`);
}

export async function assignAssessmentQuestions(
  accessToken: string,
  assessmentId: string,
  data: AssignAssessmentQuestionsInput,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/questions/assign`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to assign questions: ${response.status}`);
}

export async function updateAssessmentQuestionAssignment(
  accessToken: string,
  assessmentId: string,
  assignmentId: string,
  data: UpdateAssessmentQuestionAssignmentInput,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/questions/${assignmentId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to update assignment: ${response.status}`);
}

export async function deleteAssessmentQuestionAssignment(
  accessToken: string,
  assessmentId: string,
  assignmentId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/questions/${assignmentId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to delete assignment: ${response.status}`);
}

export async function reorderAssessmentSectionQuestions(
  accessToken: string,
  assessmentId: string,
  sectionId: string,
  orderedIds: string[],
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/sections/${sectionId}/questions/reorder`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to reorder questions: ${response.status}`);
}

export async function getAssessmentReadiness(
  accessToken: string,
  assessmentId: string,
): Promise<AssessmentPublicationReadiness> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/readiness`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return response.json();
  throw new Error(`Failed to check readiness: ${response.status}`);
}

export async function publishAssessment(accessToken: string, assessmentId: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/publish`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return;

  let errorBody = null;
  try {
    errorBody = await response.json();
  } catch {
    // Ignore JSON parse error
  }
  throw new Error(errorBody?.message ?? `Failed to publish assessment: ${response.status}`);
}

export async function archiveAssessment(accessToken: string, assessmentId: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/archive`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return;
  throw new Error(`Failed to archive assessment: ${response.status}`);
}

export async function republishAssessment(
  accessToken: string,
  assessmentId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/republish`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.ok) return;
  let errorBody = null;
  try {
    errorBody = await response.json();
  } catch {
    // Ignore JSON parse error
  }
  throw new Error(errorBody?.message ?? `Failed to republish assessment: ${response.status}`);
}

export async function startOrResumeAssessmentAttempt(
  accessToken: string,
  assessmentIdOrSlug: string,
): Promise<StartAssessmentAttemptResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessments/${encodeURIComponent(assessmentIdOrSlug)}/attempts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to start assessment attempt: ${response.status}`);
  }
  return response.json();
}

export async function getActiveAssessmentAttempt(
  accessToken: string,
  assessmentIdOrSlug: string,
): Promise<{ attemptId: string } | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessments/${encodeURIComponent(assessmentIdOrSlug)}/attempts/active`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch active attempt: ${response.status}`);
  }
  return response.json();
}

export async function clearAttemptAnswer(
  accessToken: string,
  attemptId: string,
  questionId: string,
) {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessment-attempts/${attemptId}/questions/${questionId}/answer`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok && response.status !== 404) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to clear answer: ${response.status}`);
  }
}

export async function getAttemptWorkspace(
  accessToken: string,
  attemptId: string,
): Promise<AssessmentAttemptWorkspace> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/assessment-attempts/${attemptId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch attempt workspace: ${response.status}`);
  }
  return response.json();
}

export async function saveAttemptAnswer(
  accessToken: string,
  attemptId: string,
  questionId: string,
  payload: SaveAssessmentDraftAnswerInput,
): Promise<SaveAssessmentDraftAnswerResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessment-attempts/${attemptId}/questions/${questionId}/answer`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to save answer: ${response.status}`);
  }
  return response.json();
}

export async function submitAssessmentAttempt(
  accessToken: string,
  attemptId: string,
  payload: SubmitAssessmentAttemptInput,
): Promise<AssessmentAttemptSubmissionResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/assessment-attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to submit assessment: ${response.status}`);
  }

  return response.json();
}

export async function getAssessmentSubmissionSummary(
  accessToken: string,
  attemptId: string,
): Promise<AssessmentAttemptSubmissionResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessment-attempts/${attemptId}/submission-summary`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch submission summary: ${response.status}`);
  }

  return response.json();
}

export async function listMyAssessmentResults(
  accessToken: string,
  queryString: string,
): Promise<AssessmentResultHistoryResponse> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/assessment-results?${queryString}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch assessment results: ${response.status}`);
  }

  return response.json();
}

export async function getMyAssessmentResult(
  accessToken: string,
  attemptId: string,
): Promise<AssessmentAttemptResultDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/assessment-results/${attemptId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch assessment result: ${response.status}`);
  }

  return response.json();
}

// --- Assessment Performance & Leaderboards ---

export async function getMyAssessmentPerformance(
  accessToken: string,
  queryString: string,
): Promise<AssessmentPerformanceReport> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/assessment-performance?${queryString}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch performance report: ${response.status}`);
  }

  return response.json();
}

export async function getMyLeaderboardSettings(
  accessToken: string,
): Promise<LeaderboardParticipationSettings> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/leaderboard-settings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(
      errorBody?.message ?? `Failed to fetch leaderboard settings: ${response.status}`,
    );
  }

  return response.json();
}

export async function updateMyLeaderboardSettings(
  accessToken: string,
  input: UpdateLeaderboardParticipationInput,
): Promise<LeaderboardParticipationSettings> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/leaderboard-settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(
      errorBody?.message ?? `Failed to update leaderboard settings: ${response.status}`,
    );
  }

  return response.json();
}

export async function getAssessmentLeaderboard(
  accessToken: string,
  assessmentIdOrSlug: string,
  queryString: string,
): Promise<AssessmentLeaderboardResponse> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessment-leaderboards/assessments/${encodeURIComponent(assessmentIdOrSlug)}?${queryString}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorBody?.message ?? `Failed to fetch leaderboard: ${response.status}`);
  }

  return response.json();
}

export async function getCategoryLeaderboard(
  accessToken: string,
  categoryIdOrSlug: string,
  queryString: string,
): Promise<CategoryLeaderboardResponse> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessment-leaderboards/categories/${encodeURIComponent(categoryIdOrSlug)}?${queryString}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(
      errorBody?.message ?? `Failed to fetch category leaderboard: ${response.status}`,
    );
  }

  return response.json();
}

// --- Assessment Certificates & Retake ---

export async function getAssessmentRetakeEligibility(
  accessToken: string,
  assessmentIdOrSlug: string,
): Promise<AssessmentRetakeEligibility> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/assessments/${encodeURIComponent(assessmentIdOrSlug)}/retake-eligibility`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentRetakeEligibility>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to fetch retake eligibility (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function updateAssessmentRetakeCertificatePolicy(
  accessToken: string,
  assessmentId: string,
  input: Partial<AssessmentRetakePolicy>,
): Promise<AssessmentRetakePolicy> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/assessments/${assessmentId}/retake-certificate-policy`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentRetakePolicy>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to update retake certificate policy (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function getMyCertificates(
  accessToken: string,
  params?: { page?: number; pageSize?: number; status?: string },
): Promise<{
  items: AssessmentCertificateListItem[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const queryParts: string[] = [];
  if (params?.page !== undefined) queryParts.push(`page=${params.page}`);
  if (params?.pageSize !== undefined) queryParts.push(`pageSize=${params.pageSize}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/certificates${queryString}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (response.ok) {
    return response.json();
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to fetch certificates (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function getMyCertificate(
  accessToken: string,
  certificateId: string,
): Promise<AssessmentCertificateDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/certificates/${encodeURIComponent(certificateId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentCertificateDetail>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to fetch certificate (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function getMyCertificateDownload(
  accessToken: string,
  certificateId: string,
): Promise<AssessmentCertificateDownloadResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/certificates/${encodeURIComponent(certificateId)}/download`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentCertificateDownloadResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to get certificate download (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function retryMyCertificate(
  accessToken: string,
  certificateId: string,
): Promise<{ status: string }> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/certificates/${encodeURIComponent(certificateId)}/retry`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    },
  );

  if (response.ok) {
    return response.json() as Promise<{ status: string }>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to retry certificate (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

export async function verifyCertificate(
  accessToken: string | undefined,
  verificationCode: string,
): Promise<AssessmentCertificateVerificationResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${publicEnv.apiBaseUrl}/public/certificates/verify/${encodeURIComponent(verificationCode)}`,
    {
      headers,
    },
  );

  if (response.ok) {
    return response.json() as Promise<AssessmentCertificateVerificationResult>;
  }

  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore
  }

  throw new ApiClientError(
    errorBody?.message ?? `Failed to verify certificate (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

// ---------------------------------------------------------------------------
// Expert Profile & Verification (NH-P3-T001)
// ---------------------------------------------------------------------------

import type {
  ExpertProfileInput,
  ExpertProfileResult,
  ExpertApplicationDetail,
  ExpertApplicationReadiness,
  ExpertVerificationDocumentResult,
  ExpertVerificationDocumentTypeValue,
  SubmitExpertApplicationInput,
  ReviewExpertApplicationInput,
  ExpertApplicationListQuery,
  PaginatedExpertApplicationResult,
} from '@nexthire/types';

export type {
  ExpertProfileInput,
  ExpertProfileResult,
  ExpertApplicationDetail,
  ExpertApplicationReadiness,
  ExpertVerificationDocumentResult,
  ExpertVerificationDocumentTypeValue,
  SubmitExpertApplicationInput,
  ReviewExpertApplicationInput,
  ExpertApplicationListQuery,
  PaginatedExpertApplicationResult,
} from '@nexthire/types';

export interface UploadExpertVerificationDocumentInput {
  type: ExpertVerificationDocumentTypeValue;
  file: File;
}

/**
 * Short-lived, single-use reviewer document access grant.
 * The `url` MUST NEVER be persisted to storage, logged, or cached.
 */
export interface ExpertVerificationDocumentAccessResult {
  url: string;
  expiresAt: string;
  expiresInSeconds: number;
}

async function parseApiError(response: Response, fallback: string): Promise<ApiClientError> {
  let errorBody: ApiErrorResponse | null = null;
  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    // ignore parse errors
  }
  return new ApiClientError(
    errorBody?.message ?? `${fallback} (${response.status})`,
    response.status,
    errorBody?.errors,
    errorBody?.requestId,
  );
}

function expertAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// --- Applicant: Expert profile ---

export async function getMyExpertProfile(accessToken: string): Promise<ExpertProfileResult | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/profile`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.status === 404) {
    return null;
  }
  if (response.ok) {
    return response.json() as Promise<ExpertProfileResult>;
  }
  throw await parseApiError(response, 'Failed to load expert profile');
}

export async function updateMyExpertProfile(
  accessToken: string,
  input: ExpertProfileInput,
): Promise<ExpertProfileResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/profile`, {
    method: 'PUT',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertProfileResult>;
  }
  throw await parseApiError(response, 'Failed to save expert profile');
}

export async function updateMyExpertProfileVisibility(
  accessToken: string,
  input: ExpertProfileVisibilityInput,
): Promise<ExpertProfileVisibilityResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/profile/visibility`, {
    method: 'PUT',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertProfileVisibilityResult>;
  }
  throw await parseApiError(response, 'Failed to update profile visibility');
}

// --- Public: Expert directory (no auth) ---

export async function getPublicExperts(
  query: PublicExpertListQuery = {},
): Promise<PaginatedPublicExpertResult> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.expertiseAreaId) params.set('expertiseAreaId', query.expertiseAreaId);
  if (query.country) params.set('country', query.country);
  const qs = params.toString();
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/public${qs ? `?${qs}` : ''}`);
  if (response.ok) {
    return response.json() as Promise<PaginatedPublicExpertResult>;
  }
  throw await parseApiError(response, 'Failed to load experts');
}

export async function getPublicExpertProfile(slug: string): Promise<PublicExpertProfileDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/public/${encodeURIComponent(slug)}`);
  if (response.ok) {
    return response.json() as Promise<PublicExpertProfileDetail>;
  }
  throw await parseApiError(response, 'Failed to load expert profile');
}

export async function getPublicExpertReviews(
  slug: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedExpertReviewResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/public/${encodeURIComponent(slug)}/reviews?page=${page}&pageSize=${pageSize}`,
  );
  if (response.ok) {
    return response.json() as Promise<PaginatedExpertReviewResult>;
  }
  throw await parseApiError(response, 'Failed to load reviews');
}

export async function getPublicExpertServiceSlots(
  slug: string,
  serviceId: string,
  params: { from: string; to: string },
): Promise<ExpertAvailabilitySlotPreviewResult> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/public/${encodeURIComponent(slug)}/services/${encodeURIComponent(serviceId)}/slots?${query.toString()}`,
  );
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilitySlotPreviewResult>;
  }
  throw await parseApiError(response, 'Failed to load available slots');
}

// --- Candidate: Expert bookings ---

export async function createMyExpertBooking(
  accessToken: string,
  input: CreateExpertBookingInput,
): Promise<ExpertBookingResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/bookings`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult>;
  }
  throw await parseApiError(response, 'Failed to reserve this slot');
}

export async function listMyExpertBookings(
  accessToken: string,
  status?: string,
): Promise<ExpertBookingResult[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/bookings${params}`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult[]>;
  }
  throw await parseApiError(response, 'Failed to load your bookings');
}

export async function confirmMyExpertBooking(
  accessToken: string,
  id: string,
): Promise<ExpertBookingResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/bookings/${encodeURIComponent(id)}/confirm`,
    { method: 'POST', headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult>;
  }
  throw await parseApiError(response, 'Failed to confirm booking');
}

export async function cancelMyExpertBooking(
  accessToken: string,
  id: string,
): Promise<ExpertBookingResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/bookings/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: expertAuthHeaders(accessToken),
    },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult>;
  }
  throw await parseApiError(response, 'Failed to cancel booking');
}

// --- Expert: Received bookings ---

export async function listReceivedExpertBookings(
  accessToken: string,
  status?: string,
): Promise<ExpertBookingResult[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/bookings${params}`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult[]>;
  }
  throw await parseApiError(response, 'Failed to load received bookings');
}

export async function updateReceivedExpertBooking(
  accessToken: string,
  id: string,
  input: UpdateExpertBookingByExpertInput,
): Promise<ExpertBookingResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/bookings/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: expertAuthHeaders(accessToken),
      body: JSON.stringify(input),
    },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertBookingResult>;
  }
  throw await parseApiError(response, 'Failed to update booking');
}

// --- Candidate: session evaluation (read-only) + reviews ---

export async function getMyBookingEvaluation(
  accessToken: string,
  bookingId: string,
): Promise<ExpertSessionEvaluationResult | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/bookings/${encodeURIComponent(bookingId)}/evaluation`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertSessionEvaluationResult | null>;
  }
  throw await parseApiError(response, 'Failed to load evaluation');
}

export async function getMyBookingReview(
  accessToken: string,
  bookingId: string,
): Promise<ExpertReviewResult | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/bookings/${encodeURIComponent(bookingId)}/review`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertReviewResult | null>;
  }
  throw await parseApiError(response, 'Failed to load review');
}

export async function createMyBookingReview(
  accessToken: string,
  bookingId: string,
  input: CreateExpertReviewInput,
): Promise<ExpertReviewResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/candidates/me/bookings/${encodeURIComponent(bookingId)}/review`,
    { method: 'POST', headers: expertAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertReviewResult>;
  }
  throw await parseApiError(response, 'Failed to submit review');
}

// --- Expert: session evaluation (submit) + received reviews ---

export async function getExpertBookingEvaluation(
  accessToken: string,
  bookingId: string,
): Promise<ExpertSessionEvaluationResult | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/bookings/${encodeURIComponent(bookingId)}/evaluation`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertSessionEvaluationResult | null>;
  }
  throw await parseApiError(response, 'Failed to load evaluation');
}

export async function createExpertBookingEvaluation(
  accessToken: string,
  bookingId: string,
  input: CreateExpertSessionEvaluationInput,
): Promise<ExpertSessionEvaluationResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/bookings/${encodeURIComponent(bookingId)}/evaluation`,
    { method: 'POST', headers: expertAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertSessionEvaluationResult>;
  }
  throw await parseApiError(response, 'Failed to submit evaluation');
}

export async function getExpertBookingReview(
  accessToken: string,
  bookingId: string,
): Promise<ExpertReviewResult | null> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/bookings/${encodeURIComponent(bookingId)}/review`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertReviewResult | null>;
  }
  throw await parseApiError(response, 'Failed to load review');
}

export async function listMyReceivedExpertReviews(
  accessToken: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedExpertReviewResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/reviews?page=${page}&pageSize=${pageSize}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<PaginatedExpertReviewResult>;
  }
  throw await parseApiError(response, 'Failed to load reviews');
}

// --- Expert: Wallet and payouts ---

export async function initializeMyExpertWallet(accessToken: string): Promise<ExpertWalletResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet/initialize`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertWalletResult>;
  }
  throw await parseApiError(response, 'Failed to initialize wallet');
}

export async function getMyExpertWallet(accessToken: string): Promise<ExpertWalletResult | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertWalletResult | null>;
  }
  throw await parseApiError(response, 'Failed to load wallet');
}

export async function addMyExpertPayoutAccount(
  accessToken: string,
  input: CreateExpertPayoutAccountInput,
): Promise<ExpertPayoutAccountResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet/payout-accounts`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertPayoutAccountResult>;
  }
  throw await parseApiError(response, 'Failed to add payout account');
}

export async function listMyExpertPayoutAccounts(
  accessToken: string,
): Promise<ExpertPayoutAccountResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet/payout-accounts`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertPayoutAccountResult[]>;
  }
  throw await parseApiError(response, 'Failed to load payout accounts');
}

export async function requestMyExpertPayout(
  accessToken: string,
  input: CreateExpertPayoutRequestInput,
): Promise<ExpertPayoutRequestResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet/payout-requests`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertPayoutRequestResult>;
  }
  throw await parseApiError(response, 'Failed to request payout');
}

export async function listMyExpertPayoutRequests(
  accessToken: string,
): Promise<ExpertPayoutRequestResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/wallet/payout-requests`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertPayoutRequestResult[]>;
  }
  throw await parseApiError(response, 'Failed to load payout requests');
}

// --- Expert: Dashboard ---

export async function getMyExpertDashboard(accessToken: string): Promise<ExpertDashboardResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/dashboard`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertDashboardResult>;
  }
  throw await parseApiError(response, 'Failed to load dashboard');
}

// --- Applicant: Expert application ---

export async function getMyExpertApplication(
  accessToken: string,
): Promise<ExpertApplicationDetail | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.status === 404) {
    return null;
  }
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationDetail>;
  }
  throw await parseApiError(response, 'Failed to load expert application');
}

export async function createMyExpertApplication(
  accessToken: string,
): Promise<ExpertApplicationDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationDetail>;
  }
  throw await parseApiError(response, 'Failed to start expert application');
}

export async function getMyExpertApplicationReadiness(
  accessToken: string,
): Promise<ExpertApplicationReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application/readiness`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReadiness>;
  }
  throw await parseApiError(response, 'Failed to check application readiness');
}

export async function submitMyExpertApplication(
  accessToken: string,
  input?: SubmitExpertApplicationInput,
): Promise<ExpertApplicationDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application/submit`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input ?? {}),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationDetail>;
  }
  throw await parseApiError(response, 'Failed to submit application');
}

export async function withdrawMyExpertApplication(
  accessToken: string,
): Promise<ExpertApplicationDetail> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application/withdraw`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationDetail>;
  }
  throw await parseApiError(response, 'Failed to withdraw application');
}

// --- Applicant: Verification documents ---

export async function listMyExpertVerificationDocuments(
  accessToken: string,
): Promise<ExpertVerificationDocumentResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application/documents`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    const body = (await response.json()) as
      { documents: ExpertVerificationDocumentResult[] } | ExpertVerificationDocumentResult[];
    return Array.isArray(body) ? body : body.documents;
  }
  throw await parseApiError(response, 'Failed to load verification documents');
}

export async function uploadExpertVerificationDocument(
  accessToken: string,
  input: UploadExpertVerificationDocumentInput,
): Promise<ExpertVerificationDocumentResult> {
  const formData = new FormData();
  formData.append('type', input.type);
  formData.append('file', input.file, input.file.name);

  const response = await fetch(`${publicEnv.apiBaseUrl}/experts/me/application/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (response.ok) {
    return response.json() as Promise<ExpertVerificationDocumentResult>;
  }
  throw await parseApiError(response, 'Failed to upload document');
}

export async function removeExpertVerificationDocument(
  accessToken: string,
  documentId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/experts/me/application/documents/${encodeURIComponent(documentId)}`,
    {
      method: 'DELETE',
      headers: expertAuthHeaders(accessToken),
    },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to remove document');
}

// --- Admin: Expert application review ---

export async function listExpertApplications(
  accessToken: string,
  query: ExpertApplicationListQuery = {},
): Promise<PaginatedExpertApplicationResult> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.country) params.set('country', query.country);
  if (query.submittedFrom) params.set('submittedFrom', query.submittedFrom);
  if (query.submittedTo) params.set('submittedTo', query.submittedTo);

  const qs = params.toString();
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications${qs ? `?${qs}` : ''}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<PaginatedExpertApplicationResult>;
  }
  throw await parseApiError(response, 'Failed to load applications');
}

export interface ExpertApplicationReviewDetail extends ExpertApplicationDetail {
  applicant: {
    displayName: string;
    countryId: string;
  };
  profile: ExpertProfileResult;
  documents: ExpertVerificationDocumentResult[];
}

export async function getExpertApplicationForReview(
  accessToken: string,
  applicationId: string,
): Promise<ExpertApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(applicationId)}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to load application');
}

export async function startExpertApplicationReview(
  accessToken: string,
  applicationId: string,
): Promise<ExpertApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(applicationId)}/start-review`,
    { method: 'POST', headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to start review');
}

export async function approveExpertApplication(
  accessToken: string,
  applicationId: string,
  input: ReviewExpertApplicationInput,
): Promise<ExpertApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(applicationId)}/approve`,
    { method: 'POST', headers: expertAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to approve application');
}

export async function rejectExpertApplication(
  accessToken: string,
  applicationId: string,
  input: ReviewExpertApplicationInput,
): Promise<ExpertApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(applicationId)}/reject`,
    { method: 'POST', headers: expertAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to reject application');
}

export async function requestExpertApplicationChanges(
  accessToken: string,
  applicationId: string,
  input: ReviewExpertApplicationInput,
): Promise<ExpertApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(applicationId)}/request-changes`,
    { method: 'POST', headers: expertAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to request changes');
}

/**
 * Requests a short-lived reviewer download URL for a verification document.
 * The returned URL is single-use / time-boxed and MUST NOT be persisted or logged.
 */
export async function getExpertVerificationDocumentAccess(
  accessToken: string,
  applicationId: string,
  documentId: string,
): Promise<ExpertVerificationDocumentAccessResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/experts/applications/${encodeURIComponent(
      applicationId,
    )}/documents/${encodeURIComponent(documentId)}/access`,
    { method: 'POST', headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertVerificationDocumentAccessResult>;
  }
  throw await parseApiError(response, 'Failed to obtain document access');
}

// ---------------------------------------------------------------------------
// Company Profile & Verification (NH-M19)
// ---------------------------------------------------------------------------

import type {
  CompanyProfileInput,
  CompanyProfileResult,
  CompanyApplicationDetail,
  CompanyApplicationReadiness,
  CompanyVerificationDocumentResult,
  CompanyDocumentTypeValue,
  SubmitCompanyApplicationInput,
  ReviewCompanyApplicationInput,
  CompanyApplicationListQuery,
  PaginatedCompanyApplicationResult,
  CompanyApplicationReviewDetail,
} from '@nexthire/types';

function companyAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// --- Applicant: Company profile ---

export async function getMyCompanyProfile(
  accessToken: string,
): Promise<CompanyProfileResult | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/profile`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    const body = (await response.json()) as { profile: CompanyProfileResult | null };
    return body.profile;
  }
  throw await parseApiError(response, 'Failed to load company profile');
}

export async function updateMyCompanyProfile(
  accessToken: string,
  input: CompanyProfileInput,
): Promise<CompanyProfileResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/profile`, {
    method: 'PUT',
    headers: companyAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyProfileResult>;
  }
  throw await parseApiError(response, 'Failed to save company profile');
}

// --- Applicant: Company verification application ---

export interface CompanyApplicationWithReadiness {
  application: CompanyApplicationDetail | null;
  documents: CompanyVerificationDocumentResult[];
  readiness: CompanyApplicationReadiness | null;
}

export async function getMyCompanyApplication(
  accessToken: string,
): Promise<CompanyApplicationWithReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationWithReadiness>;
  }
  throw await parseApiError(response, 'Failed to load company application');
}

export async function createMyCompanyApplication(
  accessToken: string,
): Promise<CompanyApplicationWithReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application`, {
    method: 'POST',
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationWithReadiness>;
  }
  throw await parseApiError(response, 'Failed to start company application');
}

export async function getMyCompanyApplicationReadiness(
  accessToken: string,
): Promise<CompanyApplicationReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application/readiness`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReadiness>;
  }
  throw await parseApiError(response, 'Failed to check application readiness');
}

export async function submitMyCompanyApplication(
  accessToken: string,
  input?: SubmitCompanyApplicationInput,
): Promise<CompanyApplicationWithReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application/submit`, {
    method: 'POST',
    headers: companyAuthHeaders(accessToken),
    body: JSON.stringify(input ?? {}),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationWithReadiness>;
  }
  throw await parseApiError(response, 'Failed to submit application');
}

export async function withdrawMyCompanyApplication(
  accessToken: string,
): Promise<CompanyApplicationWithReadiness> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application/withdraw`, {
    method: 'POST',
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationWithReadiness>;
  }
  throw await parseApiError(response, 'Failed to withdraw application');
}

// --- Applicant: Company verification documents ---

export interface UploadCompanyVerificationDocumentInput {
  type: CompanyDocumentTypeValue;
  file: File;
}

export async function listMyCompanyVerificationDocuments(
  accessToken: string,
): Promise<CompanyVerificationDocumentResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application/documents`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyVerificationDocumentResult[]>;
  }
  throw await parseApiError(response, 'Failed to load verification documents');
}

export async function uploadCompanyVerificationDocument(
  accessToken: string,
  input: UploadCompanyVerificationDocumentInput,
): Promise<CompanyVerificationDocumentResult> {
  const formData = new FormData();
  formData.append('type', input.type);
  formData.append('file', input.file, input.file.name);

  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/application/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (response.ok) {
    return response.json() as Promise<CompanyVerificationDocumentResult>;
  }
  throw await parseApiError(response, 'Failed to upload document');
}

export async function removeCompanyVerificationDocument(
  accessToken: string,
  documentId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/me/application/documents/${encodeURIComponent(documentId)}`,
    { method: 'DELETE', headers: companyAuthHeaders(accessToken) },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to remove document');
}

// --- Admin: Company application review ---

export async function listCompanyApplications(
  accessToken: string,
  query: CompanyApplicationListQuery = {},
): Promise<PaginatedCompanyApplicationResult> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.submittedFrom) params.set('submittedFrom', query.submittedFrom);
  if (query.submittedTo) params.set('submittedTo', query.submittedTo);

  const qs = params.toString();
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications${qs ? `?${qs}` : ''}`,
    { headers: companyAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<PaginatedCompanyApplicationResult>;
  }
  throw await parseApiError(response, 'Failed to load applications');
}

export async function getCompanyApplicationForReview(
  accessToken: string,
  applicationId: string,
): Promise<CompanyApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications/${encodeURIComponent(applicationId)}`,
    { headers: companyAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to load application');
}

export async function startCompanyApplicationReview(
  accessToken: string,
  applicationId: string,
): Promise<CompanyApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications/${encodeURIComponent(applicationId)}/start-review`,
    { method: 'POST', headers: companyAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to start review');
}

export async function approveCompanyApplication(
  accessToken: string,
  applicationId: string,
  input: { reviewerNote?: string },
): Promise<CompanyApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications/${encodeURIComponent(applicationId)}/approve`,
    { method: 'POST', headers: companyAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to approve application');
}

export async function rejectCompanyApplication(
  accessToken: string,
  applicationId: string,
  input: ReviewCompanyApplicationInput,
): Promise<CompanyApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications/${encodeURIComponent(applicationId)}/reject`,
    { method: 'POST', headers: companyAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to reject application');
}

export async function requestCompanyApplicationChanges(
  accessToken: string,
  applicationId: string,
  input: { reviewerNote: string },
): Promise<CompanyApplicationReviewDetail> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/manage/companies/applications/${encodeURIComponent(applicationId)}/request-changes`,
    { method: 'POST', headers: companyAuthHeaders(accessToken), body: JSON.stringify(input) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyApplicationReviewDetail>;
  }
  throw await parseApiError(response, 'Failed to request changes');
}

// ---------------------------------------------------------------------------
// Company Team and Permissions (NH-M20)
// ---------------------------------------------------------------------------

import type {
  CompanyMemberRoleValue,
  CompanyMemberResult,
  CompanyInvitationResult,
  MyCompanyInvitationResult,
  CreateCompanyInvitationInput,
  CompanyInvitableRoleValue,
} from '@nexthire/types';

export async function getMyCompanyTeamRole(
  accessToken: string,
): Promise<{ role: CompanyMemberRoleValue | null }> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/team/role`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<{ role: CompanyMemberRoleValue | null }>;
  }
  throw await parseApiError(response, 'Failed to load team role');
}

export async function listMyCompanyTeam(accessToken: string): Promise<CompanyMemberResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/team`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyMemberResult[]>;
  }
  throw await parseApiError(response, 'Failed to load company team');
}

export async function updateCompanyTeamMemberRole(
  accessToken: string,
  memberId: string,
  role: CompanyInvitableRoleValue,
): Promise<CompanyMemberResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/me/team/members/${encodeURIComponent(memberId)}`,
    { method: 'PATCH', headers: companyAuthHeaders(accessToken), body: JSON.stringify({ role }) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyMemberResult>;
  }
  throw await parseApiError(response, 'Failed to update member role');
}

export async function removeCompanyTeamMember(
  accessToken: string,
  memberId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/me/team/members/${encodeURIComponent(memberId)}`,
    { method: 'DELETE', headers: companyAuthHeaders(accessToken) },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to remove team member');
  }
}

export async function listMyCompanyInvitations(
  accessToken: string,
): Promise<CompanyInvitationResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/team/invitations`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyInvitationResult[]>;
  }
  throw await parseApiError(response, 'Failed to load invitations');
}

export async function createCompanyInvitation(
  accessToken: string,
  input: CreateCompanyInvitationInput,
): Promise<CompanyInvitationResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/me/team/invitations`, {
    method: 'POST',
    headers: companyAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<CompanyInvitationResult>;
  }
  throw await parseApiError(response, 'Failed to send invitation');
}

export async function revokeCompanyInvitation(
  accessToken: string,
  invitationId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/me/team/invitations/${encodeURIComponent(invitationId)}`,
    { method: 'DELETE', headers: companyAuthHeaders(accessToken) },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to revoke invitation');
  }
}

// --- Invitations addressed to the current user ---

export async function listMyPendingCompanyInvitations(
  accessToken: string,
): Promise<MyCompanyInvitationResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/companies/invitations/me`, {
    headers: companyAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<MyCompanyInvitationResult[]>;
  }
  throw await parseApiError(response, 'Failed to load your invitations');
}

export async function acceptCompanyInvitation(
  accessToken: string,
  invitationId: string,
): Promise<CompanyMemberResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/invitations/${encodeURIComponent(invitationId)}/accept`,
    { method: 'POST', headers: companyAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CompanyMemberResult>;
  }
  throw await parseApiError(response, 'Failed to accept invitation');
}

export async function declineCompanyInvitation(
  accessToken: string,
  invitationId: string,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/companies/invitations/${encodeURIComponent(invitationId)}/decline`,
    { method: 'POST', headers: companyAuthHeaders(accessToken) },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to decline invitation');
  }
}

// --- Expert: Expertise areas ---

export async function getExpertiseAreas(): Promise<ExpertiseAreaResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/expertise-areas`);
  if (response.ok) {
    return response.json() as Promise<ExpertiseAreaResult[]>;
  }
  throw await parseApiError(response, 'Failed to load expertise areas');
}

export async function getMyExpertExpertise(accessToken: string): Promise<ExpertExpertiseResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/expertise`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertExpertiseResult>;
  }
  throw await parseApiError(response, 'Failed to load expert expertise');
}

export async function setMyExpertExpertise(
  accessToken: string,
  input: ExpertExpertiseInput,
): Promise<ExpertExpertiseResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/expertise`, {
    method: 'PUT',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertExpertiseResult>;
  }
  throw await parseApiError(response, 'Failed to save expert expertise');
}

export async function deleteMyExpertExpertiseItem(accessToken: string, id: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/expertise/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: expertAuthHeaders(accessToken),
    },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to delete expertise item');
}

// --- Expert: Services ---

export async function getMyExpertServices(
  accessToken: string,
  status?: string,
): Promise<ExpertServiceResult[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/services${params}`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertServiceResult[]>;
  }
  throw await parseApiError(response, 'Failed to load expert services');
}

export async function createExpertService(
  accessToken: string,
  input: ExpertServiceInput,
): Promise<ExpertServiceResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/services`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertServiceResult>;
  }
  throw await parseApiError(response, 'Failed to create expert service');
}

export async function getExpertService(
  accessToken: string,
  id: string,
): Promise<ExpertServiceResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/services/${encodeURIComponent(id)}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertServiceResult>;
  }
  throw await parseApiError(response, 'Failed to load expert service');
}

export async function updateExpertService(
  accessToken: string,
  id: string,
  input: Partial<ExpertServiceInput>,
): Promise<ExpertServiceResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/services/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: expertAuthHeaders(accessToken),
      body: JSON.stringify(input),
    },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertServiceResult>;
  }
  throw await parseApiError(response, 'Failed to update expert service');
}

export async function lifecycleExpertService(
  accessToken: string,
  id: string,
  action: string,
): Promise<ExpertServiceResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/services/${encodeURIComponent(id)}/${encodeURIComponent(action)}`,
    {
      method: 'POST',
      headers: expertAuthHeaders(accessToken),
    },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertServiceResult>;
  }
  throw await parseApiError(response, 'Failed to update service lifecycle');
}

export async function getExpertServiceReadiness(
  accessToken: string,
  id: string,
): Promise<ExpertServiceReadiness> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/services/${encodeURIComponent(id)}/readiness`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertServiceReadiness>;
  }
  throw await parseApiError(response, 'Failed to check service readiness');
}

// --- Expert: Availability ---

export async function getMyAvailabilityProfile(
  accessToken: string,
): Promise<ExpertAvailabilityProfileResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/availability/profile`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilityProfileResult>;
  }
  throw await parseApiError(response, 'Failed to load availability profile');
}

export async function updateMyAvailabilityProfile(
  accessToken: string,
  input: ExpertAvailabilityProfileInput,
): Promise<ExpertAvailabilityProfileResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/availability/profile`, {
    method: 'PUT',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilityProfileResult>;
  }
  throw await parseApiError(response, 'Failed to save availability profile');
}

export async function getMyWeeklyAvailability(
  accessToken: string,
): Promise<ExpertWeeklyAvailabilityResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/availability/weekly`, {
    headers: expertAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertWeeklyAvailabilityResult>;
  }
  throw await parseApiError(response, 'Failed to load weekly availability');
}

export async function setMyWeeklyAvailability(
  accessToken: string,
  input: ExpertWeeklyAvailabilityInput,
): Promise<ExpertWeeklyAvailabilityResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/availability/weekly`, {
    method: 'PUT',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertWeeklyAvailabilityResult>;
  }
  throw await parseApiError(response, 'Failed to save weekly availability');
}

export async function getMyAvailabilityOverrides(
  accessToken: string,
  from?: string,
  to?: string,
): Promise<ExpertAvailabilityOverrideResult[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/availability/overrides${qs ? `?${qs}` : ''}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilityOverrideResult[]>;
  }
  throw await parseApiError(response, 'Failed to load availability overrides');
}

export async function createMyAvailabilityOverride(
  accessToken: string,
  input: ExpertAvailabilityOverrideInput,
): Promise<ExpertAvailabilityOverrideResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/expert/availability/overrides`, {
    method: 'POST',
    headers: expertAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilityOverrideResult>;
  }
  throw await parseApiError(response, 'Failed to create availability override');
}

export async function deleteMyAvailabilityOverride(accessToken: string, id: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/availability/overrides/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: expertAuthHeaders(accessToken),
    },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to delete availability override');
}

export async function previewMyAvailabilitySlots(
  accessToken: string,
  params: { from: string; to: string; durationMinutes?: number },
): Promise<ExpertAvailabilitySlotPreviewResult> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  if (params.durationMinutes) query.set('durationMinutes', String(params.durationMinutes));
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/expert/availability/slots/preview?${query.toString()}`,
    { headers: expertAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<ExpertAvailabilitySlotPreviewResult>;
  }
  throw await parseApiError(response, 'Failed to preview availability slots');
}

// --- MFA (two-factor authentication) ---

export interface MfaSecurityStatusResult {
  status: 'DISABLED' | 'PENDING' | 'ENABLED';
  requiredByPolicy: boolean;
  enabledAt: string | null;
  recoveryCodesRemaining: number;
  trustedDeviceCount: number;
  currentDeviceTrusted: boolean;
  enrollmentExpiresAt: string | null;
}

export interface BeginMfaEnrollmentResult {
  qrDataUrl: string;
  manualSecret: string;
  enrollmentExpiresAt: string;
}

export interface ConfirmMfaEnrollmentResult {
  recoveryCodes: string[];
  enabledAt: string;
}

export interface RegenerateMfaRecoveryCodesResult {
  recoveryCodes: string[];
  generatedAt: string;
}

export interface MfaTrustedDeviceSummary {
  id: string;
  deviceName: string | null;
  browserSummary: string | null;
  trustedAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export interface VerifyMfaChallengePayload {
  challengeToken: string;
  method: 'TOTP' | 'RECOVERY_CODE';
  code: string;
  trustDevice?: boolean;
  deviceName?: string;
}

function mfaAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export async function getMfaStatus(accessToken: string): Promise<MfaSecurityStatusResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/status`, {
    credentials: 'include',
    headers: mfaAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<MfaSecurityStatusResult>;
  }
  throw await parseApiError(response, 'Failed to load two-factor status');
}

export async function beginMfaEnrollment(
  accessToken: string,
  currentPassword: string,
): Promise<BeginMfaEnrollmentResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/enrollment`, {
    method: 'POST',
    headers: mfaAuthHeaders(accessToken),
    body: JSON.stringify({ currentPassword }),
  });
  if (response.ok) {
    return response.json() as Promise<BeginMfaEnrollmentResult>;
  }
  throw await parseApiError(response, 'Failed to start two-factor setup');
}

export async function confirmMfaEnrollment(
  accessToken: string,
  code: string,
): Promise<ConfirmMfaEnrollmentResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/enrollment/confirm`, {
    method: 'POST',
    headers: mfaAuthHeaders(accessToken),
    body: JSON.stringify({ code }),
  });
  if (response.ok) {
    return response.json() as Promise<ConfirmMfaEnrollmentResult>;
  }
  throw await parseApiError(response, 'Failed to confirm two-factor setup');
}

export async function disableMfa(
  accessToken: string,
  currentPassword: string,
  code: string,
): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/disable`, {
    method: 'POST',
    credentials: 'include',
    headers: mfaAuthHeaders(accessToken),
    body: JSON.stringify({ currentPassword, code }),
  });
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to disable two-factor authentication');
}

export async function regenerateMfaRecoveryCodes(
  accessToken: string,
  code: string,
): Promise<RegenerateMfaRecoveryCodesResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/recovery-codes/regenerate`, {
    method: 'POST',
    headers: mfaAuthHeaders(accessToken),
    body: JSON.stringify({ code }),
  });
  if (response.ok) {
    return response.json() as Promise<RegenerateMfaRecoveryCodesResult>;
  }
  throw await parseApiError(response, 'Failed to regenerate recovery codes');
}

export async function listMfaTrustedDevices(
  accessToken: string,
): Promise<{ devices: MfaTrustedDeviceSummary[] }> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/trusted-devices`, {
    headers: mfaAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<{ devices: MfaTrustedDeviceSummary[] }>;
  }
  throw await parseApiError(response, 'Failed to load trusted devices');
}

export async function revokeMfaTrustedDevice(accessToken: string, deviceId: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/auth/mfa/trusted-devices/${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
      headers: mfaAuthHeaders(accessToken),
    },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to revoke trusted device');
}

export async function revokeAllMfaTrustedDevices(accessToken: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/trusted-devices`, {
    method: 'DELETE',
    credentials: 'include',
    headers: mfaAuthHeaders(accessToken),
  });
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to revoke trusted devices');
}

export async function verifyMfaChallenge(
  payload: VerifyMfaChallengePayload,
): Promise<LoginCandidateResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/auth/mfa/challenge/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (response.ok) {
    return response.json() as Promise<LoginCandidateResult>;
  }
  throw await parseApiError(response, 'Verification failed');
}

// --- Candidate profile photo ---

export interface CandidatePhotoStatusResult {
  hasPhoto: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
}

export async function getMyPhotoStatus(accessToken: string): Promise<CandidatePhotoStatusResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/photo/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    return response.json() as Promise<CandidatePhotoStatusResult>;
  }
  throw await parseApiError(response, 'Failed to load photo status');
}

export async function uploadMyPhoto(
  accessToken: string,
  file: File,
): Promise<CandidatePhotoStatusResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/photo`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (response.ok) {
    return response.json() as Promise<CandidatePhotoStatusResult>;
  }
  throw await parseApiError(response, 'Failed to upload photo');
}

/**
 * Fetches the private photo bytes and returns an object URL for rendering.
 * Caller must revoke the URL when finished to avoid leaks.
 */
export async function fetchMyPhotoObjectUrl(accessToken: string): Promise<string | null> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/photo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) {
    return null;
  }
  if (response.ok) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
  throw await parseApiError(response, 'Failed to load photo');
}

export async function deleteMyPhoto(accessToken: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/candidates/me/profile/photo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to remove photo');
}

// --- CV Builder ---

export interface CvResult {
  id: string;
  userId: string;
  title: string;
  template: string;
  visibility: string;
  isDefault: boolean;
  completionScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CvReadinessResult {
  ready: boolean;
  missingSections: string[];
  completionScore: number;
}

export interface CvSectionContentResult {
  cvId: string;
  sectionType: string;
  content: Record<string, any>;
  updatedAt: string;
}

export interface CvExportResult {
  id: string;
  cvId: string;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  fileSizeBytes: number | null;
  failureCategory: string | null;
  requestedAt: string;
  generatedAt: string | null;
  failedAt: string | null;
}

export const CV_SECTION_TYPES = [
  'personal_info',
  'professional_summary',
  'education',
  'work_experience',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
] as const;

export type CvSectionType = (typeof CV_SECTION_TYPES)[number];

function cvAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export async function listMyCvs(accessToken: string): Promise<CvResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs`, {
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CvResult[]>;
  }
  throw await parseApiError(response, 'Failed to load CVs');
}

export async function createCv(
  accessToken: string,
  input: { title: string; template?: string },
): Promise<CvResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs`, {
    method: 'POST',
    headers: cvAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<CvResult>;
  }
  throw await parseApiError(response, 'Failed to create CV');
}

export async function getCv(accessToken: string, cvId: string): Promise<CvResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}`, {
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CvResult>;
  }
  throw await parseApiError(response, 'Failed to load CV');
}

export async function updateCv(
  accessToken: string,
  cvId: string,
  input: { title?: string; template?: string; visibility?: string },
): Promise<CvResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}`, {
    method: 'PUT',
    headers: cvAuthHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (response.ok) {
    return response.json() as Promise<CvResult>;
  }
  throw await parseApiError(response, 'Failed to update CV');
}

export async function deleteCv(accessToken: string, cvId: string): Promise<void> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}`, {
    method: 'DELETE',
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to delete CV');
}

export async function setDefaultCv(accessToken: string, cvId: string): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/set-default`,
    { method: 'POST', headers: cvAuthHeaders(accessToken) },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to set default CV');
}

export async function duplicateCv(
  accessToken: string,
  cvId: string,
  title: string,
): Promise<CvResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/duplicate`,
    {
      method: 'POST',
      headers: cvAuthHeaders(accessToken),
      body: JSON.stringify({ title }),
    },
  );
  if (response.ok) {
    return response.json() as Promise<CvResult>;
  }
  throw await parseApiError(response, 'Failed to duplicate CV');
}

export async function getCvReadiness(
  accessToken: string,
  cvId: string,
): Promise<CvReadinessResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/readiness`,
    { headers: cvAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CvReadinessResult>;
  }
  throw await parseApiError(response, 'Failed to load CV readiness');
}

export async function getCvExportPreviewHtml(accessToken: string, cvId: string): Promise<string> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/export/html`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (response.ok) {
    return response.text();
  }
  throw await parseApiError(response, 'Failed to load CV preview');
}

export async function getAllCvSections(
  accessToken: string,
  cvId: string,
): Promise<CvSectionContentResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/sections`, {
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CvSectionContentResult[]>;
  }
  throw await parseApiError(response, 'Failed to load CV sections');
}

export async function updateCvSectionContent(
  accessToken: string,
  cvId: string,
  sectionType: CvSectionType,
  content: Record<string, any>,
): Promise<CvSectionContentResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/sections/${encodeURIComponent(sectionType)}`,
    {
      method: 'PUT',
      headers: cvAuthHeaders(accessToken),
      body: JSON.stringify({ content }),
    },
  );
  if (response.ok) {
    return response.json() as Promise<CvSectionContentResult>;
  }
  throw await parseApiError(response, 'Failed to update CV section');
}

export async function importCvSectionFromProfile(
  accessToken: string,
  cvId: string,
  sectionType: CvSectionType,
): Promise<CvSectionContentResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/sections/${encodeURIComponent(sectionType)}/import-from-profile`,
    { method: 'POST', headers: cvAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CvSectionContentResult>;
  }
  throw await parseApiError(response, 'Failed to import from profile');
}

export async function toggleCvSection(
  accessToken: string,
  cvId: string,
  sectionType: CvSectionType,
  enabled: boolean,
): Promise<void> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/sections/${encodeURIComponent(sectionType)}/toggle`,
    {
      method: 'PATCH',
      headers: cvAuthHeaders(accessToken),
      body: JSON.stringify({ enabled }),
    },
  );
  if (response.ok || response.status === 204) {
    return;
  }
  throw await parseApiError(response, 'Failed to toggle CV section');
}

export async function requestCvExport(accessToken: string, cvId: string): Promise<CvExportResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/exports`, {
    method: 'POST',
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CvExportResult>;
  }
  throw await parseApiError(response, 'Failed to start CV export');
}

export async function listCvExports(accessToken: string, cvId: string): Promise<CvExportResult[]> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/exports`, {
    headers: cvAuthHeaders(accessToken),
  });
  if (response.ok) {
    return response.json() as Promise<CvExportResult[]>;
  }
  throw await parseApiError(response, 'Failed to load export history');
}

export async function getCvExport(
  accessToken: string,
  cvId: string,
  exportId: string,
): Promise<CvExportResult> {
  const response = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/exports/${encodeURIComponent(exportId)}`,
    { headers: cvAuthHeaders(accessToken) },
  );
  if (response.ok) {
    return response.json() as Promise<CvExportResult>;
  }
  throw await parseApiError(response, 'Failed to load export status');
}

export async function downloadCvExportBlob(
  accessToken: string,
  cvId: string,
  exportId: string,
): Promise<Blob> {
  const downloadResponse = await fetch(
    `${publicEnv.apiBaseUrl}/cvs/${encodeURIComponent(cvId)}/exports/${encodeURIComponent(exportId)}/download`,
    { method: 'POST', headers: cvAuthHeaders(accessToken) },
  );
  if (!downloadResponse.ok) {
    throw await parseApiError(downloadResponse, 'Failed to prepare CV download');
  }
  const { downloadUrl } = (await downloadResponse.json()) as { downloadUrl: string };

  // downloadUrl is server-root-relative (e.g. /api/v1/cvs/:id/exports/:id/file);
  // apiBaseUrl already includes /api/v1, so strip that shared prefix before joining.
  const isAbsolute = /^https?:\/\//i.test(downloadUrl);
  const apiRoot = publicEnv.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  const fileUrl = isAbsolute ? downloadUrl : `${apiRoot}${downloadUrl}`;

  const fileResponse = await fetch(fileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!fileResponse.ok) {
    throw await parseApiError(fileResponse, 'Failed to download CV');
  }
  return fileResponse.blob();
}

async function fetchApi(path: string, init?: RequestInit) {
  const response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || `Request failed: ${response.status}`), {
      statusCode: response.status,
      errors: body.errors,
    });
  }
  return response.json();
}

// ==========================================
// Admin Dashboard endpoints
// ==========================================
export async function getAdminStats(token: string) {
  return fetchApi('/admin/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminOverview(token: string) {
  return fetchApi('/admin/dashboard/overview', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminActivity(token: string) {
  return fetchApi('/admin/dashboard/activity', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAlerts(token: string) {
  return fetchApi('/admin/dashboard/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminGrowthUsers(token: string) {
  return fetchApi('/admin/analytics/growth/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenueTrends(token: string) {
  return fetchApi('/admin/analytics/revenue/trends', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminGrowthRoles(token: string) {
  return fetchApi('/admin/analytics/growth/roles', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminGrowthCountries(token: string) {
  return fetchApi('/admin/analytics/growth/countries', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminGrowthRetention(token: string) {
  return fetchApi('/admin/analytics/growth/retention', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminGrowthFunnel(token: string) {
  return fetchApi('/admin/analytics/growth/funnel', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenueSources(token: string) {
  return fetchApi('/admin/analytics/revenue/sources', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenueCountries(token: string) {
  return fetchApi('/admin/analytics/revenue/countries', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenuePayments(token: string) {
  return fetchApi('/admin/analytics/revenue/payments', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenueCommission(token: string) {
  return fetchApi('/admin/analytics/revenue/commission', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRevenueRefunds(token: string) {
  return fetchApi('/admin/analytics/revenue/refunds', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceApi(token: string) {
  return fetchApi('/admin/analytics/performance/api', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceQueue(token: string) {
  return fetchApi('/admin/analytics/performance/queue', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceErrors(token: string) {
  return fetchApi('/admin/analytics/performance/errors', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceSystem(token: string) {
  return fetchApi('/admin/analytics/performance/system', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceDatabase(token: string) {
  return fetchApi('/admin/analytics/performance/database', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPerformanceUptime(token: string) {
  return fetchApi('/admin/analytics/performance/uptime', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminUsers(token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/users${qs}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminUser(token: string, id: string) {
  return fetchApi(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateAdminUserStatus(
  token: string,
  id: string,
  status: string,
  reason?: string,
) {
  return fetchApi(`/admin/users/${id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, reason }),
  });
}

export async function forceAdminUserLogout(token: string, id: string) {
  return fetchApi(`/admin/users/${id}/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteAdminUser(token: string, id: string) {
  return fetchApi(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminSuspendedUsers(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/users/suspended?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function activateAdminSuspendedUser(token: string, id: string) {
  return fetchApi(`/admin/users/suspended/${id}/activate`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPendingVerifications(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/users/verification/pending?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminVerifiedAccounts(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/users/verification/verified?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function verifyAdminUser(token: string, id: string) {
  return fetchApi(`/admin/users/verification/${id}/verify`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function rejectAdminVerification(token: string, id: string) {
  return fetchApi(`/admin/users/verification/${id}/reject`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRoles(token: string) {
  return fetchApi('/admin/roles', { headers: { Authorization: `Bearer ${token}` } });
}

export async function createAdminRole(
  token: string,
  data: { code: string; name: string; description?: string },
) {
  return fetchApi('/admin/roles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function getAdminRole(token: string, id: string) {
  return fetchApi(`/admin/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function deleteAdminRole(token: string, id: string) {
  return fetchApi(`/admin/roles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function assignAdminUserRole(token: string, userId: string, roleCode: string) {
  return fetchApi(`/admin/users/${userId}/roles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roleCode }),
  });
}

export async function removeAdminUserRole(token: string, userId: string, roleId: string) {
  return fetchApi(`/admin/users/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidates(token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/candidates${qs}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminCandidate(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminCandidateProfile(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidatePassport(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}/passport`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateAssessments(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateActivity(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}/activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateProjects(token: string, id: string) {
  return fetchApi(`/admin/candidates/${id}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateSkillsPending(token: string) {
  return fetchApi('/admin/candidates/skills/pending', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function verifyAdminCandidateSkill(token: string, id: string) {
  return fetchApi(`/admin/candidates/skills/${id}/verify`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReadiness(token: string) {
  return fetchApi('/admin/candidates/readiness/distribution', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsRegistration(token: string) {
  return fetchApi('/admin/candidates/reports/registration', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsCompletion(token: string) {
  return fetchApi('/admin/candidates/reports/completion', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsReadiness(token: string) {
  return fetchApi('/admin/candidates/reports/readiness', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsCountries(token: string) {
  return fetchApi('/admin/candidates/reports/countries', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsSkills(token: string) {
  return fetchApi('/admin/candidates/reports/skills', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminCandidateReportsExport(token: string, format = 'csv') {
  return fetchApi(`/admin/candidates/reports/export?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExperts(token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/experts${qs}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminExpert(token: string, id: string) {
  return fetchApi(`/admin/experts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminExpertProfile(token: string, id: string) {
  return fetchApi(`/admin/experts/${id}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertServices(token: string, id: string) {
  return fetchApi(`/admin/experts/${id}/services`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertBookings(token: string, id: string) {
  return fetchApi(`/admin/experts/${id}/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertVerificationPending(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/experts/verification/pending?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertVerificationDetail(token: string, id: string) {
  return fetchApi(`/admin/experts/verification/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function approveAdminExpertVerification(token: string, id: string, note?: string) {
  return fetchApi(`/admin/experts/verification/${id}/approve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ note }),
  });
}

export async function rejectAdminExpertVerification(token: string, id: string, reason?: string) {
  return fetchApi(`/admin/experts/verification/${id}/reject`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminExpertTop(token: string, limit = '10') {
  return fetchApi(`/admin/experts/performance/top?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertComplaints(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/experts/complaints?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminExpertReportsRegistration(token: string) {
  return fetchApi('/admin/experts/reports/registration', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminLogs(token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/logs${qs}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminErrorLogs(token: string, page = '1', limit = '50') {
  return fetchApi(`/admin/logs/errors?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAccessLogs(token: string, page = '1', limit = '50', userId?: string) {
  let qs = `page=${page}&limit=${limit}`;
  if (userId) qs += `&userId=${userId}`;
  return fetchApi(`/admin/logs/access?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminLogDetail(token: string, id: string) {
  return fetchApi(`/admin/logs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminAuditStats(token: string) {
  return fetchApi('/admin/logs/audit/stats', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminAuditActionTypes(token: string) {
  return fetchApi('/admin/logs/audit/action-types', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAuditExport(token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/logs/audit/export${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminMaintenanceStatus(token: string) {
  return fetchApi('/admin/maintenance/status', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminMaintenanceHealth(token: string) {
  return fetchApi('/admin/maintenance/health', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminMaintenanceHistory(token: string) {
  return fetchApi('/admin/maintenance/history', { headers: { Authorization: `Bearer ${token}` } });
}

export async function toggleAdminMaintenanceMode(
  token: string,
  enabled: boolean,
  message?: string,
) {
  return fetchApi('/admin/maintenance/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled, message }),
  });
}

export async function getAdminSecurityOverview(token: string) {
  return fetchApi('/admin/security/overview', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminSecuritySuspicious(token: string) {
  return fetchApi('/admin/security/suspicious', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminSecuritySessions(token: string, page = '1', limit = '20') {
  return fetchApi(`/admin/security/sessions?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminSecurityPolicies(token: string) {
  return fetchApi('/admin/security/policies', { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateAdminSecurityPolicies(token: string, policies: any) {
  return fetchApi('/admin/security/policies', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(policies),
  });
}

export async function getAdminSettings(token: string) {
  return fetchApi('/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminSettingsGroup(token: string, group: string) {
  return fetchApi(`/admin/settings/${group}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateAdminSettingsGroup(token: string, group: string, data: any) {
  return fetchApi(`/admin/settings/${group}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
