import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TalentShortlistDetailPage from '@/app/(authenticated)/company/shortlists/[shortlistId]/page';
import * as apiClient from '@/lib/api-client';
import type { TalentShortlistDetail } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ shortlistId: 's1' }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const detail: TalentShortlistDetail = {
  id: 's1',
  name: 'Backend hires',
  description: 'Q3 backend roles',
  memberCount: 2,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  members: [
    {
      id: 'm1',
      candidateUserId: 'cand1',
      displayName: 'Jane Doe',
      professionalHeadline: 'Backend Engineer',
      stage: 'SHORTLISTED',
      notes: null,
      tags: ['strong-fit'],
      sortOrder: 0,
      addedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'm2',
      candidateUserId: 'cand2',
      displayName: 'Sam Lee',
      professionalHeadline: null,
      stage: 'CONTACTED',
      notes: null,
      tags: [],
      sortOrder: 0,
      addedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('TalentShortlistDetailPage', () => {
  it('renders members grouped by stage, for an OWNER (write access)', async () => {
    vi.spyOn(apiClient, 'getTalentShortlist').mockResolvedValue(detail);
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'OWNER' });

    render(<TalentShortlistDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Sam Lee')).toBeInTheDocument();
    expect(screen.getByText('strong-fit')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted (1)')).toBeInTheDocument();
    expect(screen.getByText('Contacted (1)')).toBeInTheDocument();
  });

  it('hides write controls for a VIEWER', async () => {
    vi.spyOn(apiClient, 'getTalentShortlist').mockResolvedValue(detail);
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'VIEWER' });

    render(<TalentShortlistDetailPage />);
    await waitFor(() => screen.getByText('Jane Doe'));

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Notes for Jane Doe')).not.toBeInTheDocument();
  });

  it('moves a member to a new stage', async () => {
    vi.spyOn(apiClient, 'getTalentShortlist').mockResolvedValue(detail);
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'RECRUITER' });
    const moveSpy = vi
      .spyOn(apiClient, 'updateTalentShortlistMember')
      .mockResolvedValue({ ...detail.members[0]!, stage: 'SCREENING' });

    render(<TalentShortlistDetailPage />);
    await waitFor(() => screen.getByText('Jane Doe'));

    fireEvent.change(screen.getByLabelText('Move Jane Doe to stage'), {
      target: { value: 'SCREENING' },
    });

    await waitFor(() => {
      expect(moveSpy).toHaveBeenCalledWith('test-token', 's1', 'm1', { stage: 'SCREENING' });
    });
  });

  it('removes a member', async () => {
    vi.spyOn(apiClient, 'getTalentShortlist').mockResolvedValue(detail);
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: 'ADMIN' });
    const removeSpy = vi
      .spyOn(apiClient, 'removeTalentShortlistMember')
      .mockResolvedValue(undefined);

    render(<TalentShortlistDetailPage />);
    await waitFor(() => screen.getByText('Jane Doe'));

    fireEvent.click(screen.getAllByText('Remove')[0]!);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith('test-token', 's1', 'm1');
    });
  });

  it('shows a not-verified message on a 403', async () => {
    vi.spyOn(apiClient, 'getTalentShortlist').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    vi.spyOn(apiClient, 'getMyCompanyTeamRole').mockResolvedValue({ role: null });
    render(<TalentShortlistDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Shortlists are only available to verified companies.'),
      ).toBeInTheDocument();
    });
  });
});
