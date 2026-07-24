import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyCompanyInvitationsPage from '@/app/(authenticated)/company/invitations/page';
import * as apiClient from '@/lib/api-client';
import type { MyCompanyInvitationResult } from '@nexthire/types';

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

const invitation: MyCompanyInvitationResult = {
  id: 'inv1',
  companyName: 'Acme Corp',
  role: 'RECRUITER',
  status: 'PENDING',
  expiresAt: '2026-08-10T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('MyCompanyInvitationsPage', () => {
  it('shows an empty state when there are no invitations', async () => {
    vi.spyOn(apiClient, 'listMyPendingCompanyInvitations').mockResolvedValue([]);
    render(<MyCompanyInvitationsPage />);
    await waitFor(() => {
      expect(screen.getByText('You have no pending company invitations.')).toBeInTheDocument();
    });
  });

  it('renders a pending invitation', async () => {
    vi.spyOn(apiClient, 'listMyPendingCompanyInvitations').mockResolvedValue([invitation]);
    render(<MyCompanyInvitationsPage />);
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('accepts an invitation and redirects to the team page', async () => {
    vi.spyOn(apiClient, 'listMyPendingCompanyInvitations').mockResolvedValue([invitation]);
    const acceptSpy = vi.spyOn(apiClient, 'acceptCompanyInvitation').mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      role: 'RECRUITER',
      displayName: 'Me',
      email: 'me@co.com',
      joinedAt: '2026-08-01T00:00:00.000Z',
    });

    render(<MyCompanyInvitationsPage />);
    await waitFor(() => screen.getByText('Accept'));
    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith('test-token', 'inv1');
      expect(mockPush).toHaveBeenCalledWith('/company/team');
    });
  });

  it('declines an invitation', async () => {
    vi.spyOn(apiClient, 'listMyPendingCompanyInvitations')
      .mockResolvedValueOnce([invitation])
      .mockResolvedValueOnce([]);
    const declineSpy = vi.spyOn(apiClient, 'declineCompanyInvitation').mockResolvedValue(undefined);

    render(<MyCompanyInvitationsPage />);
    await waitFor(() => screen.getByText('Decline'));
    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(declineSpy).toHaveBeenCalledWith('test-token', 'inv1');
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'listMyPendingCompanyInvitations').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<MyCompanyInvitationsPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
