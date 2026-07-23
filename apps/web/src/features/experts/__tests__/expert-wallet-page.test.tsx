import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ExpertWalletPage from '@/app/(authenticated)/expert/wallet/page';
import * as apiClient from '@/lib/api-client';
import type {
  ExpertWalletResult,
  ExpertPayoutAccountResult,
  ExpertPayoutRequestResult,
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

const wallet: ExpertWalletResult = {
  id: 'wallet-1',
  balance: '0.00',
  currency: 'USD',
  status: 'ACTIVE',
  totalEarnings: '0.00',
  totalPayouts: '0.00',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  recentTransactions: [],
};

const verifiedAccount: ExpertPayoutAccountResult = {
  id: 'acct-1',
  accountHolder: 'Jane Expert',
  accountType: 'bank_account',
  accountNumberMasked: '********6789',
  routingNumberMasked: null,
  isDefault: false,
  isVerified: true,
  verifiedAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-08-01T00:00:00.000Z',
};

const payoutRequest: ExpertPayoutRequestResult = {
  id: 'req-1',
  payoutAccountId: 'acct-1',
  amount: '10.00',
  status: 'PENDING',
  requestedAt: '2026-08-01T00:00:00.000Z',
  processedAt: null,
  completedAt: null,
  failureReason: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockReturnValue('test-token');
});

describe('ExpertWalletPage', () => {
  it('shows a setup prompt when no wallet exists yet', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockResolvedValue(null);
    render(<ExpertWalletPage />);
    await waitFor(() => {
      expect(screen.getByText("You haven't set up a wallet yet.")).toBeInTheDocument();
    });
    expect(screen.getByText('Set up wallet')).toBeInTheDocument();
  });

  it('initializes the wallet and reloads', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(wallet);
    vi.spyOn(apiClient, 'initializeMyExpertWallet').mockResolvedValue(wallet);
    vi.spyOn(apiClient, 'listMyExpertPayoutAccounts').mockResolvedValue([]);
    vi.spyOn(apiClient, 'listMyExpertPayoutRequests').mockResolvedValue([]);

    render(<ExpertWalletPage />);
    await waitFor(() => screen.getByText('Set up wallet'));
    fireEvent.click(screen.getByText('Set up wallet'));

    await waitFor(() => {
      expect(apiClient.initializeMyExpertWallet).toHaveBeenCalledWith('test-token');
    });
    expect(await screen.findByText('Balance')).toBeInTheDocument();
  });

  it('renders balance, payout accounts, and payout requests', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockResolvedValue(wallet);
    vi.spyOn(apiClient, 'listMyExpertPayoutAccounts').mockResolvedValue([verifiedAccount]);
    vi.spyOn(apiClient, 'listMyExpertPayoutRequests').mockResolvedValue([payoutRequest]);

    render(<ExpertWalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Balance')).toBeInTheDocument();
    });
    expect(
      screen.getAllByText((_, node) => node?.textContent === 'USD 0.00').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Jane Expert/)).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('blocks payout requests until a payout account is verified', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockResolvedValue(wallet);
    vi.spyOn(apiClient, 'listMyExpertPayoutAccounts').mockResolvedValue([
      { ...verifiedAccount, isVerified: false, verifiedAt: null },
    ]);
    vi.spyOn(apiClient, 'listMyExpertPayoutRequests').mockResolvedValue([]);

    render(<ExpertWalletPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Add and verify a payout account before requesting a payout.'),
      ).toBeInTheDocument();
    });
  });

  it('submits a new payout account', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockResolvedValue(wallet);
    vi.spyOn(apiClient, 'listMyExpertPayoutAccounts').mockResolvedValue([]);
    vi.spyOn(apiClient, 'listMyExpertPayoutRequests').mockResolvedValue([]);
    vi.spyOn(apiClient, 'addMyExpertPayoutAccount').mockResolvedValue(verifiedAccount);

    render(<ExpertWalletPage />);
    await waitFor(() => screen.getByPlaceholderText('Account holder name'));

    fireEvent.change(screen.getByPlaceholderText('Account holder name'), {
      target: { value: 'Jane Expert' },
    });
    fireEvent.change(screen.getByPlaceholderText('Account number'), {
      target: { value: '000123456789' },
    });
    fireEvent.click(screen.getByText('Add payout account'));

    await waitFor(() => {
      expect(apiClient.addMyExpertPayoutAccount).toHaveBeenCalledWith('test-token', {
        accountHolder: 'Jane Expert',
        accountType: 'bank_account',
        accountNumber: '000123456789',
        routingNumber: undefined,
      });
    });
  });

  it('submits a payout request when a verified account exists', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockResolvedValue(wallet);
    vi.spyOn(apiClient, 'listMyExpertPayoutAccounts').mockResolvedValue([verifiedAccount]);
    vi.spyOn(apiClient, 'listMyExpertPayoutRequests').mockResolvedValue([]);
    vi.spyOn(apiClient, 'requestMyExpertPayout').mockResolvedValue(payoutRequest);

    render(<ExpertWalletPage />);
    await waitFor(() => screen.getByPlaceholderText('Amount'));

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '10.00' } });
    fireEvent.click(screen.getByText('Request payout'));

    await waitFor(() => {
      expect(apiClient.requestMyExpertPayout).toHaveBeenCalledWith('test-token', {
        payoutAccountId: 'acct-1',
        amount: '10.00',
      });
    });
  });

  it('logs out on a 401', async () => {
    vi.spyOn(apiClient, 'getMyExpertWallet').mockRejectedValue(
      new apiClient.ApiClientError('Unauthorized', 401),
    );
    render(<ExpertWalletPage />);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
