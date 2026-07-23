import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(authenticated)/dashboard/page';
import * as apiClient from '@/lib/api-client';
import type { CandidateProfileCompletionDashboard } from '@/lib/api-client';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
const mockPush = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    user: { email: 'jane@example.com' },
    status: 'authenticated',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const fullDashboard: CandidateProfileCompletionDashboard = {
  completion: {
    percentage: 65,
    earnedPoints: 65,
    totalPoints: 100,
    version: 'v1',
    updatedAt: '2025-01-15T10:30:00.000Z',
  },
  summary: {
    completedSections: 3,
    inProgressSections: 4,
    notStartedSections: 4,
    totalSections: 11,
  },
  sections: [
    {
      section: 'BASIC_PROFILE',
      label: 'Basic Profile',
      status: 'COMPLETED',
      earnedPoints: 30,
      possiblePoints: 30,
      percentage: 100,
      route: '/profile',
      missingItems: [],
    },
    {
      section: 'EDUCATION',
      label: 'Education',
      status: 'IN_PROGRESS',
      earnedPoints: 5,
      possiblePoints: 11,
      percentage: 45,
      route: '/profile/education',
      missingItems: ['Degree type', 'Institution name'],
    },
    {
      section: 'ACHIEVEMENTS',
      label: 'Achievements',
      status: 'NOT_STARTED',
      earnedPoints: 0,
      possiblePoints: 5,
      percentage: 0,
      route: '/profile/achievements',
      missingItems: ['At least one achievement'],
    },
  ],
  nextActions: [
    {
      id: 'action-1',
      section: 'EDUCATION',
      title: 'Complete your education details',
      description: 'Add degree type and institution name to your education section.',
      route: '/profile/education',
      priority: 1,
      pointsAvailable: 6,
    },
  ],
};

const zeroDashboard: CandidateProfileCompletionDashboard = {
  completion: {
    percentage: 0,
    earnedPoints: 0,
    totalPoints: 100,
    version: 'v1',
    updatedAt: '2025-01-15T10:30:00.000Z',
  },
  summary: {
    completedSections: 0,
    inProgressSections: 0,
    notStartedSections: 1,
    totalSections: 1,
  },
  sections: [
    {
      section: 'BASIC_PROFILE',
      label: 'Basic Profile',
      status: 'NOT_STARTED',
      earnedPoints: 0,
      possiblePoints: 30,
      percentage: 0,
      route: '/profile',
      missingItems: ['Basic profile information'],
    },
  ],
  nextActions: [],
};

const completeDashboard: CandidateProfileCompletionDashboard = {
  completion: {
    percentage: 100,
    earnedPoints: 100,
    totalPoints: 100,
    version: 'v1',
    updatedAt: '2025-01-15T10:30:00.000Z',
  },
  summary: {
    completedSections: 1,
    inProgressSections: 0,
    notStartedSections: 0,
    totalSections: 1,
  },
  sections: [
    {
      section: 'BASIC_PROFILE',
      label: 'Basic Profile',
      status: 'COMPLETED',
      earnedPoints: 30,
      possiblePoints: 30,
      percentage: 100,
      route: '/profile',
      missingItems: [],
    },
  ],
  nextActions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
  // Photo lookup is a side aggregation on the same page load; keep it inert so
  // assertions focus on the profile-completion aggregation being verified here.
  vi.spyOn(apiClient, 'fetchMyPhotoObjectUrl').mockResolvedValue(null);
});

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockReturnValue(
      new Promise(() => {
        /* pending */
      }),
    );
    render(<DashboardPage />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders overall completion and section summary counts from the API response', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('progressbar', { name: 'Profile completion: 65%' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('65% COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('BASIC')).toBeInTheDocument();
    expect(screen.getByText('3 OF 11')).toBeInTheDocument();
    expect(screen.getByText('11 TOTAL')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Completed Sections')).toBeInTheDocument();
  });

  it('renders section rows with correct status labels and progress values', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Basic Profile')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('progressbar', { name: 'Basic Profile progress: 100%' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Education progress: 45%' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Achievements progress: 0%' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();

    expect(screen.getByLabelText('Go to Education')).toHaveAttribute('href', '/profile/education');
    expect(screen.getByLabelText('Go to Achievements')).toHaveAttribute(
      'href',
      '/profile/achievements',
    );
  });

  it('renders next actions checklist from the API, not derived client-side', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete your education details')).toBeInTheDocument();
    });

    const actionLink = screen.getByLabelText(
      'Complete your education details: Add degree type and institution name to your education section.',
    );
    expect(actionLink).toHaveAttribute('href', '/profile/education');
  });

  it('shows an all-caught-up state when nextActions is empty', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(completeDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('All caught up! Your profile is looking great.')).toBeInTheDocument();
    });
  });

  it('handles API error with retry', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockRejectedValue(
      new Error('Network error'),
    );
    render(<DashboardPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Dashboard is temporarily unavailable. Please try again later.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('empty profile state (0% completion, BASIC badge, not-started section)', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(zeroDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('progressbar', { name: 'Profile completion: 0%' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('BASIC')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Basic Profile progress: 0%' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('100% completion state shows PRO badge and completed subtitle', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(completeDashboard);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('progressbar', { name: 'Profile completion: 100%' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('Your profile is complete and ready to share.')).toBeInTheDocument();
  });

  it('401 response triggers logout redirect', async () => {
    const apiError = new apiClient.ApiClientError('Unauthorized', 401);
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockRejectedValue(apiError);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('displays the completion version returned by the API', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Completion vv1')).toBeInTheDocument();
    });
  });
});
