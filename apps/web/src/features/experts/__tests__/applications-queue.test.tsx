import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertApplicationsQueuePage from '@/app/(management)/manage/experts/applications/page';
import * as apiClient from '@/lib/api-client';
import type { PaginatedExpertApplicationResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
let currentRoleCodes: string[] = ['expert_application_reviewer'];

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { roleCodes: currentRoleCodes },
  }),
}));

const onePage: PaginatedExpertApplicationResult = {
  data: [
    {
      id: 'app-1',
      userId: 'user-1',
      expertProfileId: 'profile-1',
      status: 'SUBMITTED',
      submissionVersion: 1,
      submittedAt: '2025-01-15T10:00:00.000Z',
      documentCount: 2,
      profile: {
        professionalTitle: 'Senior Backend Engineer',
        yearsOfExperience: 8,
        countryId: 'US',
      },
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

const twoPages: PaginatedExpertApplicationResult = {
  data: onePage.data,
  pagination: { page: 1, pageSize: 20, total: 25, totalPages: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
  currentRoleCodes = ['expert_application_reviewer'];
  vi.spyOn(apiClient, 'listSupportedCountries').mockResolvedValue({ countries: [] });
});

describe('ExpertApplicationsQueuePage', () => {
  it('renders queue rows returned by the API', async () => {
    vi.spyOn(apiClient, 'listExpertApplications').mockResolvedValue(onePage);
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText('8 yrs')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Review')).toHaveAttribute(
      'href',
      '/manage/experts/applications/app-1',
    );
  });

  it('shows an empty state when there are no matching applications', async () => {
    vi.spyOn(apiClient, 'listExpertApplications').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('No applications match the current filters.')).toBeInTheDocument();
    });
  });

  it('shows a permission-denied message for non-reviewer roles (backend is authoritative; frontend gate is just UX)', async () => {
    currentRoleCodes = ['candidate'];
    vi.spyOn(apiClient, 'listExpertApplications').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to review expert applications.'),
      ).toBeInTheDocument();
    });
  });

  it('renders pagination controls and requests the next page on click', async () => {
    const listSpy = vi.spyOn(apiClient, 'listExpertApplications').mockResolvedValue(twoPages);
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2 (25 total)')).toBeInTheDocument();
    });
    screen.getByText('Next').click();

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith('test-token', expect.objectContaining({ page: 2 }));
    });
  });

  it('handles a 403 from the API by showing the permission-denied message', async () => {
    vi.spyOn(apiClient, 'listExpertApplications').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to review expert applications.'),
      ).toBeInTheDocument();
    });
  });

  it('shows a retryable error on a non-403 failure', async () => {
    vi.spyOn(apiClient, 'listExpertApplications').mockRejectedValue(new Error('boom'));
    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => {
      expect(
        screen.getByText('We could not load applications. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});
