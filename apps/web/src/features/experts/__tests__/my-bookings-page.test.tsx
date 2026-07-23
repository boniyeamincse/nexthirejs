import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import MyBookingsPage from '@/app/(authenticated)/bookings/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertBookingResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const heldBooking: ExpertBookingResult = {
  id: 'booking-1',
  expertUserId: 'expert-1',
  expertServiceId: 's1',
  candidateId: 'candidate-1',
  status: 'HELD',
  slotStartUtc: '2026-08-03T09:00:00.000Z',
  slotEndUtc: '2026-08-03T09:30:00.000Z',
  holdExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  meetingUrl: null,
  notes: null,
  cancelledAt: null,
  completedAt: null,
  createdAt: '2026-08-03T08:00:00.000Z',
  updatedAt: '2026-08-03T08:00:00.000Z',
  service: {
    id: 's1',
    title: 'Backend mock interview',
    type: 'MOCK_INTERVIEW',
    durationMinutes: 30,
    price: { amount: '50.00', currency: 'USD' },
  },
  counterparty: { id: 'expert-1', displayName: 'Jane Expert' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('MyBookingsPage', () => {
  it('loads and renders bookings from the API', async () => {
    vi.spyOn(apiClient, 'listMyExpertBookings').mockResolvedValue([heldBooking]);
    render(<MyBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Backend mock interview')).toBeInTheDocument();
    });
    expect(screen.getByText('with Jane Expert')).toBeInTheDocument();
    const card = screen.getByText('Backend mock interview').closest('div')!.parentElement!;
    expect(within(card).getByText('Held')).toBeInTheDocument();
  });

  it('confirms a held booking and reloads the list', async () => {
    vi.spyOn(apiClient, 'listMyExpertBookings').mockResolvedValue([heldBooking]);
    vi.spyOn(apiClient, 'confirmMyExpertBooking').mockResolvedValue({
      ...heldBooking,
      status: 'CONFIRMED',
      holdExpiresAt: null,
    });
    render(<MyBookingsPage />);
    await waitFor(() => screen.getByText('Confirm'));

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(apiClient.confirmMyExpertBooking).toHaveBeenCalledWith('test-token', 'booking-1');
    });
  });

  it('cancels a booking and reloads the list', async () => {
    vi.spyOn(apiClient, 'listMyExpertBookings').mockResolvedValue([heldBooking]);
    vi.spyOn(apiClient, 'cancelMyExpertBooking').mockResolvedValue({
      ...heldBooking,
      status: 'CANCELLED',
    });
    render(<MyBookingsPage />);
    await waitFor(() => screen.getByText('Cancel'));

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(apiClient.cancelMyExpertBooking).toHaveBeenCalledWith('test-token', 'booking-1');
    });
  });

  it('logs out on a 401 while loading', async () => {
    vi.spyOn(apiClient, 'listMyExpertBookings').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<MyBookingsPage />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows an empty state when there are no bookings', async () => {
    vi.spyOn(apiClient, 'listMyExpertBookings').mockResolvedValue([]);
    render(<MyBookingsPage />);
    await waitFor(() => {
      expect(screen.getByText('No bookings found.')).toBeInTheDocument();
    });
  });
});
