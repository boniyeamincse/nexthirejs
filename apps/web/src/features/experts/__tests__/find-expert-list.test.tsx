import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FindExpertPage from '@/app/find-expert/page';
import * as apiClient from '@/lib/api-client';
import type { PaginatedPublicExpertResult, ExpertiseAreaResult } from '@nexthire/types';

const oneExpert: PaginatedPublicExpertResult = {
  data: [
    {
      publicSlug: 'senior-backend-engineer-abc123ef',
      professionalTitle: 'Senior Backend Engineer',
      professionalSummary: 'Ten years building distributed systems at scale.',
      yearsOfExperience: 10,
      currentCompany: 'Acme Corp',
      currentPosition: 'Staff Engineer',
      countryId: 'c1',
      city: 'Remote',
      interviewLanguages: ['en'],
      primaryExpertise: [{ areaName: 'Backend Development', areaSlug: 'backend-development' }],
    },
  ],
  pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
};

const areas: ExpertiseAreaResult[] = [
  { id: 'area-1', slug: 'backend-development', name: 'Backend Development', description: null, isActive: true, sortOrder: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(apiClient, 'getExpertiseAreas').mockResolvedValue(areas);
});

describe('FindExpertPage', () => {
  it('renders expert cards from the API', async () => {
    vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue(oneExpert);
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Backend Development').length).toBeGreaterThan(0);
    expect(screen.getByText('View Profile')).toHaveAttribute(
      'href',
      '/find-expert/senior-backend-engineer-abc123ef',
    );
  });

  it('renders expertise-area filter pills fetched from the API', async () => {
    vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue(oneExpert);
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Backend Development' })).toBeInTheDocument();
    });
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('clicking a filter pill re-queries with that expertiseAreaId', async () => {
    const listSpy = vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue(oneExpert);
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Backend Development' })).toBeInTheDocument();
    });
    screen.getByRole('button', { name: 'Backend Development' }).click();

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ expertiseAreaId: 'area-1', page: 1 }),
      );
    });
  });

  it('submitting the search box re-queries with the trimmed search term', async () => {
    const listSpy = vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue(oneExpert);
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('Search by professional title...');
    fireEvent.change(input, { target: { value: '  backend  ' } });
    screen.getByText('Search').click();

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'backend' }));
    });
  });

  it('shows an empty state when no experts match', async () => {
    vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
    });
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No experts match your search yet. Try a different filter.'),
      ).toBeInTheDocument();
    });
  });

  it('shows a retryable error banner on failure', async () => {
    vi.spyOn(apiClient, 'getPublicExperts').mockRejectedValue(new Error('boom'));
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(
        screen.getByText('We could not load the expert directory. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('renders pagination controls and requests the next page', async () => {
    const listSpy = vi.spyOn(apiClient, 'getPublicExperts').mockResolvedValue({
      data: oneExpert.data,
      pagination: { page: 1, pageSize: 12, total: 25, totalPages: 3 },
    });
    render(<FindExpertPage />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
    screen.getByText('Next').click();

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });
});
