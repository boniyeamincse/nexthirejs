import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CreateExpertPayoutAccountInput,
  CreateExpertPayoutRequestInput,
  ExpertPayoutAccountResult,
  ExpertPayoutRequestResult,
  ExpertPayoutStatus,
  ExpertWalletResult,
} from '@nexthire/types';
import { EXPERT_WALLET_ERROR_CODES } from '@nexthire/constants';

interface WalletRecord {
  id: string;
  balance: { toString(): string };
  currency: string;
  status: string;
  totalEarnings: { toString(): string };
  totalPayouts: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  transactions: TransactionRecord[];
}

interface TransactionRecord {
  id: string;
  type: string;
  amount: { toString(): string };
  description: string | null;
  bookingId: string | null;
  balanceBefore: { toString(): string };
  balanceAfter: { toString(): string };
  createdAt: Date;
}

interface PayoutAccountRecord {
  id: string;
  accountHolder: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string | null;
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
}

interface PayoutRequestRecord {
  id: string;
  payoutAccountId: string;
  amount: { toString(): string };
  status: string;
  requestedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
  failureReason: string | null;
}

function maskTail(value: string, visible = 4): string {
  if (value.length <= visible) return '*'.repeat(value.length);
  return `${'*'.repeat(value.length - visible)}${value.slice(-visible)}`;
}

