import type { ExpertRatingAggregate, ExpertReviewResult } from './expert-feedback.js';
import type { ExpertWalletResult } from './expert-wallet.js';

export interface ExpertDashboardBookingSummary {
  id: string;
  serviceTitle: string;
  candidateDisplayName: string;
  slotStartUtc: string;
  durationMinutes: number;
}

export interface ExpertDashboardStats {
  upcomingBookingsCount: number;
  completedSessionsCount: number;
  activeServicesCount: number;
  rating: ExpertRatingAggregate;
}

export interface ExpertDashboardResult {
  stats: ExpertDashboardStats;
  upcomingBookings: ExpertDashboardBookingSummary[];
  wallet: ExpertWalletResult | null;
  recentReviews: ExpertReviewResult[];
  hasAvailabilityConfigured: boolean;
}
