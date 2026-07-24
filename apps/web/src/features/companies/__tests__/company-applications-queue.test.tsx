import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyApplicationsQueuePage from '@/app/(management)/manage/companies/applications/page';
import * as apiClient from '@/lib/api-client';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyApplicationsQueuePage', () => {
  it('renders queue rows from the API', async () => {
    vi.spyOn(apiClient, 'listCompanyApplications').mockResolvedValue({
      data: [
        {
          id: 'app-1',
          companyId: 'c1',
          status: 'SUBMITTED',
          submissionVersion: 1,
          submittedAt: '2026-08-01T00:00:00.000Z',
          documentCount: 2,
          company: { name: 'Acme Corp', industry: 'Tech', headquartersCountryId: 'country-1' },
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<CompanyApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme Corp').closest('a')).toHaveAttribute(
      'href',
      '/manage/companies/applications/app-1',
    );
  });

  it('shows a permission-denied message on a 403', async () => {
    vi.spyOn(apiClient, 'listCompanyApplications').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<CompanyApplicationsQueuePage />);
    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to review company applications.'),
      ).toBeInTheDocument();
    });
  });

  it('re-queries when a status filter pill is clicked', async () => {
    const listSpy = vi.spyOn(apiClient, 'listCompanyApplications').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    render(<CompanyApplicationsQueuePage />);
    await waitFor(() => screen.getByText('Approved'));

    fireEvent.click(screen.getByText('Approved'));

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        'test-token',
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });
  });

  it('shows an empty state when there are no applications', async () => {
    vi.spyOn(apiClient, 'listCompanyApplications').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    render(<CompanyApplicationsQueuePage />);
    await waitFor(() => {
      expect(screen.getByText('No applications found.')).toBeInTheDocument();
    });
  });
});
