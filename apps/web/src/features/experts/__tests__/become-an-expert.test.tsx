import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BecomeAnExpertPage from '@/app/(authenticated)/become-an-expert/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertApplicationDetail } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
const mockPush = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const draftApplication: ExpertApplicationDetail = {
  id: 'app-1',
  expertProfileId: 'profile-1',
  status: 'DRAFT',
  submissionVersion: 1,
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-01-15T10:00:00.000Z',
};

const submittedApplication: ExpertApplicationDetail = {
  ...draftApplication,
  status: 'SUBMITTED',
  submittedAt: '2025-01-16T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('BecomeAnExpertPage', () => {
  it('shows the start button when the applicant has no application yet', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(null);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Start your application')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Your application:/)).not.toBeInTheDocument();
  });

  it('creates the application and navigates to the profile builder on start', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(null);
    const createSpy = vi
      .spyOn(apiClient, 'createMyExpertApplication')
      .mockResolvedValue(draftApplication);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Start your application')).toBeInTheDocument();
    });
    screen.getByText('Start your application').click();

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('test-token');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/expert/profile');
    });
  });

  it('on a 409 conflict, refetches the existing application instead of failing', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    const getAppSpy = vi
      .spyOn(apiClient, 'getMyExpertApplication')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(draftApplication);
    vi.spyOn(apiClient, 'createMyExpertApplication').mockRejectedValue(
      new apiClient.ApiClientError('EXPERT_APPLICATION_ALREADY_ACTIVE', 409),
    );
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Start your application')).toBeInTheDocument();
    });
    screen.getByText('Start your application').click();

    await waitFor(() => {
      expect(getAppSpy).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/expert/profile');
    });
  });

  it('shows a retryable error when the start request fails for a non-409 reason', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(null);
    vi.spyOn(apiClient, 'createMyExpertApplication').mockRejectedValue(new Error('boom'));
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Start your application')).toBeInTheDocument();
    });
    screen.getByText('Start your application').click();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('boom');
    });
  });

  it('renders the current application status and a link to continue editing when editable', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(draftApplication);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Your application:')).toBeInTheDocument();
    });
    expect(screen.getByText('Continue editing')).toHaveAttribute('href', '/expert/profile');
    expect(screen.getByText('Continue your application')).toHaveAttribute(
      'href',
      '/expert/profile',
    );
  });

  it('hides the continue-editing link and points to the status page once submitted (non-editable)', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(null);
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(submittedApplication);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Your application:')).toBeInTheDocument();
    });
    expect(screen.queryByText('Continue editing')).not.toBeInTheDocument();
    expect(screen.getByText('View your application')).toHaveAttribute(
      'href',
      '/expert/application-status',
    );
  });

  it('shows a retryable error banner when loading the applicant state fails', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockRejectedValue(new Error('network down'));
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(null);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(
        screen.getByText('We could not load your expert application. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('401 while loading the applicant state logs out and redirects to login', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    vi.spyOn(apiClient, 'getMyExpertApplication').mockResolvedValue(null);
    render(<BecomeAnExpertPage />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
