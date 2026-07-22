import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertApplicationsQueuePage from '@/app/(management)/manage/experts/applications/page';
import * as apiClient from '@/lib/api-client';
import type { PaginatedExpertApplicationResult } from '@nexthire/types';

const { mockGetAccessToken, mockLogout, mockUseAuth } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
  mockLogout: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/providers/auth-context', () => ({ useAuth: mockUseAuth }));
vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    listExpertApplications: vi.fn(),
    listSupportedCountries: vi.fn(),
  };
});

const result: PaginatedExpertApplicationResult = {
  data: [
    {
      id: 'app-1',
      userId: 'u1',
      expertProfileId: 'p1',
      status: 'SUBMITTED',
      submissionVersion: 1,
      submittedAt: '2026-07-20T10:00:00.000Z',
      documentCount: 2,
      profile: { professionalTitle: 'Staff Engineer', yearsOfExperience: 10, countryId: 'BD' },
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

function asReviewer() {
  mockUseAuth.mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { id: 'admin', email: 'a@b.com', status: 'ACTIVE', roleCodes: ['admin'] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('token-123');
  (apiClient.listSupportedCountries as any).mockResolvedValue({
    countries: [{ code: 'BD', name: 'Bangladesh' }],
  });
});

describe('ExpertApplicationsQueuePage', () => {
  it('renders an accessible table of applications for a reviewer', async () => {
    asReviewer();
    (apiClient.listExpertApplications as any).mockResolvedValue(result);

    render(<ExpertApplicationsQueuePage />);

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: /Professional title/i })).toBeInTheDocument();
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review/i })).toHaveAttribute(
      'href',
      '/manage/experts/applications/app-1',
    );
  });

  it('shows an empty state when there are no applications', async () => {
    asReviewer();
    (apiClient.listExpertApplications as any).mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    render(<ExpertApplicationsQueuePage />);
    await waitFor(() =>
      expect(screen.getByText(/No applications match the current filters/i)).toBeInTheDocument(),
    );
  });

  it('shows a permission-denied message on 403', async () => {
    asReviewer();
    (apiClient.listExpertApplications as any).mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );

    render(<ExpertApplicationsQueuePage />);
    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });

  it('provides status and country filters', async () => {
    asReviewer();
    (apiClient.listExpertApplications as any).mockResolvedValue(result);

    render(<ExpertApplicationsQueuePage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Submitted from/i)).toBeInTheDocument();
  });
});
