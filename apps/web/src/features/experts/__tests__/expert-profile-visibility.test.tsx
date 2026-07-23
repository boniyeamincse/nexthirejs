import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertProfilePage from '@/app/(authenticated)/expert/profile/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertProfileResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
let currentRoleCodes: string[] = ['candidate', 'expert'];

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { roleCodes: currentRoleCodes },
  }),
}));

vi.mock('@/features/experts/components/ExpertProfileForm', () => ({
  ExpertProfileForm: () => <div data-testid="profile-form" />,
}));

const privateProfile: ExpertProfileResult = {
  id: 'profile-1',
  userId: 'user-1',
  professionalTitle: 'Senior Backend Engineer',
  professionalSummary: 'Ten years building distributed systems.',
  yearsOfExperience: 10,
  interviewLanguages: ['en'],
  countryId: 'c1',
  isPublic: false,
  publicSlug: null,
  createdAt: '2025-01-10T10:00:00.000Z',
  updatedAt: '2025-01-10T10:00:00.000Z',
};

const publicProfile: ExpertProfileResult = {
  ...privateProfile,
  isPublic: true,
  publicSlug: 'senior-backend-engineer-abc123ef',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
  currentRoleCodes = ['candidate', 'expert'];
  vi.spyOn(apiClient, 'listSupportedCountries').mockResolvedValue({ countries: [] });
});

describe('ExpertProfilePage — public directory visibility', () => {
  it('shows the visibility section for an approved expert and toggles it public', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(privateProfile);
    const toggleSpy = vi
      .spyOn(apiClient, 'updateMyExpertProfileVisibility')
      .mockResolvedValue({ isPublic: true, publicSlug: 'senior-backend-engineer-abc123ef' });
    render(<ExpertProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText('Your profile is private and does not appear in the public directory.'),
      ).toBeInTheDocument();
    });
    screen.getByText('Make Public').click();

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith('test-token', { isPublic: true });
    });
    await waitFor(() => {
      expect(
        screen.getByText('Your profile is visible in the public expert directory.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('View your public profile →')).toHaveAttribute(
      'href',
      '/find-expert/senior-backend-engineer-abc123ef',
    );
  });

  it('toggles a public profile back to private', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(publicProfile);
    const toggleSpy = vi
      .spyOn(apiClient, 'updateMyExpertProfileVisibility')
      .mockResolvedValue({ isPublic: false, publicSlug: 'senior-backend-engineer-abc123ef' });
    render(<ExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Make Private')).toBeInTheDocument();
    });
    screen.getByText('Make Private').click();

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith('test-token', { isPublic: false });
    });
    await waitFor(() => {
      expect(
        screen.getByText('Your profile is private and does not appear in the public directory.'),
      ).toBeInTheDocument();
    });
  });

  it('hides the visibility section entirely for a non-approved applicant', async () => {
    currentRoleCodes = ['candidate'];
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(privateProfile);
    render(<ExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });
    expect(screen.queryByText('Public Directory')).not.toBeInTheDocument();
  });

  it('shows a retryable error message when the toggle request fails', async () => {
    vi.spyOn(apiClient, 'getMyExpertProfile').mockResolvedValue(privateProfile);
    vi.spyOn(apiClient, 'updateMyExpertProfileVisibility').mockRejectedValue(new Error('boom'));
    render(<ExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Make Public')).toBeInTheDocument();
    });
    screen.getByText('Make Public').click();

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
  });
});
