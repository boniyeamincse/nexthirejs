export interface CandidateCertificationResult {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  doesNotExpire: boolean;
  credentialId: string | null;
  credentialUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
