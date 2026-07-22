import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSettingsPage from '@/app/(authenticated)/settings/account/page';
import * as apiClient from '@/lib/api-client';
import type { DataExportStatusResult } from '@/lib/api-client';

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

function createMockExport(overrides: Partial<DataExportStatusResult> & { id: string; status: string }): DataExportStatusResult {
  return {
    requestedAt: '2026-07-22T10:00:00.000Z',
    completedAt: overrides.status === 'READY' ? '2026-07-22T10:05:00.000Z' : null,
    expiresAt: overrides.status === 'READY' ? '2026-07-23T10:00:00.000Z' : null,
    fileSizeBytes: overrides.status === 'READY' ? 102400 : null,
    downloadAvailable: overrides.status === 'READY',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
    status: 'authenticated',
  });
  mockGetAccessToken.mockReturnValue('test-token');
  mockLogout.mockResolvedValue(undefined);
  vi.spyOn(apiClient, 'listMyDataExports').mockResolvedValue([]);
});

describe('AccountSettingsPage', () => {
  it('renders loading state when auth status is unknown', () => {
    mockUseAuth.mockReturnValue({
      getAccessToken: mockGetAccessToken,
      logout: mockLogout,
      status: 'unknown',
    });
    mockGetAccessToken.mockReturnValue('test-token');
    vi.spyOn(apiClient, 'listMyDataExports').mockReturnValue(new Promise(() => {}));
    render(<AccountSettingsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows export section and deactivation section after loading', async () => {
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
    expect(screen.getByText('Data Export')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone: Deactivate Account')).toBeInTheDocument();
  });

  it('disables request export button when an export is pending', async () => {
    vi.spyOn(apiClient, 'listMyDataExports').mockResolvedValue([
      createMockExport({ id: 'exp-1', status: 'PENDING' }),
    ]);
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Export in Progress')).toBeInTheDocument();
    });
    const btn = screen.getByRole('button', { name: 'Export in Progress' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows download button for READY exports', async () => {
    vi.spyOn(apiClient, 'listMyDataExports').mockResolvedValue([
      createMockExport({ id: 'exp-ready', status: 'READY' }),
    ]);
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('renders correct status labels for each export status', async () => {
    vi.spyOn(apiClient, 'listMyDataExports').mockResolvedValue([
      createMockExport({ id: 'exp-1', status: 'PENDING' }),
      createMockExport({ id: 'exp-2', status: 'PROCESSING' }),
      createMockExport({ id: 'exp-3', status: 'READY' }),
      createMockExport({ id: 'exp-4', status: 'FAILED' }),
      createMockExport({ id: 'exp-5', status: 'EXPIRED' }),
    ]);
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows password and confirmation inputs in danger zone', async () => {
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Danger Zone: Deactivate Account')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/DEACTIVATE/)).toBeInTheDocument();
  });

  it('shows error when confirmation text is wrong', async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText('Current Password'), 'MyPass1!');
    await user.type(screen.getByLabelText(/DEACTIVATE/), 'WRONG');
    await user.click(screen.getByRole('button', { name: 'Deactivate Account' }));
    expect(screen.getByText('Please type DEACTIVATE to confirm.')).toBeInTheDocument();
  });

  it('redirects to login after successful deactivation', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'deactivateMyAccount').mockResolvedValue({
      deactivated: true,
      sessionsRevoked: 3,
    });
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText('Current Password'), 'MyPass1!');
    await user.type(screen.getByLabelText(/DEACTIVATE/), 'DEACTIVATE');
    await user.click(screen.getByRole('button', { name: 'Deactivate Account' }));
    await waitFor(() => {
      expect(screen.getByText('Confirm Deactivation')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Yes, Deactivate' }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/login?deactivated=true');
  });

  it('does not persist signed download URL in the DOM', async () => {
    vi.spyOn(apiClient, 'listMyDataExports').mockResolvedValue([
      createMockExport({ id: 'exp-dl', status: 'READY' }),
    ]);
    const mockOpen = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(mockOpen);
    vi.spyOn(apiClient, 'getMyDataExportDownload').mockResolvedValue({
      downloadUrl: 'https://example.com/export.zip?sig=secret',
      expiresInSeconds: 300,
    });
    const user = userEvent.setup();
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Download' }));
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/export.zip?sig=secret', '_blank');
    });
    expect(document.querySelector('[data-download-url]')).not.toBeInTheDocument();
  });

  it('maintains correct tab order for form elements', async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    const passwordInput = screen.getByLabelText('Current Password');
    const confirmationInput = screen.getByLabelText(/DEACTIVATE/);
    const submitBtn = screen.getByRole('button', { name: 'Deactivate Account' });
    passwordInput.focus();
    expect(document.activeElement).toBe(passwordInput);
    await user.tab();
    expect(document.activeElement).toBe(confirmationInput);
    await user.tab();
    expect(document.activeElement).toBe(submitBtn);
  });
});
