import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyTeamPage from '@/app/(authenticated)/company/team/page';
import * as apiClient from '@/lib/api-client';
import type { CompanyMemberResult, CompanyInvitationResult } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const owner: CompanyMemberResult = {
  id: 'm1',
  userId: 'u1',
  role: 'OWNER',
  displayName: 'Owner Person',
  email: 'owner@co.com',
  joinedAt: '2026-08-01T00:00:00.000Z',
};

const recruiter: CompanyMemberResult = {
  id: 'm2',
  userId: 'u2',
  role: 'RECRUITER',
  displayName: 'Recruiter Person',
  email: 'recruiter@co.com',
  joinedAt: '2026-08-02T00:00:00.000Z',
};

const invitation: CompanyInvitationResult = {
  id: 'inv1',
  email: 'invitee@co.com',
  role: 'VIEWER',
  status: 'PENDING',
  invitedByDisplayName: 'Owner Person',
  expiresAt: '2026-08-10T00:00:00.000Z',
  createdAt: '2026-08-03T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyTeamPage', () => {
  it('shows a not-a-member message when the user has no company role', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: null });

    render(<CompanyTeamPage />);

    await waitFor(() => {
      expect(screen.getByText('You are not part of a company team yet.')).toBeInTheDocument();
    });
  });

  it('renders the roster and invite form for an OWNER', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'OWNER' });
    vi.spyOn(apiClient, 'listMyCompanyTeam').mockResolvedValue([owner, recruiter]);
    vi.spyOn(apiClient, 'listMyCompanyInvitations').mockResolvedValue([invitation]);

    render(<CompanyTeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Owner Person')).toBeInTheDocument();
    });
    expect(screen.getByText('Recruiter Person')).toBeInTheDocument();
    expect(screen.getByText('Invite a team member')).toBeInTheDocument();
    expect(screen.getByText('invitee@co.com')).toBeInTheDocument();
  });

  it('does not show the invite form for a VIEWER', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'VIEWER' });
    vi.spyOn(apiClient, 'listMyCompanyTeam').mockResolvedValue([owner, recruiter]);

    render(<CompanyTeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Owner Person')).toBeInTheDocument();
    });
    expect(screen.queryByText('Invite a team member')).not.toBeInTheDocument();
    expect(apiClient.listMyCompanyInvitations).not.toHaveBeenCalled();
  });

  it('sends an invitation', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'OWNER' });
    vi.spyOn(apiClient, 'listMyCompanyTeam').mockResolvedValue([owner]);
    vi.spyOn(apiClient, 'listMyCompanyInvitations').mockResolvedValue([]);
    const createSpy = vi.spyOn(apiClient, 'createCompanyInvitation').mockResolvedValue(invitation);

    render(<CompanyTeamPage />);
    await waitFor(() => screen.getByPlaceholderText('teammate@company.com'));

    fireEvent.change(screen.getByPlaceholderText('teammate@company.com'), {
      target: { value: 'new-teammate@co.com' },
    });
    fireEvent.click(screen.getByText('Invite'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('test-token', {
        email: 'new-teammate@co.com',
        role: 'RECRUITER',
      });
    });
  });

  it('removes a member', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'OWNER' });
    vi.spyOn(apiClient, 'listMyCompanyTeam').mockResolvedValue([owner, recruiter]);
    vi.spyOn(apiClient, 'listMyCompanyInvitations').mockResolvedValue([]);
    const removeSpy = vi.spyOn(apiClient, 'removeCompanyTeamMember').mockResolvedValue(undefined);

    render(<CompanyTeamPage />);
    await waitFor(() => screen.getByText('Recruiter Person'));

    fireEvent.click(screen.getByText('Remove'));

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith('test-token', 'm2');
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<CompanyTeamPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
