import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpertApplicationReviewPage from '@/app/(management)/manage/experts/applications/[applicationId]/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertApplicationReviewDetail } from '@/lib/api-client';

const { mockGetAccessToken, mockLogout, mockUseAuth } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
  mockLogout: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ applicationId: 'app-1' }) }));
vi.mock('@/providers/auth-context', () => ({ useAuth: mockUseAuth }));
vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    getExpertApplicationForReview: vi.fn(),
    startExpertApplicationReview: vi.fn(),
    approveExpertApplication: vi.fn(),
    rejectExpertApplication: vi.fn(),
    requestExpertApplicationChanges: vi.fn(),
    getExpertVerificationDocumentAccess: vi.fn(),
  };
});

const underReview: ExpertApplicationReviewDetail = {
  id: 'app-1',
  expertProfileId: 'p1',
  status: 'UNDER_REVIEW',
  submissionVersion: 1,
  submittedAt: '2026-07-20T10:00:00.000Z',
  reviewStartedAt: '2026-07-21T10:00:00.000Z',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-21T10:00:00.000Z',
  applicant: { displayName: 'Jordan Doe', countryId: 'BD' },
  profile: {
    id: 'p1',
    userId: 'u1',
    professionalTitle: 'Staff Engineer',
    professionalSummary: 'A long professional summary describing extensive experience.',
    yearsOfExperience: 10,
    currentCompany: 'Acme',
    currentPosition: 'Staff',
    highestEducation: 'MSc',
    linkedinUrl: null,
    portfolioUrl: null,
    personalWebsiteUrl: null,
    interviewLanguages: ['English'],
    countryId: 'BD',
    city: 'Dhaka',
    profilePhotoFileId: null,
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
  },
  documents: [
    {
      id: 'doc-1',
      applicationId: 'app-1',
      type: 'GOVERNMENT_ID',
      originalFileName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '204800',
      uploadedAt: '2026-07-20T10:00:00.000Z',
      removedAt: null,
    },
  ],
  readiness: {
    ready: true,
    blockers: [],
    summary: {
      profileComplete: true,
      requiredDocumentsPresent: true,
      mfaEnabled: true,
      documentCount: 1,
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('token-123');
  mockUseAuth.mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { id: 'admin', email: 'a@b.com', status: 'ACTIVE', roleCodes: ['admin'] },
  });
});

describe('ExpertApplicationReviewPage', () => {
  it('renders the profile, documents, and decision actions for an under-review application', async () => {
    (apiClient.getExpertApplicationForReview as any).mockResolvedValue(underReview);

    render(<ExpertApplicationReviewPage />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Staff Engineer/i })).toBeInTheDocument(),
    );
    expect(screen.getByText('Jordan Doe')).toBeInTheDocument();
    expect(screen.getByText('passport.pdf', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request changes/i })).toBeInTheDocument();
  });

  it('opens the approve dialog and submits an approval', async () => {
    (apiClient.getExpertApplicationForReview as any).mockResolvedValue(underReview);
    (apiClient.approveExpertApplication as any).mockResolvedValue({
      ...underReview,
      status: 'APPROVED',
    });

    render(<ExpertApplicationReviewPage />);
    await screen.findByRole('heading', { name: /Staff Engineer/i });

    await userEvent.click(screen.getByRole('button', { name: /^Approve$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Approve and grant Expert role/i }));

    await waitFor(() =>
      expect(apiClient.approveExpertApplication).toHaveBeenCalledWith(
        'token-123',
        'app-1',
        expect.any(Object),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/approved/i);
  });

  it('shows a permission-denied message on 403', async () => {
    (apiClient.getExpertApplicationForReview as any).mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );

    render(<ExpertApplicationReviewPage />);
    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });

  it('offers only a start-review action when the application is SUBMITTED', async () => {
    (apiClient.getExpertApplicationForReview as any).mockResolvedValue({
      ...underReview,
      status: 'SUBMITTED',
      reviewStartedAt: null,
    });
    (apiClient.startExpertApplicationReview as any).mockResolvedValue(underReview);

    render(<ExpertApplicationReviewPage />);
    await screen.findByRole('heading', { name: /Staff Engineer/i });

    expect(screen.getByRole('button', { name: /Start review/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Approve$/i })).not.toBeInTheDocument();
  });
});
