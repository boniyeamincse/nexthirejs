import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyShortlistsPage from '@/app/(authenticated)/company/shortlists/page';
import * as apiClient from '@/lib/api-client';
import type { TalentShortlistSummary } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const shortlist: TalentShortlistSummary = {
  id: 's1',
  name: 'Backend hires',
  description: null,
  memberCount: 3,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyShortlistsPage', () => {
  it('renders shortlists with a link to the detail page', async () => {
    vi.spyOn(apiClient, 'listTalentShortlists').mockResolvedValue([shortlist]);
    render(<CompanyShortlistsPage />);

    await waitFor(() => {
      expect(screen.getByText('Backend hires')).toBeInTheDocument();
    });
    expect(screen.getByText('Backend hires').closest('a')).toHaveAttribute(
      'href',
      '/company/shortlists/s1',
    );
    expect(screen.getByText('3 candidates')).toBeInTheDocument();
  });

  it('shows a not-verified message on a 403', async () => {
    vi.spyOn(apiClient, 'listTalentShortlists').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<CompanyShortlistsPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Shortlists are only available to verified companies.'),
      ).toBeInTheDocument();
    });
  });

  it('creates a shortlist', async () => {
    vi.spyOn(apiClient, 'listTalentShortlists').mockResolvedValue([]);
    const createSpy = vi.spyOn(apiClient, 'createTalentShortlist').mockResolvedValue(shortlist);

    render(<CompanyShortlistsPage />);
    await waitFor(() => screen.getByPlaceholderText('New shortlist name'));

    fireEvent.change(screen.getByPlaceholderText('New shortlist name'), {
      target: { value: 'Backend hires' },
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('test-token', { name: 'Backend hires' });
    });
  });

  it('shows an empty state when there are no shortlists', async () => {
    vi.spyOn(apiClient, 'listTalentShortlists').mockResolvedValue([]);
    render(<CompanyShortlistsPage />);
    await waitFor(() => {
      expect(screen.getByText('No shortlists yet — create one above.')).toBeInTheDocument();
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'listTalentShortlists').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<CompanyShortlistsPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
