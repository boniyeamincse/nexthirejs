-- CreateEnum
CREATE TYPE "MfaStatus" AS ENUM ('DISABLED', 'PENDING', 'ENABLED');

-- CreateEnum
CREATE TYPE "MfaChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'CONSUMED', 'REVOKED');

-- CreateTable
CREATE TABLE "UserMfa" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MfaStatus" NOT NULL DEFAULT 'DISABLED',
    "encryptedTotpSecret" TEXT,
    "secretEncryptionVersion" INTEGER,
    "enrollmentExpiresAt" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "recoveryCodesGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" VARCHAR(255) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MfaChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "challengeTokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaTrustedDevice" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "deviceName" VARCHAR(120),
    "browserSummary" VARCHAR(200),
    "trustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaTrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMfa_userId_key" ON "UserMfa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON "MfaRecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx" ON "MfaRecoveryCode"("userId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaChallenge_challengeTokenHash_key" ON "MfaChallenge"("challengeTokenHash");

-- CreateIndex
CREATE INDEX "MfaChallenge_userId_status_expiresAt_idx" ON "MfaChallenge"("userId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaTrustedDevice_tokenHash_key" ON "MfaTrustedDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "MfaTrustedDevice_userId_revokedAt_expiresAt_idx" ON "MfaTrustedDevice"("userId", "revokedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "UserMfa" ADD CONSTRAINT "UserMfa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaTrustedDevice" ADD CONSTRAINT "MfaTrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
