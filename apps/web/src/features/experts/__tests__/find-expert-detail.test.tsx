import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PublicExpertProfilePage from '@/app/find-expert/[slug]/page';
import * as apiClient from '@/lib/api-client';
import type { PublicExpertProfileDetail, ExpertBookingResult } from '@nexthire/types';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'senior-backend-engineer-abc123ef' }),
}));

const mockGetAccessToken = vi.fn();
let mockUser: { roleCodes: string[] } | null = null;

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    user: mockUser,
    status: mockUser ? 'authenticated' : 'unauthenticated',
  }),
}));

const detail: PublicExpertProfileDetail = {
  publicSlug: 'senior-backend-engineer-abc123ef',
  professionalTitle: 'Senior Backend Engineer',
  professionalSummary: 'Ten years building distributed systems at scale.',
  yearsOfExperience: 10,
  currentCompany: 'Acme Corp',
  currentPosition: 'Staff Engineer',
  highestEducation: 'MSc Computer Science',
  linkedinUrl: 'https://linkedin.com/in/jane',
  portfolioUrl: null,
  personalWebsiteUrl: null,
  interviewLanguages: ['en'],
  countryId: 'c1',
  city: 'Remote',
  expertise: [
    {
      areaName: 'Backend Development',
      areaSlug: 'backend-development',
      level: 'EXPERT',
      isPrimary: true,
    },
  ],
  services: [
    {
      id: 's1',
      type: 'MOCK_INTERVIEW',
      title: 'Backend mock interview',
      shortDescription: 'A realistic backend system-design interview.',
      durationMinutes: 30,
      price: { amount: '50.00', currency: 'USD' },
    },
  ],
};

const heldBooking: ExpertBookingResult = {
  id: 'booking-1',
  expertUserId: 'expert-1',
  expertServiceId: 's1',
  candidateId: 'candidate-1',
  status: 'HELD',
  slotStartUtc: '2026-08-03T09:00:00.000Z',
  slotEndUtc: '2026-08-03T09:30:00.000Z',
  holdExpiresAt: '2026-08-03T08:15:00.000Z',
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
  mockUser = null;
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('PublicExpertProfilePage', () => {
  it('renders the profile, expertise, and services', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockResolvedValue(detail);
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText('Staff Engineer at Acme Corp')).toBeInTheDocument();
    expect(screen.getByText(/Backend Development/)).toBeInTheDocument();
    expect(screen.getByText('Backend mock interview')).toBeInTheDocument();
    expect(screen.getByText('USD 50.00')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com/in/jane');
  });

  it('shows a not-found message with a link back on a 404', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockRejectedValue(
      new apiClient.ApiClientError('Not Found', 404),
    );
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('This expert profile could not be found.')).toBeInTheDocument();
    });
    expect(screen.getByText('Back to Find Expert')).toHaveAttribute('href', '/find-expert');
  });

  it('shows a generic error message on a non-404 failure', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockRejectedValue(new Error('boom'));
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText('We could not load this profile. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  describe('booking panel', () => {
    beforeEach(() => {
      vi.spyOn(apiClient, 'getPublicExpertProfile').mockResolvedValue(detail);
    });

    it('prompts a non-candidate visitor to log in instead of showing slots', async () => {
      mockUser = null;
      render(<PublicExpertProfilePage />);
      await waitFor(() => screen.getByText('Backend mock interview'));

      fireEvent.click(screen.getByText('Book'));

      expect(screen.getByText(/as a candidate to book this service/)).toBeInTheDocument();
      expect(screen.getByText('Log in')).toHaveAttribute('href', '/login');
    });

    it('lets an authenticated candidate view slots and reserve one', async () => {
      mockUser = { roleCodes: ['candidate'] };
      vi.spyOn(apiClient, 'getPublicExpertServiceSlots').mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [
          {
            startUtc: '2026-08-03T09:00:00.000Z',
            endUtc: '2026-08-03T09:30:00.000Z',
            localDate: '2026-08-03',
            startLocalTime: '09:00',
            endLocalTime: '09:30',
          },
        ],
      });
      vi.spyOn(apiClient, 'createMyExpertBooking').mockResolvedValue(heldBooking);

      render(<PublicExpertProfilePage />);
      await waitFor(() => screen.getByText('Backend mock interview'));

      fireEvent.click(screen.getByText('Book'));
      await waitFor(() => screen.getByText('09:00–09:30'));

      fireEvent.click(screen.getByText('09:00–09:30'));

      await waitFor(() => {
        expect(screen.getByText('Confirm booking')).toBeInTheDocument();
      });
      expect(apiClient.createMyExpertBooking).toHaveBeenCalledWith('test-token', {
        expertServiceId: 's1',
        slotStartUtc: '2026-08-03T09:00:00.000Z',
      });
    });

    it('confirms a held booking', async () => {
      mockUser = { roleCodes: ['candidate'] };
      vi.spyOn(apiClient, 'getPublicExpertServiceSlots').mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [
          {
            startUtc: '2026-08-03T09:00:00.000Z',
            endUtc: '2026-08-03T09:30:00.000Z',
            localDate: '2026-08-03',
            startLocalTime: '09:00',
            endLocalTime: '09:30',
          },
        ],
      });
      vi.spyOn(apiClient, 'createMyExpertBooking').mockResolvedValue(heldBooking);
      vi.spyOn(apiClient, 'confirmMyExpertBooking').mockResolvedValue({
        ...heldBooking,
        status: 'CONFIRMED',
        holdExpiresAt: null,
      });

      render(<PublicExpertProfilePage />);
      await waitFor(() => screen.getByText('Backend mock interview'));
      fireEvent.click(screen.getByText('Book'));
      await waitFor(() => screen.getByText('09:00–09:30'));
      fireEvent.click(screen.getByText('09:00–09:30'));
      await waitFor(() => screen.getByText('Confirm booking'));

      fireEvent.click(screen.getByText('Confirm booking'));

      await waitFor(() => {
        expect(screen.getByText(/Booking confirmed/)).toBeInTheDocument();
      });
      expect(apiClient.confirmMyExpertBooking).toHaveBeenCalledWith('test-token', 'booking-1');
    });
  });
});
