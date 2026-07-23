import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AvailabilityPage from '@/app/(authenticated)/expert/availability/page';
import * as apiClient from '@/lib/api-client';
import type {
  ExpertAvailabilityProfileResult,
  ExpertWeeklyAvailabilityResult,
  ExpertAvailabilitySlotPreviewResult,
} from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const profile: ExpertAvailabilityProfileResult = {
  id: 'profile-1',
  timezone: 'America/New_York',
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minimumNoticeHours: 12,
  bookingWindowDays: 30,
};

const weekly: ExpertWeeklyAvailabilityResult = {
  timezone: 'America/New_York',
  windows: [{ id: 'w1', dayOfWeek: 0, startLocalMinutes: 540, endLocalMinutes: 600 }],
};

const slotPreview: ExpertAvailabilitySlotPreviewResult = {
  timezone: 'America/New_York',
  durationMinutes: 30,
  slots: [
    {
      startUtc: '2026-08-03T13:00:00.000Z',
      endUtc: '2026-08-03T13:30:00.000Z',
      localDate: '2026-08-03',
      startLocalTime: '09:00',
      endLocalTime: '09:30',
    },
    {
      startUtc: '2026-08-03T13:30:00.000Z',
      endUtc: '2026-08-03T14:00:00.000Z',
      localDate: '2026-08-03',
      startLocalTime: '09:30',
      endLocalTime: '10:00',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
  vi.spyOn(apiClient, 'getMyAvailabilityProfile').mockResolvedValue(profile);
  vi.spyOn(apiClient, 'getMyWeeklyAvailability').mockResolvedValue(weekly);
  vi.spyOn(apiClient, 'getMyAvailabilityOverrides').mockResolvedValue([]);
});

describe('AvailabilityPage', () => {
  it('loads and renders the profile and weekly windows from the API', async () => {
    render(<AvailabilityPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
  });

  it('shows the retryable error banner (not a silent blank state) when one of the three initial fetches fails', async () => {
    vi.spyOn(apiClient, 'getMyAvailabilityProfile').mockRejectedValue(new Error('boom'));
    render(<AvailabilityPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load availability data. Please try again.'),
      ).toBeInTheDocument();
    });
    // The other two data sources still loaded fine and should still render.
    expect(screen.getByText('Weekly Availability')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
  });

  it('retrying after a failure re-fetches and clears the error banner', async () => {
    const profileSpy = vi
      .spyOn(apiClient, 'getMyAvailabilityProfile')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(profile);
    render(<AvailabilityPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load availability data. Please try again.'),
      ).toBeInTheDocument();
    });
    screen.getByText('Retry').click();

    await waitFor(() => {
      expect(profileSpy).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        screen.queryByText('Failed to load availability data. Please try again.'),
      ).not.toBeInTheDocument();
    });
  });

  it('401 on any of the three initial fetches logs out instead of rendering blank defaults', async () => {
    vi.spyOn(apiClient, 'getMyAvailabilityProfile').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<AvailabilityPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(
      screen.queryByText('Failed to load availability data. Please try again.'),
    ).not.toBeInTheDocument();
  });

  describe('slot preview', () => {
    it('computes and renders slots grouped by date on demand', async () => {
      const previewSpy = vi
        .spyOn(apiClient, 'previewMyAvailabilitySlots')
        .mockResolvedValue(slotPreview);
      render(<AvailabilityPage />);

      await waitFor(() => {
        expect(screen.getByText('Preview Slots')).toBeInTheDocument();
      });
      screen.getByText('Preview').click();

      await waitFor(() => {
        expect(previewSpy).toHaveBeenCalledWith(
          'test-token',
          expect.objectContaining({ durationMinutes: 30 }),
        );
      });
      await waitFor(() => {
        expect(screen.getByText('2026-08-03')).toBeInTheDocument();
      });
      expect(screen.getByText('09:00–09:30')).toBeInTheDocument();
      expect(screen.getByText('09:30–10:00')).toBeInTheDocument();
      expect(screen.getByText('Times shown in America/New_York.')).toBeInTheDocument();
    });

    it('shows an empty state when no slots are bookable in range', async () => {
      vi.spyOn(apiClient, 'previewMyAvailabilitySlots').mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [],
      });
      render(<AvailabilityPage />);

      await waitFor(() => {
        expect(screen.getByText('Preview Slots')).toBeInTheDocument();
      });
      screen.getByText('Preview').click();

      await waitFor(() => {
        expect(
          screen.getByText(
            'No bookable slots in this range. Check your weekly windows, overrides, and minimum notice.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('shows a retryable error message when the preview request fails', async () => {
      vi.spyOn(apiClient, 'previewMyAvailabilitySlots').mockRejectedValue(new Error('preview down'));
      render(<AvailabilityPage />);

      await waitFor(() => {
        expect(screen.getByText('Preview Slots')).toBeInTheDocument();
      });
      screen.getByText('Preview').click();

      await waitFor(() => {
        expect(screen.getByText('preview down')).toBeInTheDocument();
      });
    });

    it('401 from the preview request logs out and redirects', async () => {
      vi.spyOn(apiClient, 'previewMyAvailabilitySlots').mockRejectedValue(
        new apiClient.ApiClientError('Unauthorized', 401),
      );
      render(<AvailabilityPage />);

      await waitFor(() => {
        expect(screen.getByText('Preview Slots')).toBeInTheDocument();
      });
      screen.getByText('Preview').click();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });
});
