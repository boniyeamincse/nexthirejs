export type MfaStatusValue = 'DISABLED' | 'PENDING' | 'ENABLED';
export type MfaChallengeMethod = 'TOTP' | 'RECOVERY_CODE';

export interface MfaSecurityStatus {
  status: MfaStatusValue;
  requiredByPolicy: boolean;
  enabledAt: string | null;
  recoveryCodesRemaining: number;
  trustedDeviceCount: number;
  currentDeviceTrusted: boolean;
  enrollmentExpiresAt: string | null;
}

export interface BeginMfaEnrollmentInput {
  currentPassword: string;
}

export interface BeginMfaEnrollmentResult {
  qrDataUrl: string;
  manualSecret: string;
  enrollmentExpiresAt: string;
}

export interface ConfirmMfaEnrollmentInput {
  code: string;
}

export interface ConfirmMfaEnrollmentResult {
  recoveryCodes: string[];
  enabledAt: string;
}

export interface VerifyMfaChallengeInput {
  challengeToken: string;
  method: MfaChallengeMethod;
  code: string;
  trustDevice?: boolean;
  deviceName?: string;
}

export interface MfaTrustedDeviceSummary {
  id: string;
  deviceName: string | null;
  browserSummary: string | null;
  trustedAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export interface MfaChallengeRequiredResult {
  mfaRequired: true;
  challengeToken: string;
  expiresAt: string;
  allowedMethods: MfaChallengeMethod[];
}
