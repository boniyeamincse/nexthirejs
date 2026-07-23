export type ExpertWalletStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export type ExpertPayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ExpertWalletTransactionType =
  | 'BOOKING_PAYMENT_IN'
  | 'BOOKING_REFUND'
  | 'PAYOUT_OUT'
  | 'COMMISSION_DEDUCTION'
  | 'PLATFORM_FEE'
  | 'BONUS'
  | 'ADJUSTMENT';

export interface ExpertWalletResult {
  id: string;
  balance: string;
  currency: string;
  status: ExpertWalletStatus;
  totalEarnings: string;
  totalPayouts: string;
  createdAt: string;
  updatedAt: string;
  recentTransactions: ExpertWalletTransactionResult[];
}

export interface ExpertWalletTransactionResult {
  id: string;
  type: ExpertWalletTransactionType;
  amount: string;
  description: string | null;
  bookingId: string | null;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export interface CreateExpertPayoutAccountInput {
  accountHolder: string;
  accountType: string;
  accountNumber: string;
  routingNumber?: string | null;
}

export interface ExpertPayoutAccountResult {
  id: string;
  accountHolder: string;
  accountType: string;
  accountNumberMasked: string;
  routingNumberMasked: string | null;
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface CreateExpertPayoutRequestInput {
  payoutAccountId: string;
  amount: string;
}

export interface ExpertPayoutRequestResult {
  id: string;
  payoutAccountId: string;
  amount: string;
  status: ExpertPayoutStatus;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
}
