import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertReviewsPage from '@/app/(authenticated)/expert/reviews/page';
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

describe('ExpertReviewsPage', () => {
  it('renders the aggregate rating and each review', async () => {
    vi.spyOn(apiClient, 'listMyReceivedExpertReviews').mockResolvedValue({
      data: [
        {
          id: 'review-1',
          bookingId: 'booking-1',
          expertUserId: 'expert-1',
          candidateId: 'candidate-1',
          rating: 5,
          comment: 'Great coaching',
          isHidden: false,
          hiddenReason: null,
          submittedAt: '2026-08-03T10:00:00.000Z',
          createdAt: '2026-08-03T10:00:00.000Z',
          candidateDisplayName: 'Alex Candidate',
        },
      ],
      aggregate: { average: 4.7, count: 3 },
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<ExpertReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText(/4.7 average from 3 reviews/)).toBeInTheDocument();
    });
    expect(screen.getByText('Great coaching')).toBeInTheDocument();
    expect(screen.getByText('from Alex Candidate')).toBeInTheDocument();
  });

  it('shows a hidden badge for moderated reviews', async () => {
    vi.spyOn(apiClient, 'listMyReceivedExpertReviews').mockResolvedValue({
      data: [
        {
          id: 'review-1',
          bookingId: 'booking-1',
          expertUserId: 'expert-1',
          candidateId: 'candidate-1',
          rating: 1,
          comment: 'abusive text',
          isHidden: true,
          hiddenReason: 'spam',
          submittedAt: '2026-08-03T10:00:00.000Z',
          createdAt: '2026-08-03T10:00:00.000Z',
        },
      ],
      aggregate: { average: null, count: 0 },
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<ExpertReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });
  });

  it('shows a no-reviews message when there are none', async () => {
    vi.spyOn(apiClient, 'listMyReceivedExpertReviews').mockResolvedValue({
      data: [],
      aggregate: { average: null, count: 0 },
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    render(<ExpertReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'listMyReceivedExpertReviews').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<ExpertReviewsPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
