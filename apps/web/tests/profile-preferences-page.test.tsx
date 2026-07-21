import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePreferencesPage from '../src/app/(authenticated)/profile/preferences/page';
import * as apiClient from '../src/lib/api-client';

// Mock the API client
vi.mock('../src/lib/api-client', () => ({
  listSupportedCountries: vi.fn(),
  getMyCandidatePreferences: vi.fn(),
  updateMyCandidatePreferences: vi.fn(),
}));

describe('ProfilePreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (apiClient.listSupportedCountries as any).mockImplementation(
      () => new Promise(() => {})
    );
    (apiClient.getMyCandidatePreferences as any).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ProfilePreferencesPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders preferences and countries when loaded', async () => {
    (apiClient.listSupportedCountries as any).mockResolvedValue({
      countries: [{ code: 'BD', name: 'Bangladesh' }],
    });
    (apiClient.getMyCandidatePreferences as any).mockResolvedValue({
      preferences: {
        country: { code: 'BD' },
        currentCity: 'Dhaka',
        preferredJobRoles: ['Engineer'],
        preferredWorkModes: ['REMOTE'],
        preferredEmploymentTypes: ['FULL_TIME'],
        completion: { percentage: 60, completedFields: [], missingFields: [], version: 'candidate-profile-v2' }
      },
      availableOptions: {
        workModes: ['REMOTE', 'HYBRID'],
        employmentTypes: ['FULL_TIME']
      },
    });

    render(<ProfilePreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('Bangladesh')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Dhaka')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });
  });

  it('shows empty state if no preferences exist', async () => {
    (apiClient.listSupportedCountries as any).mockResolvedValue({
      countries: [{ code: 'BD', name: 'Bangladesh' }],
    });
    (apiClient.getMyCandidatePreferences as any).mockResolvedValue({
      preferences: null,
      availableOptions: {
        workModes: ['REMOTE', 'HYBRID'],
        employmentTypes: ['FULL_TIME']
      },
    });

    render(<ProfilePreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
  });
});
