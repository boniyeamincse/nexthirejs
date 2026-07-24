import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BecomeACompanyPage from '@/app/(authenticated)/become-a-company/page';
import * as apiClient from '@/lib/api-client';
import type {
  CompanyProfileResult,
  CompanyApplicationDetail,
  CompanyApplicationReadiness,
} from '@nexthire/types';

const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  }),
}));

const profile: CompanyProfileResult = {
  id: 'c1',
  ownerUserId: 'u1',
  name: 'Acme Corp',
  legalName: null,
  website: null,
  industry: null,
  companySize: null,
  headquartersCountryId: 'country-1',
  headquartersCity: null,
  description: 'A great company.',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const draftApplication: CompanyApplicationDetail = {
  id: 'app-1',
  companyId: 'c1',
  status: 'DRAFT',
  submissionVersion: 0,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const notReadyReadiness: CompanyApplicationReadiness = {
  ready: false,
  blockers: [{ code: 'MISSING_BUSINESS_REGISTRATION', message: 'A business registration document is required.' }],
  summary: { profileComplete: true, requiredDocumentsPresent: false, mfaEnabled: true, documentCount: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('BecomeACompanyPage', () => {
  it('shows the profile form and a start-verification prompt once a profile exists', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockResolvedValue(profile);
    vi.spyOn(apiClient, 'getMyCompanyApplication').mockResolvedValue({
      application: null,
      documents: [],
      readiness: null,
    });

    render(<BecomeACompanyPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });
    expect(screen.getByText('Start verification')).toBeInTheDocument();
  });

  it('creates a draft application when starting verification', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockResolvedValue(profile);
    vi.spyOn(apiClient, 'getMyCompanyApplication').mockResolvedValue({
      application: null,
      documents: [],
      readiness: null,
    });
    vi.spyOn(apiClient, 'createMyCompanyApplication').mockResolvedValue({
      application: draftApplication,
      documents: [],
      readiness: notReadyReadiness,
    });

    render(<BecomeACompanyPage />);
    await waitFor(() => screen.getByText('Start verification'));
    fireEvent.click(screen.getByText('Start verification'));

    await waitFor(() => {
      expect(apiClient.createMyCompanyApplication).toHaveBeenCalledWith('test-token');
    });
  });

  it('shows readiness blockers instead of a submit button when not ready', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockResolvedValue(profile);
    vi.spyOn(apiClient, 'getMyCompanyApplication').mockResolvedValue({
      application: draftApplication,
      documents: [],
      readiness: notReadyReadiness,
    });

    render(<BecomeACompanyPage />);

    await waitFor(() => {
      expect(
        screen.getByText('A business registration document is required.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Submit for review')).not.toBeInTheDocument();
  });

  it('shows a submit button when the application is ready', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockResolvedValue(profile);
    vi.spyOn(apiClient, 'getMyCompanyApplication').mockResolvedValue({
      application: draftApplication,
      documents: [],
      readiness: { ...notReadyReadiness, ready: true, blockers: [] },
    });
    vi.spyOn(apiClient, 'submitMyCompanyApplication').mockResolvedValue({
      application: { ...draftApplication, status: 'SUBMITTED' },
      documents: [],
      readiness: null,
    });

    render(<BecomeACompanyPage />);
    await waitFor(() => screen.getByText('Submit for review'));

    fireEvent.click(screen.getByText('Submit for review'));

    await waitFor(() => {
      expect(apiClient.submitMyCompanyApplication).toHaveBeenCalledWith('test-token');
    });
  });

  it('shows a withdraw button and the rejection reason for a rejected application', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockResolvedValue(profile);
    vi.spyOn(apiClient, 'getMyCompanyApplication').mockResolvedValue({
      application: {
        ...draftApplication,
        status: 'REJECTED',
        decisionReasonCode: 'INVALID_DOCUMENTS',
        reviewerNote: 'Certificate was expired',
      },
      documents: [],
      readiness: null,
    });

    render(<BecomeACompanyPage />);

    await waitFor(() => {
      expect(screen.getByText(/Certificate was expired/)).toBeInTheDocument();
    });
    expect(screen.queryByText('Withdraw application')).not.toBeInTheDocument();
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'getMyCompanyProfile').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<BecomeACompanyPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
