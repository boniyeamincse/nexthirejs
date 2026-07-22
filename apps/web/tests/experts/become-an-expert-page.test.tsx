import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BecomeAnExpertPage from '@/app/(authenticated)/become-an-expert/page';
import * as apiClient from '@/lib/api-client';
import type { ExpertApplicationDetail } from '@nexthire/types';

const { mockPush, mockGetAccessToken, mockLogout, mockUseAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockLogout: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next/navigation', () => {
  const router = { push: mockPush };
  return { useRouter: () => router };
});
vi.mock('@/providers/auth-context', () => ({ useAuth: mockUseAuth }));
vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    getMyExpertProfile: vi.fn(),
    getMyExpertApplication: vi.fn(),
    getMyExpertApplicationReadiness: vi.fn(),
    listMyExpertVerificationDocuments: vi.fn(),
    createMyExpertApplication: vi.fn(),
  };
});

const draftApplication: ExpertApplicationDetail = {
  id: 'app-1',
  expertProfileId: 'profile-1',
  status: 'DRAFT',
  submissionVersion: 0,
  submittedAt: null,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('token-123');
  mockUseAuth.mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
    user: { id: 'u1', email: 'a@b.com', status: 'ACTIVE', roleCodes: ['candidate'] },
  });
});

describe('BecomeAnExpertPage', () => {
  it('shows benefits and the MFA requirement notice, and a start button when no application', async () => {
    (apiClient.getMyExpertProfile as any).mockResolvedValue(null);
    (apiClient.getMyExpertApplication as any).mockResolvedValue(null);

    render(<BecomeAnExpertPage />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Become an Expert/i })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/two-factor authentication/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Start your application/i })).toBeInTheDocument();
  });

  it('creates an application and navigates to the profile editor', async () => {
    (apiClient.getMyExpertProfile as any).mockResolvedValue(null);
    (apiClient.getMyExpertApplication as any).mockResolvedValue(null);
    (apiClient.createMyExpertApplication as any).mockResolvedValue(draftApplication);

    render(<BecomeAnExpertPage />);
    const startButton = await screen.findByRole('button', { name: /Start your application/i });
    await userEvent.click(startButton);

    await waitFor(() => expect(apiClient.createMyExpertApplication).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/expert/profile');
  });

  it('shows the existing status and a continue action when an application exists', async () => {
    (apiClient.getMyExpertProfile as any).mockResolvedValue(null);
    (apiClient.getMyExpertApplication as any).mockResolvedValue(draftApplication);
    (apiClient.getMyExpertApplicationReadiness as any).mockResolvedValue(null);
    (apiClient.listMyExpertVerificationDocuments as any).mockResolvedValue([]);

    render(<BecomeAnExpertPage />);

    await waitFor(() => expect(screen.getByText(/Your application:/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Continue your application/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start your application/i }),
    ).not.toBeInTheDocument();
  });
});
