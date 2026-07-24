import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertDashboardPage from '@/app/(authenticated)/expert/dashboard/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertDashboardResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const dashboard: ExpertDashboardResult = {
  stats: {
    upcomingBookingsCount: 2,
    completedSessionsCount: 5,
    activeServicesCount: 1,
    rating: { average: 4.5, count: 8 },
  },
  upcomingBookings: [
    {
      id: 'booking-1',
      serviceTitle: 'Mock Interview',
      candidateDisplayName: 'Alex Candidate',
      slotStartUtc: '2026-08-05T09:00:00.000Z',
      durationMinutes: 30,
    },
  ],
  wallet: {
    id: 'wallet-1',
    balance: '0.00',
    currency: 'USD',
    status: 'ACTIVE',
    totalEarnings: '0.00',
    totalPayouts: '0.00',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    recentTransactions: [],
  },
  recentReviews: [
    {
      id: 'review-1',
      bookingId: 'booking-2',
      expertUserId: 'expert-1',
      candidateId: 'candidate-1',
      rating: 5,
      comment: 'Great session',
      isHidden: false,
      hiddenReason: null,
      submittedAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  hasAvailabilityConfigured: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('ExpertDashboardPage', () => {
  it('renders stats, upcoming bookings, wallet, and reviews', async () => {
    vi.spyOn(apiClient, 'getMyExpertDashboard').mockResolvedValue(dashboard);
    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    expect(screen.getByText(/Mock Interview/)).toBeInTheDocument();
    expect(screen.getByText(/Alex Candidate/)).toBeInTheDocument();
    expect(screen.getByText('★ 4.5')).toBeInTheDocument();
  });

  it('prompts to set up availability when not configured', async () => {
    vi.spyOn(apiClient, 'getMyExpertDashboard').mockResolvedValue({
      ...dashboard,
      hasAvailabilityConfigured: false,
    });
    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Set up availability')).toHaveAttribute(
        'href',
        '/expert/availability',
      );
    });
  });

  it('shows a no-wallet message when the wallet has not been set up', async () => {
    vi.spyOn(apiClient, 'getMyExpertDashboard').mockResolvedValue({ ...dashboard, wallet: null });
    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No wallet set up yet.')).toBeInTheDocument();
    });
  });

  it('shows a retryable error banner on failure', async () => {
    vi.spyOn(apiClient, 'getMyExpertDashboard').mockRejectedValue(new Error('boom'));
    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load your dashboard. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'getMyExpertDashboard').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<ExpertDashboardPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
