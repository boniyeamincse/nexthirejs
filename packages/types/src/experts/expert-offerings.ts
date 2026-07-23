export type ExpertServiceType =
  | 'MOCK_INTERVIEW'
  | 'CV_REVIEW'
  | 'CAREER_COACHING'
  | 'TECHNICAL_INTERVIEW_PREPARATION'
  | 'BEHAVIORAL_INTERVIEW_PREPARATION'
  | 'PORTFOLIO_REVIEW';

export type ExpertServiceStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ExpertExpertiseLevel = 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type ExpertAvailabilityOverrideType = 'UNAVAILABLE' | 'CUSTOM_HOURS';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'BDT' | 'INR' | 'PKR';

export interface ExpertiseAreaResult {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ExpertExpertiseItemInput {
  expertiseAreaId: string;
  level: ExpertExpertiseLevel;
  yearsExperience?: number;
  isPrimary?: boolean;
}

export interface ExpertExpertiseInput {
  items: ExpertExpertiseItemInput[];
}

export interface ExpertExpertiseItemResult {
  id: string;
  expertiseAreaId: string;
  expertiseAreaSlug: string;
  expertiseAreaName: string;
  level: ExpertExpertiseLevel;
  yearsExperience: number | null;
  isPrimary: boolean;
}

export interface ExpertExpertiseResult {
  items: ExpertExpertiseItemResult[];
}

export interface MoneyAmount {
  amount: string;
  currency: SupportedCurrency;
}

export interface ExpertServiceInput {
  expertiseAreaId: string;
  type: ExpertServiceType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  durationMinutes: number;
  price: MoneyAmount;
  languageCodes: string[];
  preparationInstructions?: string | null;
}

export interface ExpertServiceResult {
  id: string;
  expertiseAreaId: string;
  expertiseAreaName: string;
  type: ExpertServiceType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  durationMinutes: number;
  price: MoneyAmount;
  languageCodes: string[];
  preparationInstructions: string | null;
  status: ExpertServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertServiceReadinessBlocker {
  code: string;
  message: string;
  field?: string;
}

export interface ExpertServiceReadiness {
  ready: boolean;
  blockers: ExpertServiceReadinessBlocker[];
}

export interface ExpertAvailabilityProfileInput {
  timezone: string;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  minimumNoticeHours?: number;
  bookingWindowDays?: number;
}

export interface ExpertAvailabilityProfileResult {
  id: string;
  timezone: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeHours: number;
  bookingWindowDays: number;
}

export interface ExpertWeeklyAvailabilityWindowInput {
  dayOfWeek: number;
  startLocalTime: string;
  endLocalTime: string;
}

export interface ExpertWeeklyAvailabilityInput {
  windows: ExpertWeeklyAvailabilityWindowInput[];
}

export interface ExpertWeeklyAvailabilityWindowResult {
  id: string;
  dayOfWeek: number;
  startLocalMinutes: number;
  endLocalMinutes: number;
}

export interface ExpertWeeklyAvailabilityResult {
  windows: ExpertWeeklyAvailabilityWindowResult[];
  timezone: string;
}

export interface ExpertAvailabilityOverrideInput {
  localDate: string;
  type: ExpertAvailabilityOverrideType;
  reason?: string | null;
  windows?: { startLocalTime: string; endLocalTime: string }[];
}

export interface ExpertAvailabilityOverrideResult {
  id: string;
  localDate: string;
  type: ExpertAvailabilityOverrideType;
  reason: string | null;
  windows: { startLocalMinutes: number; endLocalMinutes: number }[];
}

export interface ExpertAvailabilitySlot {
  startUtc: string;
  endUtc: string;
  localDate: string;
  startLocalTime: string;
  endLocalTime: string;
}

export interface ExpertAvailabilitySlotPreviewResult {
  timezone: string;
  durationMinutes: number;
  slots: ExpertAvailabilitySlot[];
}

export interface ExpertServiceLifecycleTransition {
  from: ExpertServiceStatus;
  to: ExpertServiceStatus;
}

export type ExpertBookingStatus = 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';

export interface CreateExpertBookingInput {
  expertServiceId: string;
  slotStartUtc: string;
}

export interface ExpertBookingResult {
  id: string;
  expertUserId: string;
  expertServiceId: string;
  candidateId: string;
  status: ExpertBookingStatus;
  slotStartUtc: string;
  slotEndUtc: string;
  holdExpiresAt: string | null;
  meetingUrl: string | null;
  notes: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    title: string;
    type: ExpertServiceType;
    durationMinutes: number;
    price: MoneyAmount;
  };
  counterparty: {
    id: string;
    displayName: string;
  };
}

export interface UpdateExpertBookingByExpertInput {
  meetingUrl?: string | null;
  notes?: string | null;
  action?: 'complete' | 'cancel';
}

export interface PublicExpertServiceSlotQuery {
  from: string;
  to: string;
}
