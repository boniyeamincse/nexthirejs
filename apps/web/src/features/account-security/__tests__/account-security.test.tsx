import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSecurityPage from '@/app/(authenticated)/settings/security/page';
import * as apiClient from '@/lib/api-client';
import type { CandidateAccountSecuritySummary } from '@/lib/api-client';

const { mockPush, mockLogout, mockGetAccessToken, mockUseAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockLogout: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next/navigation', () => {
  const router = { push: mockPush };
  return { useRouter: () => router };
});

vi.mock('@/providers/auth-context', () => ({
  useAuth: mockUseAuth,
}));

const mockSummary: CandidateAccountSecuritySummary = {
  email: 'candidate@example.com',
  accountStatus: 'ACTIVE',
  emailVerified: true,
  activeSessionCount: 3,
  currentSessionCreatedAt: '2026-07-22T10:00:00.000Z',
  currentSessionLastUsedAt: '2026-07-22T10:30:00.000Z',
  passwordLastChangedAt: null,
  securityLinks: {
    sessions: '/settings/security/sessions',
    privacy: '/settings/privacy',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  });
  mockGetAccessToken.mockReturnValue('test-token');
  mockLogout.mockResolvedValue(undefined);
});

describe('AccountSecurityPage', () => {
  it('renders loading state when auth status is unknown', () => {
    mockUseAuth.mockReturnValue({
      getAccessToken: mockGetAccessToken,
      logout: mockLogout,
      status: 'unknown',
    });
    mockGetAccessToken.mockReturnValue('test-token');
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockReturnValue(
      new Promise(() => {})
    );
    render(<AccountSecurityPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading then renders summary after API resolves', async () => {
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('candidate@example.com')).toBeInTheDocument();
    });
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('3 sessions')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('displays email as read-only text not inside an input', async () => {
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByText('candidate@example.com')).toBeInTheDocument();
    });
    expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument();
    screen.getAllByText('candidate@example.com').forEach((el) => {
      expect(el.tagName).not.toBe('INPUT');
    });
  });

  it('has correct session and privacy link hrefs', async () => {
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByText('Manage Sessions')).toBeInTheDocument();
    });
    expect(screen.getByText('Manage Sessions').closest('a')).toHaveAttribute(
      'href',
      '/settings/security/sessions',
    );
    expect(screen.getByText('Privacy Settings').closest('a')).toHaveAttribute(
      'href',
      '/settings/privacy',
    );
  });

  it('shows field validation errors when submitting with empty fields', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    expect(screen.getByText('Current password is required')).toBeInTheDocument();
    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
  });

  it('toggles password visibility via show/hide buttons', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Show current password')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Show new password')).toBeInTheDocument();
    expect(screen.getByLabelText('Show confirmation')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Show current password'));
    expect(screen.getByLabelText('Hide current password')).toBeInTheDocument();
    expect(screen.getByLabelText('Show new password')).toBeInTheDocument();
    expect(screen.getByLabelText('Show confirmation')).toBeInTheDocument();
  });

  function fillPasswordFields() {
    const currentInput = screen.getByLabelText('Current Password') as HTMLInputElement;
    const newInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const confirmInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    act(() => {
      nativeSetter.call(currentInput, 'MyCurrentPass1!');
      currentInput.dispatchEvent(new Event('input', { bubbles: true }));
      nativeSetter.call(newInput, 'MyNewPass1!');
      newInput.dispatchEvent(new Event('input', { bubbles: true }));
      nativeSetter.call(confirmInput, 'MyNewPass1!');
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return { currentInput, newInput, confirmInput };
  }

  it('shows safe error message when current password is wrong', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    fillPasswordFields();
    vi.spyOn(apiClient, 'changePassword').mockRejectedValue(
      new Error('Failed to change password: 400 Current password is incorrect'),
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument();
    });
  });

  it('clears fields and shows revoked session count on successful change', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    fillPasswordFields();
    vi.spyOn(apiClient, 'changePassword').mockResolvedValue({
      changed: true,
      revokedOtherSessionCount: 2,
    });
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
    expect(screen.getByText(/2 other sessions were signed out/)).toBeInTheDocument();
  });

  it('shows rate limit error message on 429', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    fillPasswordFields();
    vi.spyOn(apiClient, 'changePassword').mockRejectedValue(
      new Error('Failed to change password: 429 too many requests'),
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    await waitFor(() => {
      expect(
        screen.getByText('Too many attempts. Please wait a moment before trying again.'),
      ).toBeInTheDocument();
    });
  });

  it('clears password input values from DOM after successful change', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockResolvedValue(mockSummary);
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    const { currentInput, newInput, confirmInput } = fillPasswordFields();
    vi.spyOn(apiClient, 'changePassword').mockResolvedValue({
      changed: true,
      revokedOtherSessionCount: 0,
    });
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
    expect(currentInput).toHaveValue('');
    expect(newInput).toHaveValue('');
    expect(confirmInput).toHaveValue('');
  });

  it('triggers logout and redirect on 401 session expired', async () => {
    vi.spyOn(apiClient, 'getMyAccountSecuritySummary').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<AccountSecurityPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
