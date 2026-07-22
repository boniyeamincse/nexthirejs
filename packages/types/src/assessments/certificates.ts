export enum AssessmentCertificateStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  READY = 'READY',
  FAILED = 'FAILED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export interface AssessmentCertificateListItem {
  id: string;
  certificateNumber: string;
  assessmentTitle: string;
  scorePercentage: number;
  status: AssessmentCertificateStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  downloadAvailable: boolean;
}

export interface AssessmentCertificateDetail {
  id: string;
  certificateNumber: string;
  holderName: string;
  assessmentTitle: string;
  scorePercentage: number;
  status: AssessmentCertificateStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  generatedAt: string | null;
  failedAt: string | null;
  failureCategory: string | null;
  downloadAvailable: boolean;
  verificationCodeHint: string | null;
}

export interface AssessmentCertificateDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface AssessmentCertificateVerificationResult {
  valid: boolean;
  status: 'VALID' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  certificateNumber: string | null;
  holderName: string | null;
  assessmentTitle: string | null;
  scorePercentage: number | null;
  issuedAt: string | null;
  expiresAt: string | null;
}
