export type DataExportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface RequestCandidateDataExportResult {
  id: string;
  status: DataExportStatus;
  requestedAt: string;
}

export interface CandidateDataExportStatusResult {
  id: string;
  status: DataExportStatus;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  fileSizeBytes: number | null;
  downloadAvailable: boolean;
}

export interface CandidateDataExportDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface DeactivateCandidateAccountInput {
  currentPassword: string;
  confirmation: 'DEACTIVATE';
}

export interface DeactivateCandidateAccountResult {
  deactivated: true;
  sessionsRevoked: number;
}
