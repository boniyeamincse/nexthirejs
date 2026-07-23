import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MfaSettingsPanel } from '../MfaSettingsPanel';
import * as apiClient from '@/lib/api-client';
import type { MfaSecurityStatusResult, MfaTrustedDeviceSummary } from '@/lib/api-client';

const disabledStatus: MfaSecurityStatusResult = {
  status: 'DISABLED',
  requiredByPolicy: false,
  enabledAt: null,
  recoveryCodesRemaining: 0,
  trustedDeviceCount: 0,
  currentDeviceTrusted: false,
  enrollmentExpiresAt: null,
};

const enabledStatus: MfaSecurityStatusResult = {
  ...disabledStatus,
  status: 'ENABLED',
  enabledAt: '2026-07-20T10:00:00.000Z',
  recoveryCodesRemaining: 8,
  trustedDeviceCount: 1,
};

const sampleDevice: MfaTrustedDeviceSummary = {
  id: 'device-1',
  deviceName: 'Work laptop',
  browserSummary: 'Firefox/128 on Linux',
  trustedAt: '2026-07-20T10:00:00.000Z',
  lastUsedAt: null,
  expiresAt: '2026-08-19T10:00:00.000Z',
};

const getAccessToken = () => 'test-token';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('MfaSettingsPanel', () => {
  it('shows the enable button when MFA is disabled', async () => {
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(disabledStatus);

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    expect(
      await screen.findByRole('button', { name: /enable two-factor authentication/i }),
    ).toBeInTheDocument();
  });

  it('warns when MFA is required by policy but not enabled', async () => {
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue({
      ...disabledStatus,
      requiredByPolicy: true,
    });

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    expect(
      await screen.findByText(/your account role requires two-factor authentication/i),
    ).toBeInTheDocument();
  });

  it('walks through the enrollment wizard and shows recovery codes once', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(disabledStatus);
    const beginSpy = vi.spyOn(apiClient, 'beginMfaEnrollment').mockResolvedValue({
      qrDataUrl: 'data:image/png;base64,QRDATA',
      manualSecret: 'JBSWY3DPEHPK3PXP',
      enrollmentExpiresAt: '2026-07-23T11:00:00.000Z',
    });
    const confirmSpy = vi.spyOn(apiClient, 'confirmMfaEnrollment').mockResolvedValue({
      recoveryCodes: ['CODE1CODE1AA', 'CODE2CODE2BB'],
      enabledAt: '2026-07-23T10:50:00.000Z',
    });
    vi.spyOn(apiClient, 'listMfaTrustedDevices').mockResolvedValue({ devices: [] });

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    await user.click(
      await screen.findByRole('button', { name: /enable two-factor authentication/i }),
    );

    await user.type(screen.getByLabelText(/current password/i), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(beginSpy).toHaveBeenCalledWith('test-token', 'Secret123!');
    expect(
      await screen.findByRole('img', { name: /qr code for authenticator app setup/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();

    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(enabledStatus);
    await user.type(screen.getByLabelText(/6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify and enable/i }));

    expect(confirmSpy).toHaveBeenCalledWith('test-token', '123456');
    expect(await screen.findByText('CODE1CODE1AA')).toBeInTheDocument();
    expect(screen.getByText('CODE2CODE2BB')).toBeInTheDocument();
    expect(screen.getByText(/shown only once/i)).toBeInTheDocument();
  });

  it('shows an error for an incorrect enrollment password', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(disabledStatus);
    vi.spyOn(apiClient, 'beginMfaEnrollment').mockRejectedValue(
      new apiClient.ApiClientError('MFA_PASSWORD_INVALID', 401),
    );

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    await user.click(
      await screen.findByRole('button', { name: /enable two-factor authentication/i }),
    );
    await user.type(screen.getByLabelText(/current password/i), 'WrongPass');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/password is incorrect/i);
  });

  it('renders enabled state with recovery code count and trusted devices', async () => {
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(enabledStatus);
    vi.spyOn(apiClient, 'listMfaTrustedDevices').mockResolvedValue({
      devices: [sampleDevice],
    });

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    expect(await screen.findByText(/^Enabled/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Work laptop')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove trusted device work laptop/i }),
    ).toBeInTheDocument();
  });

  it('revokes a trusted device', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(enabledStatus);
    const listSpy = vi
      .spyOn(apiClient, 'listMfaTrustedDevices')
      .mockResolvedValue({ devices: [sampleDevice] });
    const revokeSpy = vi.spyOn(apiClient, 'revokeMfaTrustedDevice').mockResolvedValue();

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    const removeButton = await screen.findByRole('button', {
      name: /remove trusted device work laptop/i,
    });
    listSpy.mockResolvedValue({ devices: [] });
    await user.click(removeButton);

    expect(revokeSpy).toHaveBeenCalledWith('test-token', 'device-1');
    expect(await screen.findByText(/trusted device removed/i)).toBeInTheDocument();
  });

  it('disables MFA after password and code confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(enabledStatus);
    vi.spyOn(apiClient, 'listMfaTrustedDevices').mockResolvedValue({ devices: [] });
    const disableSpy = vi.spyOn(apiClient, 'disableMfa').mockResolvedValue();

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    await user.click(await screen.findByRole('button', { name: /disable two-factor$/i }));
    expect(screen.getByText(/makes your account less secure/i)).toBeInTheDocument();

    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(disabledStatus);
    await user.type(screen.getByLabelText(/current password/i), 'Secret123!');
    await user.type(screen.getByLabelText(/authenticator code or recovery code/i), '123456');
    await user.click(screen.getByRole('button', { name: /disable two-factor$/i }));

    expect(disableSpy).toHaveBeenCalledWith('test-token', 'Secret123!', '123456');
    await waitFor(() => {
      expect(screen.getByText(/two-factor authentication has been disabled/i)).toBeInTheDocument();
    });
  });

  it('shows a retry action when status fails to load', async () => {
    vi.spyOn(apiClient, 'getMfaStatus').mockRejectedValue(new Error('network'));

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('uses an accessible section landmark labelled by its heading', async () => {
    vi.spyOn(apiClient, 'getMfaStatus').mockResolvedValue(disabledStatus);

    render(<MfaSettingsPanel getAccessToken={getAccessToken} />);

    await screen.findByRole('button', { name: /enable two-factor authentication/i });
    const heading = screen.getByRole('heading', { name: /two-factor authentication/i });
    expect(heading).toHaveAttribute('id', 'mfa-heading');
  });
});
