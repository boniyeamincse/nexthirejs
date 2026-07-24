import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CompanyCandidateDetailPage from '@/app/(authenticated)/company/candidates/[candidateId]/page';
import * as apiClient from '@/lib/api-client';
import type { CompanyCandidateDetail } from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ candidateId: 'u1' }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const detail: CompanyCandidateDetail = {
  profile: {
    profileId: 'u1',
    displayName: 'Jane Doe',
    professionalHeadline: 'Backend Engineer',
    professionalSummary: 'Loves building APIs.',
    location: { city: 'Dhaka', countryName: 'Bangladesh' },
    preferredJobRoles: [],
    preferredWorkModes: [],
    preferredEmploymentTypes: [],
    education: [],
    experience: [],
    skills: [{ id: 's1', name: 'TypeScript', level: 'ADVANCED', yearsOfExperience: 5 }],
    languages: [],
    certifications: [],
    training: [],
    achievements: [],
    professionalLinks: [],
    visibleSections: ['BASIC_PROFILE', 'SKILLS'],
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  publicCvs: [
    {
      id: 'cv1',
      title: 'Main CV',
      template: 'ATS_OPTIMIZED',
      completionScore: 90,
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('CompanyCandidateDetailPage', () => {
  it('renders candidate profile details and public CVs', async () => {
    vi.spyOn(apiClient, 'getCompanyCandidateDetail').mockResolvedValue(detail);
    render(<CompanyCandidateDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Loves building APIs.')).toBeInTheDocument();
    expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
    expect(screen.getByText(/Main CV/)).toBeInTheDocument();
  });

  it('shows a not-verified message on a 403', async () => {
    vi.spyOn(apiClient, 'getCompanyCandidateDetail').mockRejectedValue(
      new apiClient.ApiClientError('Forbidden', 403),
    );
    render(<CompanyCandidateDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Candidate profiles are only available to verified companies.'),
      ).toBeInTheDocument();
    });
  });

  it('shows a not-found message on a 404', async () => {
    vi.spyOn(apiClient, 'getCompanyCandidateDetail').mockRejectedValue(
      new apiClient.ApiClientError('Not found', 404),
    );
    render(<CompanyCandidateDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('This candidate is no longer discoverable.')).toBeInTheDocument();
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'getCompanyCandidateDetail').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<CompanyCandidateDetailPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
