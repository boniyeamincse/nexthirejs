-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOKING_PAYMENT_IN', 'BOOKING_REFUND', 'PAYOUT_OUT', 'COMMISSION_DEDUCTION', 'PLATFORM_FEE', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WalletAccount" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayouts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(200),
    "bookingId" UUID,
    "referenceId" VARCHAR(100),
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutAccount" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "accountHolder" VARCHAR(200) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL,
    "accountNumber" VARCHAR(100) NOT NULL,
    "routingNumber" VARCHAR(50),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" UUID NOT NULL,
    "payoutAccountId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "referenceId" VARCHAR(100),

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletAccount_trainerId_key" ON "WalletAccount"("trainerId");

-- CreateIndex
CREATE INDEX "WalletAccount_status_idx" ON "WalletAccount"("status");

-- CreateIndex
CREATE INDEX "WalletLedger_walletId_createdAt_idx" ON "WalletLedger"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletLedger_type_createdAt_idx" ON "WalletLedger"("type", "createdAt");

-- CreateIndex
CREATE INDEX "WalletLedger_bookingId_idx" ON "WalletLedger"("bookingId");

-- CreateIndex
CREATE INDEX "Commission_walletId_status_idx" ON "Commission"("walletId", "status");

-- CreateIndex
CREATE INDEX "Commission_bookingId_idx" ON "Commission"("bookingId");

-- CreateIndex
CREATE INDEX "PayoutAccount_walletId_isVerified_idx" ON "PayoutAccount"("walletId", "isVerified");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_requestedAt_idx" ON "PayoutRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_payoutAccountId_idx" ON "PayoutRequest"("payoutAccountId");

-- AddForeignKey
ALTER TABLE "WalletAccount" ADD CONSTRAINT "WalletAccount_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAccount" ADD CONSTRAINT "PayoutAccount_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "PayoutAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
