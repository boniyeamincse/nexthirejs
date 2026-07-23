import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertWalletService } from './expert-wallet.service';

function decimal(n: number) {
  return { toString: () => n.toFixed(2), toNumber: () => n };
}

describe('ExpertWalletService', () => {
  let service: ExpertWalletService;

  const prisma = {
    expertWalletAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    expertPayoutAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    expertPayoutRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    expertWalletLedger: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const auditService = { recordBestEffort: jest.fn().mockResolvedValue(undefined) };

  const WALLET_ROW = {
    id: 'wallet-1',
    userId: 'expert-1',
    balance: decimal(0),
    currency: 'USD',
    status: 'ACTIVE',
    totalEarnings: decimal(0),
    totalPayouts: decimal(0),
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    auditService.recordBestEffort.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    service = new ExpertWalletService(prisma as never, auditService as never);
  });

  describe('initializeWallet', () => {
    it('rejects when a wallet already exists', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue(WALLET_ROW);
      await expect(service.initializeWallet('expert-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates a zero-balance wallet', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue(null);
      prisma.expertWalletAccount.create.mockResolvedValue(WALLET_ROW);

      const result = await service.initializeWallet('expert-1');

      expect(prisma.expertWalletAccount.create).toHaveBeenCalledWith({
        data: { userId: 'expert-1', balance: 0, currency: 'USD' },
      });
      expect(result.balance).toBe('0.00');
      expect(result.recentTransactions).toEqual([]);
    });
  });

  describe('getWallet', () => {
    it('returns null when no wallet exists', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue(null);
      expect(await service.getWallet('expert-1')).toBeNull();
    });

    it('maps the wallet with recent transactions', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        ...WALLET_ROW,
        transactions: [
          {
            id: 'tx-1',
            type: 'PAYOUT_OUT',
            amount: decimal(-10),
            description: 'x',
            bookingId: null,
            balanceBefore: decimal(10),
            balanceAfter: decimal(0),
            createdAt: new Date('2026-08-02T00:00:00.000Z'),
          },
        ],
      });
      const result = await service.getWallet('expert-1');
      expect(result?.recentTransactions).toHaveLength(1);
      expect(result?.recentTransactions[0]?.amount).toBe('-10.00');
    });
  });

  describe('addPayoutAccount', () => {
    it('404s when the expert has no wallet yet', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue(null);
      await expect(
        service.addPayoutAccount('expert-1', {
          accountHolder: 'Jane',
          accountType: 'bank_account',
          accountNumber: '000123456789',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates the account and masks the number in the response', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({ id: 'wallet-1' });
      prisma.expertPayoutAccount.create.mockResolvedValue({
        id: 'acct-1',
        accountHolder: 'Jane',
        accountType: 'bank_account',
        accountNumber: '000123456789',
        routingNumber: '111000025',
        isDefault: false,
        isVerified: false,
        verifiedAt: null,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      });

      const result = await service.addPayoutAccount('expert-1', {
        accountHolder: 'Jane',
        accountType: 'bank_account',
        accountNumber: '000123456789',
        routingNumber: '111000025',
      });

      expect(result.accountNumberMasked).toBe('********6789');
      expect(result.routingNumberMasked).toBe('*****0025');
      expect((result as unknown as { accountNumber?: string }).accountNumber).toBeUndefined();
    });
  });

  describe('requestPayout', () => {
    it('rejects insufficient balance', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(5),
      });
      await expect(
        service.requestPayout('expert-1', { payoutAccountId: 'acct-1', amount: '10.00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404s when the payout account does not belong to this wallet', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(50),
      });
      prisma.expertPayoutAccount.findUnique.mockResolvedValue({
        walletId: 'other-wallet',
        isVerified: true,
      });
      await expect(
        service.requestPayout('expert-1', { payoutAccountId: 'acct-1', amount: '10.00' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an unverified payout account', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(50),
      });
      prisma.expertPayoutAccount.findUnique.mockResolvedValue({
        walletId: 'wallet-1',
        isVerified: false,
      });
      await expect(
        service.requestPayout('expert-1', { payoutAccountId: 'acct-1', amount: '10.00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a PENDING payout request', async () => {
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(50),
      });
      prisma.expertPayoutAccount.findUnique.mockResolvedValue({
        walletId: 'wallet-1',
        isVerified: true,
      });
      prisma.expertPayoutRequest.create.mockResolvedValue({
        id: 'req-1',
        payoutAccountId: 'acct-1',
        amount: decimal(10),
        status: 'PENDING',
        requestedAt: new Date('2026-08-01T00:00:00.000Z'),
        processedAt: null,
        completedAt: null,
        failureReason: null,
      });

      const result = await service.requestPayout('expert-1', {
        payoutAccountId: 'acct-1',
        amount: '10.00',
      });

      expect(prisma.expertPayoutRequest.create).toHaveBeenCalledWith({
        data: { payoutAccountId: 'acct-1', amount: 10, status: 'PENDING' },
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('processPayoutRequest', () => {
    const PENDING_REQUEST = {
      id: 'req-1',
      payoutAccountId: 'acct-1',
      amount: decimal(10),
      status: 'PENDING',
      requestedAt: new Date('2026-08-01T00:00:00.000Z'),
      processedAt: null,
      completedAt: null,
      failureReason: null,
      payoutAccount: { walletId: 'wallet-1' },
    };

    it('404s when the request does not exist', async () => {
      prisma.expertPayoutRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.processPayoutRequest('req-1', 'admin-1', 'COMPLETED'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects processing an already-terminal request', async () => {
      prisma.expertPayoutRequest.findUnique.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'COMPLETED',
      });
      await expect(
        service.processPayoutRequest('req-1', 'admin-1', 'COMPLETED'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects completion when the wallet balance is insufficient', async () => {
      prisma.expertPayoutRequest.findUnique.mockResolvedValue(PENDING_REQUEST);
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(5),
      });
      await expect(
        service.processPayoutRequest('req-1', 'admin-1', 'COMPLETED'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debits the wallet and records a ledger entry on completion', async () => {
      prisma.expertPayoutRequest.findUnique.mockResolvedValue(PENDING_REQUEST);
      prisma.expertWalletAccount.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: decimal(50),
      });
      prisma.expertPayoutRequest.findUniqueOrThrow.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'COMPLETED',
      });

      const result = await service.processPayoutRequest('req-1', 'admin-1', 'COMPLETED');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('marks a request FAILED without touching the wallet', async () => {
      prisma.expertPayoutRequest.findUnique.mockResolvedValue(PENDING_REQUEST);
      prisma.expertPayoutRequest.findUniqueOrThrow.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'FAILED',
        failureReason: 'bad account',
      });

      const result = await service.processPayoutRequest(
        'req-1',
        'admin-1',
        'FAILED',
        'bad account',
      );

      expect(prisma.expertPayoutRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: expect.objectContaining({ status: 'FAILED', failureReason: 'bad account' }),
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result.status).toBe('FAILED');
    });
  });

  describe('verifyPayoutAccount', () => {
    it('404s when the account does not exist', async () => {
      prisma.expertPayoutAccount.findUnique.mockResolvedValue(null);
      await expect(service.verifyPayoutAccount('acct-1', 'admin-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('flips isVerified and stamps verifiedAt', async () => {
      prisma.expertPayoutAccount.findUnique.mockResolvedValue({ id: 'acct-1' });
      prisma.expertPayoutAccount.update.mockResolvedValue({
        id: 'acct-1',
        accountHolder: 'Jane',
        accountType: 'bank_account',
        accountNumber: '000123456789',
        routingNumber: null,
        isDefault: false,
        isVerified: true,
        verifiedAt: new Date('2026-08-01T00:00:00.000Z'),
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      });

      const result = await service.verifyPayoutAccount('acct-1', 'admin-1');
      expect(result.isVerified).toBe(true);
    });
  });

  describe('listForAdmin', () => {
    it('maps rows with the owning expert userId', async () => {
      prisma.expertPayoutRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          payoutAccountId: 'acct-1',
          amount: decimal(10),
          status: 'PENDING',
          requestedAt: new Date('2026-08-01T00:00:00.000Z'),
          processedAt: null,
          completedAt: null,
          failureReason: null,
          payoutAccount: { wallet: { userId: 'expert-1' } },
        },
      ]);

      const result = await service.listForAdmin('PENDING');
      expect(result[0]?.expertUserId).toBe('expert-1');
    });
  });
});
