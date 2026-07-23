import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PublicExpertProfilePage from '@/app/find-expert/[slug]/page';
import * as apiClient from '@/lib/api-client';
import type { PublicExpertProfileDetail } from '@nexthire/types';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'senior-backend-engineer-abc123ef' }),
}));

const detail: PublicExpertProfileDetail = {
  publicSlug: 'senior-backend-engineer-abc123ef',
  professionalTitle: 'Senior Backend Engineer',
  professionalSummary: 'Ten years building distributed systems at scale.',
  yearsOfExperience: 10,
  currentCompany: 'Acme Corp',
  currentPosition: 'Staff Engineer',
  highestEducation: 'MSc Computer Science',
  linkedinUrl: 'https://linkedin.com/in/jane',
  portfolioUrl: null,
  personalWebsiteUrl: null,
  interviewLanguages: ['en'],
  countryId: 'c1',
  city: 'Remote',
  expertise: [
    { areaName: 'Backend Development', areaSlug: 'backend-development', level: 'EXPERT', isPrimary: true },
  ],
  services: [
    {
      id: 's1',
      type: 'MOCK_INTERVIEW',
      title: 'Backend mock interview',
      shortDescription: 'A realistic backend system-design interview.',
      durationMinutes: 30,
      price: { amount: '50.00', currency: 'USD' },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublicExpertProfilePage', () => {
  it('renders the profile, expertise, and services', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockResolvedValue(detail);
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText('Staff Engineer at Acme Corp')).toBeInTheDocument();
    expect(screen.getByText(/Backend Development/)).toBeInTheDocument();
    expect(screen.getByText('Backend mock interview')).toBeInTheDocument();
    expect(screen.getByText('USD 50.00')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com/in/jane');
  });

  it('shows a not-found message with a link back on a 404', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockRejectedValue(
      new apiClient.ApiClientError('Not Found', 404),
    );
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText('This expert profile could not be found.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Back to Find Expert')).toHaveAttribute('href', '/find-expert');
  });

  it('shows a generic error message on a non-404 failure', async () => {
    vi.spyOn(apiClient, 'getPublicExpertProfile').mockRejectedValue(new Error('boom'));
    render(<PublicExpertProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText('We could not load this profile. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});
