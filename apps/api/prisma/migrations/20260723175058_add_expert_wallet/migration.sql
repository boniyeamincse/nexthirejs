-- CreateTable
CREATE TABLE "ExpertWalletAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayouts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertWalletAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertWalletLedger" (
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

    CONSTRAINT "ExpertWalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertPayoutAccount" (
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

    CONSTRAINT "ExpertPayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertPayoutRequest" (
    "id" UUID NOT NULL,
    "payoutAccountId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "referenceId" VARCHAR(100),

    CONSTRAINT "ExpertPayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertWalletAccount_userId_key" ON "ExpertWalletAccount"("userId");

-- CreateIndex
CREATE INDEX "ExpertWalletAccount_status_idx" ON "ExpertWalletAccount"("status");

-- CreateIndex
CREATE INDEX "ExpertWalletLedger_walletId_createdAt_idx" ON "ExpertWalletLedger"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ExpertWalletLedger_type_createdAt_idx" ON "ExpertWalletLedger"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ExpertWalletLedger_bookingId_idx" ON "ExpertWalletLedger"("bookingId");

-- CreateIndex
CREATE INDEX "ExpertPayoutAccount_walletId_isVerified_idx" ON "ExpertPayoutAccount"("walletId", "isVerified");

-- CreateIndex
CREATE INDEX "ExpertPayoutRequest_status_requestedAt_idx" ON "ExpertPayoutRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "ExpertPayoutRequest_payoutAccountId_idx" ON "ExpertPayoutRequest"("payoutAccountId");

-- AddForeignKey
ALTER TABLE "ExpertWalletAccount" ADD CONSTRAINT "ExpertWalletAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertWalletLedger" ADD CONSTRAINT "ExpertWalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "ExpertWalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertPayoutAccount" ADD CONSTRAINT "ExpertPayoutAccount_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "ExpertWalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertPayoutRequest" ADD CONSTRAINT "ExpertPayoutRequest_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "ExpertPayoutAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
