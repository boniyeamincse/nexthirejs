import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    notStartedSections: 11,
    totalSections: 11,
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
    completedSections: 11,
    inProgressSections: 0,
    notStartedSections: 0,
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
  ],
  nextActions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockReturnValue(
      new Promise(() => { /* pending */ })
    );
    render(<DashboardPage />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders overall progress and summary counts when loaded', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
    expect(screen.getByText('3')).toBeInTheDocument();
    const fours = screen.getAllByText('4');
    expect(fours.length).toBe(2);
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('renders section cards with correct statuses', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Basic Profile')).toBeInTheDocument();
    });
    expect(screen.getByText(/Completed — This section is fully completed\./)).toBeInTheDocument();
    expect(screen.getByText(/In progress — This section is partially completed\./)).toBeInTheDocument();
    expect(screen.getByText(/Not started — This section has not been started yet\./)).toBeInTheDocument();
    expect(screen.getByText('30/30')).toBeInTheDocument();
    expect(screen.getByText('5/11')).toBeInTheDocument();
    expect(screen.getByText('Degree type')).toBeInTheDocument();
    expect(screen.getByText('Institution name')).toBeInTheDocument();
  });

  it('renders next actions list', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Complete your education details')).toBeInTheDocument();
    });
    expect(screen.getByText('+6 pts')).toBeInTheDocument();
    expect(screen.getByText('Add degree type and institution name to your education section.')).toBeInTheDocument();
  });

  it('handles API error with retry', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockRejectedValue(new Error('Network error'));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard is temporarily unavailable. Please try again later.')).toBeInTheDocument();
    });
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('empty profile state (all sections NOT_STARTED, 0% completion)', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(zeroDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
    expect(screen.getByText('0/30')).toBeInTheDocument();
    expect(screen.getAllByText(/Not started/).length).toBeGreaterThanOrEqual(1);
  });

  it('100% completion state with no employment guarantees', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(completeDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
    expect(screen.getByText('Your profile is complete.')).toBeInTheDocument();
    expect(screen.queryByText(/ready to apply/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you're hired/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/employment/i)).not.toBeInTheDocument();
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

  it('progress has accessible ARIA attributes', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar', { name: /Profile completion: 65%/ });
      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  it('section routes are correct links', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      const startLink = screen.getByLabelText('Go to Achievements');
      expect(startLink).toHaveAttribute('href', '/profile/achievements');
    });
    const educationLink = screen.getByLabelText('Go to Education');
    expect(educationLink).toHaveAttribute('href', '/profile/education');
  });

  it('client does not calculate official percentage independently', async () => {
    vi.spyOn(apiClient, 'getMyProfileCompletionDashboard').mockResolvedValue(fullDashboard);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
    const progressBars = screen.getAllByRole('progressbar');
    const overallBar = progressBars.find((b) => b.getAttribute('aria-label')?.startsWith('Profile completion'));
    expect(overallBar).toHaveAttribute('aria-valuenow', '65');
    const sectionBar = progressBars.find((b) => b.getAttribute('aria-label') === 'Education progress: 45%');
    expect(sectionBar).toHaveAttribute('aria-valuenow', '45');
  });
});
