import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyCandidateSearchPage from '@/app/(authenticated)/company/candidates/page';
import * as apiClient from '@/lib/api-client';
import type { CompanyCandidateSearchResultCard } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const candidate: CompanyCandidateSearchResultCard = {
  candidateUserId: 'u1',
  displayName: 'Jane Doe',
  professionalHeadline: 'Backend Engineer',
  location: { city: 'Dhaka', countryName: 'Bangladesh' },
  topSkills: ['TypeScript', 'NestJS'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyCandidateSearchPage', () => {
  it('renders search results with a link to the detail page', async () => {
    vi.spyOn(apiClient, 'searchCompanyCandidates').mockResolvedValue({
      data: [candidate],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<CompanyCandidateSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Jane Doe').closest('a')).toHaveAttribute(
      'href',
      '/company/candidates/u1',
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('shows a not-verified message on a 403', async () => {
    vi.spyOn(apiClient, 'searchCompanyCandidates').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<CompanyCandidateSearchPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Candidate search is only available to verified companies.'),
      ).toBeInTheDocument();
    });
  });

  it('re-queries with a search term', async () => {
    const searchSpy = vi.spyOn(apiClient, 'searchCompanyCandidates').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    render(<CompanyCandidateSearchPage />);
    await waitFor(() => screen.getByPlaceholderText('Search name or headline'));

    fireEvent.change(screen.getByPlaceholderText('Search name or headline'), {
      target: { value: 'Jane' },
    });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(searchSpy).toHaveBeenLastCalledWith(
        'test-token',
        expect.objectContaining({ search: 'Jane' }),
      );
    });
  });

  it('shows an empty state when there are no results', async () => {
    vi.spyOn(apiClient, 'searchCompanyCandidates').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    render(<CompanyCandidateSearchPage />);
    await waitFor(() => {
      expect(screen.getByText('No discoverable candidates match your search.')).toBeInTheDocument();
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'searchCompanyCandidates').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<CompanyCandidateSearchPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
