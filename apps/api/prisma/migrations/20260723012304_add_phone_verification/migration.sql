-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PhoneVerificationOtp" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "otpHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneVerificationOtp_userId_idx" ON "PhoneVerificationOtp"("userId");

-- CreateIndex
CREATE INDEX "PhoneVerificationOtp_phone_expiresAt_idx" ON "PhoneVerificationOtp"("phone", "expiresAt");

-- CreateIndex
CREATE INDEX "PhoneVerificationOtp_expiresAt_idx" ON "PhoneVerificationOtp"("expiresAt");

-- AddForeignKey
ALTER TABLE "PhoneVerificationOtp" ADD CONSTRAINT "PhoneVerificationOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
