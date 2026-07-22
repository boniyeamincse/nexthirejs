export interface AssessmentRetakePolicy {
  retakeEnabled: boolean;
  maximumAttempts: number | null;
  retakeCooldownHours: number;
  certificateEnabled: boolean;
  certificateValidityDays: number | null;
}

export interface UpdateAssessmentRetakePolicyInput {
  retakeEnabled?: boolean;
  maximumAttempts?: number | null;
  retakeCooldownHours?: number;
  certificateEnabled?: boolean;
  certificateValidityDays?: number | null;
}

export type AssessmentRetakeEligibilityReason =
  | 'FIRST_ATTEMPT_AVAILABLE'
  | 'RETAKE_AVAILABLE'
  | 'ACTIVE_ATTEMPT_EXISTS'
  | 'RETAKE_DISABLED'
  | 'ATTEMPT_LIMIT_REACHED'
  | 'COOLDOWN_ACTIVE'
  | 'ASSESSMENT_UNAVAILABLE'
  | 'ACCOUNT_UNAVAILABLE';

export interface AssessmentRetakeEligibility {
  assessmentId: string;
  eligible: boolean;
  reason: AssessmentRetakeEligibilityReason;
  attemptsUsed: number;
  maximumAttempts: number | null;
  attemptsRemaining: number | null;
  cooldownEndsAt: string | null;
  nextEligibleAt: string | null;
  bestPercentage: number | null;
  latestPercentage: number | null;
}
