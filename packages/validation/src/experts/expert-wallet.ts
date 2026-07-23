import { z } from 'zod';
import { EXPERT_PAYOUT_ACCOUNT_TYPES, EXPERT_WALLET_LIMITS } from '@nexthire/constants';

export const createExpertPayoutAccountSchema = z.object({
  accountHolder: z.string().trim().min(1).max(EXPERT_WALLET_LIMITS.ACCOUNT_HOLDER_MAX),
  accountType: z.enum(EXPERT_PAYOUT_ACCOUNT_TYPES),
  accountNumber: z
    .string()
    .trim()
    .min(EXPERT_WALLET_LIMITS.ACCOUNT_NUMBER_MIN)
    .max(EXPERT_WALLET_LIMITS.ACCOUNT_NUMBER_MAX),
  routingNumber: z
    .string()
    .trim()
    .max(EXPERT_WALLET_LIMITS.ROUTING_NUMBER_MAX)
    .optional()
    .nullable(),
});

export const createExpertPayoutRequestSchema = z.object({
  payoutAccountId: z.string().uuid('Invalid payout account ID'),
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'Amount must be a valid decimal number with up to 2 decimal places',
    ),
});

export const processExpertPayoutRequestSchema = z.object({
  status: z.enum(['COMPLETED', 'FAILED', 'CANCELLED']),
  failureReason: z.string().trim().max(500).optional().nullable(),
});
