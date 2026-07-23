import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import ExpertApplicationReviewPage from '@/app/(management)/manage/experts/applications/[applicationId]/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertApplicationReviewDetail } from '@/lib/api-client';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { roleCodes: ['expert_application_reviewer'] },
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ applicationId: 'app-1' }),
}));

function makeDetail(
  overrides: Partial<ExpertApplicationReviewDetail> = {},
): ExpertApplicationReviewDetail {
  return {
    id: 'app-1',
    expertProfileId: 'profile-1',
    status: 'SUBMITTED',
    submissionVersion: 1,
    submittedAt: '2025-01-15T10:00:00.000Z',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    applicant: { displayName: 'Jane Doe', countryId: 'US' },
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      professionalTitle: 'Senior Backend Engineer',
      professionalSummary: 'Ten years building distributed systems.',
      yearsOfExperience: 10,
      currentCompany: 'Acme Corp',
      currentPosition: 'Staff Engineer',
      highestEducation: 'MSc Computer Science',
      linkedinUrl: null,
      portfolioUrl: null,
      personalWebsiteUrl: null,
      interviewLanguages: ['English'],
      countryId: 'US',
      city: 'Remote',
      createdAt: '2025-01-10T10:00:00.000Z',
      updatedAt: '2025-01-10T10:00:00.000Z',
    },
    documents: [
      {
        id: 'doc-1',
        applicationId: 'app-1',
        type: 'GOVERNMENT_ID',
        originalFileName: 'passport.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: '204800',
        uploadedAt: '2025-01-11T10:00:00.000Z',
      },
      {
        id: 'doc-2',
        applicationId: 'app-1',
        type: 'EMPLOYMENT_PROOF',
        originalFileName: 'offer-letter.pdf',
        mimeType: 'application/pdf',
        sizeBytes: '102400',
        uploadedAt: '2025-01-11T10:05:00.000Z',
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('ExpertApplicationReviewPage', () => {
  it('renders applicant profile, documents, and readiness for a SUBMITTED application with a start-review action', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(makeDetail());
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('passport.jpg', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Start review')).toBeInTheDocument();
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
  });

  it('shows Approve / Reject / Request changes only when UNDER_REVIEW', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(
      makeDetail({ status: 'UNDER_REVIEW' }),
    );
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Request changes')).toBeInTheDocument();
    expect(screen.queryByText('Start review')).not.toBeInTheDocument();
  });

  it('starting review calls the API and updates the displayed status', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(makeDetail());
    const startSpy = vi
      .spyOn(apiClient, 'startExpertApplicationReview')
      .mockResolvedValue(makeDetail({ status: 'UNDER_REVIEW' }));
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Start review')).toBeInTheDocument();
    });
    screen.getByText('Start review').click();

    await waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith('test-token', 'app-1');
    });
    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('Review started.'))).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
  });

  it('approving through the decision dialog grants the role and shows a success message', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(
      makeDetail({ status: 'UNDER_REVIEW' }),
    );
    const approveSpy = vi
      .spyOn(apiClient, 'approveExpertApplication')
      .mockResolvedValue(makeDetail({ status: 'APPROVED' }));
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    screen.getByText('Approve').click();

    const dialog = await screen.findByRole('dialog');
    const confirmButton = await screen.findByText('Approve and grant Expert role');
    confirmButton.click();

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith(
        'test-token',
        'app-1',
        expect.objectContaining({ reasonCode: 'APPROVED' }),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText((text) =>
          text.includes('Application approved. The Expert role has been granted.'),
        ),
      ).toBeInTheDocument();
    });
    expect(dialog).not.toBeInTheDocument();
  });

  it('rejecting requires a note before it will submit', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(
      makeDetail({ status: 'UNDER_REVIEW' }),
    );
    const rejectSpy = vi.spyOn(apiClient, 'rejectExpertApplication');
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
    screen.getByText('Reject').click();

    const dialog = await screen.findByRole('dialog');
    const { getByRole } = within(dialog);
    getByRole('button', { name: 'Reject application' }).click();

    await waitFor(() => {
      expect(screen.getByText('A note is required for this decision.')).toBeInTheDocument();
    });
    expect(rejectSpy).not.toHaveBeenCalled();
  });

  it('shows a permission-denied message on a 403', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to review this application.'),
      ).toBeInTheDocument();
    });
  });

  it('shows a not-found message with a link back to the queue on a 404', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockRejectedValue(
      new apiClient.ApiClientError('Not Found', 404),
    );
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('This application could not be found.')).toBeInTheDocument();
    });
    expect(screen.getByText('Back to queue')).toHaveAttribute(
      'href',
      '/manage/experts/applications',
    );
  });

  it('shows no available actions for a terminal (APPROVED) application', async () => {
    vi.spyOn(apiClient, 'getExpertApplicationForReview').mockResolvedValue(
      makeDetail({ status: 'APPROVED' }),
    );
    render(<ExpertApplicationReviewPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No review actions are available for an application in this state.'),
      ).toBeInTheDocument();
    });
  });
});
