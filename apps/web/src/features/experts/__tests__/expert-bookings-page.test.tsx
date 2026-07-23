import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import ExpertBookingsPage from '@/app/(authenticated)/expert/bookings/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertBookingResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const confirmedPastBooking: ExpertBookingResult = {
  id: 'booking-1',
  expertUserId: 'expert-1',
  expertServiceId: 's1',
  candidateId: 'candidate-1',
  status: 'CONFIRMED',
  slotStartUtc: '2020-01-01T09:00:00.000Z',
  slotEndUtc: '2020-01-01T09:30:00.000Z',
  holdExpiresAt: null,
  meetingUrl: null,
  notes: null,
  cancelledAt: null,
  completedAt: null,
  createdAt: '2020-01-01T08:00:00.000Z',
  updatedAt: '2020-01-01T08:00:00.000Z',
  service: {
    id: 's1',
    title: 'Backend mock interview',
    type: 'MOCK_INTERVIEW',
    durationMinutes: 30,
    price: { amount: '50.00', currency: 'USD' },
  },
  counterparty: { id: 'candidate-1', displayName: 'Alex Candidate' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('ExpertBookingsPage', () => {
  it('loads and renders received bookings', async () => {
    vi.spyOn(apiClient, 'listReceivedExpertBookings').mockResolvedValue([confirmedPastBooking]);
    render(<ExpertBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Backend mock interview')).toBeInTheDocument();
    });
    expect(screen.getByText('with Alex Candidate')).toBeInTheDocument();
    const card = screen.getByText('Backend mock interview').closest('div')!.parentElement!;
    expect(within(card).getByText('Confirmed')).toBeInTheDocument();
  });

  it('marks a past-due confirmed booking complete', async () => {
    vi.spyOn(apiClient, 'listReceivedExpertBookings').mockResolvedValue([confirmedPastBooking]);
    vi.spyOn(apiClient, 'updateReceivedExpertBooking').mockResolvedValue({
      ...confirmedPastBooking,
      status: 'COMPLETED',
    });
    render(<ExpertBookingsPage />);
    await waitFor(() => screen.getByText('Mark complete'));

    fireEvent.click(screen.getByText('Mark complete'));

    await waitFor(() => {
      expect(apiClient.updateReceivedExpertBooking).toHaveBeenCalledWith(
        'test-token',
        'booking-1',
        {
          action: 'complete',
        },
      );
    });
  });

  it('saves a meeting link for a confirmed booking', async () => {
    vi.spyOn(apiClient, 'listReceivedExpertBookings').mockResolvedValue([confirmedPastBooking]);
    vi.spyOn(apiClient, 'updateReceivedExpertBooking').mockResolvedValue({
      ...confirmedPastBooking,
      meetingUrl: 'https://meet.example.com/x',
    });
    render(<ExpertBookingsPage />);
    await waitFor(() => screen.getByPlaceholderText('Meeting link'));

    fireEvent.change(screen.getByPlaceholderText('Meeting link'), {
      target: { value: 'https://meet.example.com/x' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(apiClient.updateReceivedExpertBooking).toHaveBeenCalledWith(
        'test-token',
        'booking-1',
        {
          meetingUrl: 'https://meet.example.com/x',
        },
      );
    });
  });

  it('shows an empty state when there are no bookings', async () => {
    vi.spyOn(apiClient, 'listReceivedExpertBookings').mockResolvedValue([]);
    render(<ExpertBookingsPage />);
    await waitFor(() => {
      expect(screen.getByText('No bookings found.')).toBeInTheDocument();
    });
  });
});
