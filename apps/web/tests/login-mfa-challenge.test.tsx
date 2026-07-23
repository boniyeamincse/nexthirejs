import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { ApiClientError } from '@/lib/api-client';

const { mockPush, mockLogin, mockCompleteMfaChallenge } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockLogin: vi.fn(),
  mockCompleteMfaChallenge: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    completeMfaChallenge: mockCompleteMfaChallenge,
  }),
}));

const challengeOutcome = {
  mfaRequired: true as const,
  challengeToken: 'a'.repeat(64),
  expiresAt: '2026-07-23T11:00:00.000Z',
  allowedMethods: ['TOTP', 'RECOVERY_CODE'] as ('TOTP' | 'RECOVERY_CODE')[],
};

async function submitCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
  await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login MFA challenge', () => {
  it('shows the verification step when login requires MFA', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);

    render(<LoginPage />);
    await submitCredentials();

    expect(await screen.findByText(/two-factor verification/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/authentication code/i)).toBeInTheDocument();
    expect(screen.getByText(/trust this device for 30 days/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('completes login with a valid TOTP code', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);
    mockCompleteMfaChallenge.mockResolvedValue(undefined);

    render(<LoginPage />);
    const user = await submitCredentials();

    await user.type(await screen.findByLabelText(/authentication code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(mockCompleteMfaChallenge).toHaveBeenCalledWith({
      challengeToken: challengeOutcome.challengeToken,
      method: 'TOTP',
      code: '123456',
      trustDevice: undefined,
    });
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  it('validates the TOTP format before submitting', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);

    render(<LoginPage />);
    const user = await submitCredentials();

    await user.type(await screen.findByLabelText(/authentication code/i), '12');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/6-digit code/i);
    expect(mockCompleteMfaChallenge).not.toHaveBeenCalled();
  });

  it('switches to recovery code entry', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);
    mockCompleteMfaChallenge.mockResolvedValue(undefined);

    render(<LoginPage />);
    const user = await submitCredentials();

    await user.click(await screen.findByRole('button', { name: /use a recovery code instead/i }));
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/recovery code/i), 'ABCD-1234-EFGH');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(mockCompleteMfaChallenge).toHaveBeenCalledWith({
      challengeToken: challengeOutcome.challengeToken,
      method: 'RECOVERY_CODE',
      code: 'ABCD-1234-EFGH',
      trustDevice: undefined,
    });
  });

  it('sends trustDevice when the checkbox is ticked', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);
    mockCompleteMfaChallenge.mockResolvedValue(undefined);

    render(<LoginPage />);
    const user = await submitCredentials();

    await screen.findByLabelText(/authentication code/i);
    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText(/authentication code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(mockCompleteMfaChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ trustDevice: true }),
    );
  });

  it('returns to sign-in when the challenge expires', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);
    mockCompleteMfaChallenge.mockRejectedValue(new ApiClientError('MFA_CHALLENGE_EXPIRED', 401));

    render(<LoginPage />);
    const user = await submitCredentials();

    await user.type(await screen.findByLabelText(/authentication code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(await screen.findByText(/verification session has expired/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('shows an incorrect-code error and stays on the challenge', async () => {
    mockLogin.mockResolvedValue(challengeOutcome);
    mockCompleteMfaChallenge.mockRejectedValue(new ApiClientError('MFA_CODE_INVALID', 401));

    render(<LoginPage />);
    const user = await submitCredentials();

    await user.type(await screen.findByLabelText(/authentication code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify and sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/code is incorrect/i);
    expect(screen.getByLabelText(/authentication code/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