@Injectable()
export class ExpertWalletService {
  private readonly logger = new Logger(ExpertWalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async initializeWallet(userId: string): Promise<ExpertWalletResult> {
    const existing = await this.prisma.expertWalletAccount.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException(EXPERT_WALLET_ERROR_CODES.ALREADY_INITIALIZED);
    }

    const wallet = await this.prisma.expertWalletAccount.create({
      data: { userId, balance: 0, currency: 'USD' },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.wallet.initialized',
      targetType: 'ExpertWalletAccount',
      targetId: wallet.id,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Wallet ${wallet.id} initialized for expert ${userId}`);

    return this.mapWallet({ ...wallet, transactions: [] });
  }

  async getWallet(userId: string): Promise<ExpertWalletResult | null> {
    const wallet = await this.prisma.expertWalletAccount.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    return wallet ? this.mapWallet(wallet) : null;
  }

  async addPayoutAccount(
    userId: string,
    input: CreateExpertPayoutAccountInput,
  ): Promise<ExpertPayoutAccountResult> {
    const wallet = await this.prisma.expertWalletAccount.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
    }

    const account = await this.prisma.expertPayoutAccount.create({
      data: {
        walletId: wallet.id,
        accountHolder: input.accountHolder,
        accountType: input.accountType,
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber ?? null,
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.wallet.payout_account_created',
      targetType: 'ExpertPayoutAccount',
      targetId: account.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { accountType: input.accountType },
    });

    return this.mapPayoutAccount(account);
  }

  async listPayoutAccounts(userId: string): Promise<ExpertPayoutAccountResult[]> {
    const wallet = await this.prisma.expertWalletAccount.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
    }

    const accounts = await this.prisma.expertPayoutAccount.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => this.mapPayoutAccount(a));
  }

  async requestPayout(
    userId: string,
    input: CreateExpertPayoutRequestInput,
  ): Promise<ExpertPayoutRequestResult> {
    const wallet = await this.prisma.expertWalletAccount.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    });
    if (!wallet) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
    }

    const amount = Number(input.amount);
    if (wallet.balance.toNumber() < amount) {
      throw new BadRequestException(EXPERT_WALLET_ERROR_CODES.INSUFFICIENT_BALANCE);
    }

    const account = await this.prisma.expertPayoutAccount.findUnique({
      where: { id: input.payoutAccountId },
      select: { walletId: true, isVerified: true },
    });
    if (!account || account.walletId !== wallet.id) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.PAYOUT_ACCOUNT_NOT_FOUND);
    }
    if (!account.isVerified) {
      throw new BadRequestException(EXPERT_WALLET_ERROR_CODES.PAYOUT_ACCOUNT_NOT_VERIFIED);
    }

    const request = await this.prisma.expertPayoutRequest.create({
      data: { payoutAccountId: input.payoutAccountId, amount, status: 'PENDING' },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.wallet.payout_requested',
      targetType: 'ExpertPayoutRequest',
      targetId: request.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { amount: input.amount },
    });

    this.logger.log(`Payout requested: ${request.id} by expert ${userId} for ${input.amount}`);

    return this.mapPayoutRequest(request);
  }

  async listPayoutRequests(userId: string): Promise<ExpertPayoutRequestResult[]> {
    const wallet = await this.prisma.expertWalletAccount.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
    }

    const requests = await this.prisma.expertPayoutRequest.findMany({
      where: { payoutAccount: { walletId: wallet.id } },
      orderBy: { requestedAt: 'desc' },
    });
    return requests.map((r) => this.mapPayoutRequest(r));
  }

  /** Admin-only: cross-expert payout request queue. */
  async listForAdmin(
    status?: string,
  ): Promise<(ExpertPayoutRequestResult & { expertUserId: string })[]> {
    const where: Record<string, unknown> = status ? { status } : {};
    const requests = await this.prisma.expertPayoutRequest.findMany({
      where,
      include: { payoutAccount: { include: { wallet: { select: { userId: true } } } } },
      orderBy: { requestedAt: 'asc' },
    });
    return requests.map((r) => ({
      ...this.mapPayoutRequest(r),
      expertUserId: r.payoutAccount.wallet.userId,
    }));
  }

  /** Admin-only: flips KYC verification so the account becomes eligible for payout requests. */
  async verifyPayoutAccount(
    accountId: string,
    adminUserId: string,
  ): Promise<ExpertPayoutAccountResult> {
    const account = await this.prisma.expertPayoutAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.PAYOUT_ACCOUNT_NOT_FOUND);
    }
    const updated = await this.prisma.expertPayoutAccount.update({
      where: { id: accountId },
      data: { isVerified: true, verifiedAt: new Date() },
    });
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: adminUserId,
      action: 'expert.wallet.payout_account_verified',
      targetType: 'ExpertPayoutAccount',
      targetId: accountId,
      outcome: AuditOutcome.SUCCESS,
    });
    return this.mapPayoutAccount(updated);
  }

  /**
   * Admin-only: transitions a payout request. Completing one debits the wallet and records a
   * PAYOUT_OUT ledger entry — the mechanism is real, even though wallet balances stay at zero in
   * practice until NH-M29 wires up real payment capture to credit them.
   */
  async processPayoutRequest(
    requestId: string,
    adminUserId: string,
    status: Extract<ExpertPayoutStatus, 'COMPLETED' | 'FAILED' | 'CANCELLED'>,
    failureReason?: string | null,
  ): Promise<ExpertPayoutRequestResult> {
    const request = await this.prisma.expertPayoutRequest.findUnique({
      where: { id: requestId },
      include: { payoutAccount: { select: { walletId: true } } },
    });
    if (!request) {
      throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
    }
    if (request.status !== 'PENDING' && request.status !== 'PROCESSING') {
      throw new BadRequestException(EXPERT_WALLET_ERROR_CODES.VALIDATION_FAILED);
    }

    if (status === 'COMPLETED') {
      const walletId = request.payoutAccount.walletId;
      const wallet = await this.prisma.expertWalletAccount.findUnique({ where: { id: walletId } });
      if (!wallet) {
        throw new NotFoundException(EXPERT_WALLET_ERROR_CODES.NOT_FOUND);
      }
      const amount = request.amount.toNumber();
      if (wallet.balance.toNumber() < amount) {
        throw new BadRequestException(EXPERT_WALLET_ERROR_CODES.INSUFFICIENT_BALANCE);
      }
      const balanceBefore = wallet.balance.toNumber();
      const balanceAfter = balanceBefore - amount;

      await this.prisma.$transaction([
        this.prisma.expertWalletLedger.create({
          data: {
            walletId,
            type: 'PAYOUT_OUT',
            amount: -amount,
            description: `Payout ${requestId}`,
            balanceBefore,
            balanceAfter,
          },
        }),
        this.prisma.expertWalletAccount.update({
          where: { id: walletId },
          data: { balance: balanceAfter, totalPayouts: { increment: amount } },
        }),
        this.prisma.expertPayoutRequest.update({
          where: { id: requestId },
          data: { status: 'COMPLETED', processedAt: new Date(), completedAt: new Date() },
        }),
      ]);
    } else {
      await this.prisma.expertPayoutRequest.update({
        where: { id: requestId },
        data: { status, processedAt: new Date(), failureReason: failureReason ?? null },
      });
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: adminUserId,
      action: 'expert.wallet.payout_processed',
      targetType: 'ExpertPayoutRequest',
      targetId: requestId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { status },
    });

    const updated = await this.prisma.expertPayoutRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    return this.mapPayoutRequest(updated);
  }

  private mapWallet(record: WalletRecord): ExpertWalletResult {
    return {
      id: record.id,
      balance: record.balance.toString(),
      currency: record.currency,
      status: record.status as ExpertWalletResult['status'],
      totalEarnings: record.totalEarnings.toString(),
      totalPayouts: record.totalPayouts.toString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      recentTransactions: record.transactions.map((t) => ({
        id: t.id,
        type: t.type as ExpertWalletResult['recentTransactions'][number]['type'],
        amount: t.amount.toString(),
        description: t.description,
        bookingId: t.bookingId,
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  private mapPayoutAccount(record: PayoutAccountRecord): ExpertPayoutAccountResult {
    return {
      id: record.id,
      accountHolder: record.accountHolder,
      accountType: record.accountType,
      accountNumberMasked: maskTail(record.accountNumber),
      routingNumberMasked: record.routingNumber ? maskTail(record.routingNumber) : null,
      isDefault: record.isDefault,
      isVerified: record.isVerified,
      verifiedAt: record.verifiedAt ? record.verifiedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private mapPayoutRequest(record: PayoutRequestRecord): ExpertPayoutRequestResult {
    return {
      id: record.id,
      payoutAccountId: record.payoutAccountId,
      amount: record.amount.toString(),
      status: record.status as ExpertPayoutStatus,
      requestedAt: record.requestedAt.toISOString(),
      processedAt: record.processedAt ? record.processedAt.toISOString() : null,
      completedAt: record.completedAt ? record.completedAt.toISOString() : null,
      failureReason: record.failureReason,
    };
  }
}
