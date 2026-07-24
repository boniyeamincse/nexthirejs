import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyApplicationReviewDetailPage from '@/app/(management)/manage/companies/applications/[applicationId]/page';
import * as apiClient from '@/lib/api-client';
import type { CompanyApplicationReviewDetail } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ applicationId: 'app-1' }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const baseDetail: CompanyApplicationReviewDetail = {
  id: 'app-1',
  companyId: 'c1',
  status: 'SUBMITTED',
  submissionVersion: 1,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  applicant: { displayName: 'Acme Corp', countryId: 'country-1' },
  company: {
    id: 'c1',
    name: 'Acme Corp',
    legalName: null,
    website: null,
    industry: 'Tech',
    companySize: '11-50',
    headquartersCountryId: 'country-1',
    headquartersCity: 'Remote',
    description: 'A great company.',
  },
  documents: [
    {
      id: 'doc-1',
      applicationId: 'app-1',
      type: 'BUSINESS_REGISTRATION',
      originalFileName: 'reg.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '1024',
      uploadedAt: '2026-08-01T00:00:00.000Z',
      signedUrl: { url: '/signed-doc', expiresAt: 'later' },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyApplicationReviewDetailPage', () => {
  it('renders company detail and documents', async () => {
    vi.spyOn(apiClient, 'getCompanyApplicationForReview').mockResolvedValue(baseDetail);
    render(<CompanyApplicationReviewDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/reg.pdf/)).toBeInTheDocument();
    expect(screen.getByText('View')).toHaveAttribute('href', '/signed-doc');
  });

  it('starts review on a submitted application', async () => {
    vi.spyOn(apiClient, 'getCompanyApplicationForReview').mockResolvedValue(baseDetail);
    vi.spyOn(apiClient, 'startCompanyApplicationReview').mockResolvedValue({
      ...baseDetail,
      status: 'UNDER_REVIEW',
    });

    render(<CompanyApplicationReviewDetailPage />);
    await waitFor(() => screen.getByText('Start review'));
    fireEvent.click(screen.getByText('Start review'));

    await waitFor(() => {
      expect(apiClient.startCompanyApplicationReview).toHaveBeenCalledWith('test-token', 'app-1');
    });
  });

  it('approves the application via the inline decision form', async () => {
    vi.spyOn(apiClient, 'getCompanyApplicationForReview').mockResolvedValue(baseDetail);
    vi.spyOn(apiClient, 'approveCompanyApplication').mockResolvedValue({
      ...baseDetail,
      status: 'APPROVED',
    });

    render(<CompanyApplicationReviewDetailPage />);
    await waitFor(() => screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(apiClient.approveCompanyApplication).toHaveBeenCalledWith('test-token', 'app-1', {
        reviewerNote: undefined,
      });
    });
  });

  it('rejects the application with a reason and note', async () => {
    vi.spyOn(apiClient, 'getCompanyApplicationForReview').mockResolvedValue(baseDetail);
    vi.spyOn(apiClient, 'rejectCompanyApplication').mockResolvedValue({
      ...baseDetail,
      status: 'REJECTED',
    });

    render(<CompanyApplicationReviewDetailPage />);
    await waitFor(() => screen.getByText('Reject'));
    fireEvent.click(screen.getByText('Reject'));

    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Missing documents' } });
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(apiClient.rejectCompanyApplication).toHaveBeenCalledWith(
        'test-token',
        'app-1',
        expect.objectContaining({ reviewerNote: 'Missing documents' }),
      );
    });
  });

  it('shows a permission-denied message on a 403', async () => {
    vi.spyOn(apiClient, 'getCompanyApplicationForReview').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<CompanyApplicationReviewDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to review company applications.'),
      ).toBeInTheDocument();
    });
  });
});
