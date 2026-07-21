export interface CandidateRegistrationInput {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
}

export interface CandidateRegistrationResult {
  userId: string;
  email: string;
  status: 'PENDING_VERIFICATION';
  emailVerificationRequired: true;
  createdAt: string;
}
