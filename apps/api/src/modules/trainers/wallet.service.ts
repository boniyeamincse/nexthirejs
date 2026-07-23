import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface WalletDto {
  balance: number;
  totalEarnings: number;
  totalPayouts: number;
}

export interface PayoutAccountDto {
  accountHolder: string;
  accountType: string;
  accountNumber: string;
  routingNumber?: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async initializeWallet(trainerId: string): Promise<any> {
    const existing = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
    });

    if (existing) {
      throw new BadRequestException('Wallet already initialized');
    }

    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerId },
      select: { userId: true },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer profile not found');
    }

    const wallet = await this.prisma.walletAccount.create({
      data: {
        trainerId: trainer.userId,
        balance: 0,
        currency: 'USD',
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.wallet_initialized',
      actorType: AuditActorType.USER,
      actorUserId: trainerId,
      targetType: 'wallet',
      targetId: wallet.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return wallet;
  }

  async getWallet(trainerId: string): Promise<any> {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async addPayoutAccount(trainerId: string, dto: PayoutAccountDto): Promise<any> {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const account = await this.prisma.payoutAccount.create({
      data: {
        walletId: wallet.id,
        accountHolder: dto.accountHolder,
        accountType: dto.accountType,
        accountNumber: dto.accountNumber,
        routingNumber: dto.routingNumber,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.payout_account_created',
      actorType: AuditActorType.USER,
      actorUserId: trainerId,
      targetType: 'payout_account',
      targetId: account.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { accountType: dto.accountType },
    });

    return account;
  }

  async requestPayout(trainerId: string, accountId: string, amount: number): Promise<any> {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
      select: { id: true, balance: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const account = await this.prisma.payoutAccount.findUnique({
      where: { id: accountId },
      select: { walletId: true, isVerified: true },
    });

    if (!account || account.walletId !== wallet.id) {
      throw new NotFoundException('Payout account not found');
    }

    if (!account.isVerified) {
      throw new BadRequestException('Payout account not verified');
    }

    const request = await this.prisma.payoutRequest.create({
      data: {
        payoutAccountId: accountId,
        amount,
        status: 'PENDING',
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.payout_requested',
      actorType: AuditActorType.USER,
      actorUserId: trainerId,
      targetType: 'payout_request',
      targetId: request.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { amount },
    });

    this.logger.log(`Payout requested: ${request.id} by trainer ${trainerId} for $${amount}`);

    return request;
  }

  async recordTransaction(
    walletId: string,
    type:
      | 'BOOKING_PAYMENT_IN'
      | 'BOOKING_REFUND'
      | 'PAYOUT_OUT'
      | 'COMMISSION_DEDUCTION'
      | 'PLATFORM_FEE'
      | 'BONUS'
      | 'ADJUSTMENT',
    amount: number,
    description?: string,
    bookingId?: string,
  ): Promise<void> {
    const wallet = await this.prisma.walletAccount.findUnique({
      where: { id: walletId },
      select: { balance: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const newBalance = wallet.balance.toNumber() + amount;

    await this.prisma.walletLedger.create({
      data: {
        walletId,
        type,
        amount,
        description,
        bookingId,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
      },
    });

    await this.prisma.walletAccount.update({
      where: { id: walletId },
      data: {
        balance: newBalance,
        totalEarnings: {
          increment: amount > 0 ? amount : 0,
        },
      },
    });
  }

  async listPayoutAccounts(trainerId: string): Promise<any[]> {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.prisma.payoutAccount.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPayoutRequests(trainerId: string): Promise<any[]> {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        trainer: { userId: trainerId },
      },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.prisma.payoutRequest.findMany({
      where: {
        payoutAccount: { walletId: wallet.id },
      },
      include: { payoutAccount: true },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
