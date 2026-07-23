/*
  Warnings:

  - Made the column `currentCity` on table `CandidatePreference` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TrainerVerificationStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'DISPUTED');

-- AlterTable
ALTER TABLE "CandidatePreference" ALTER COLUMN "currentCity" SET NOT NULL;

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "headline" VARCHAR(160) NOT NULL,
    "bio" TEXT,
    "profileImage" VARCHAR(500),
    "verificationStatus" "TrainerVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "verifiedAt" TIMESTAMP(3),
    "responseTimeMinutes" INTEGER NOT NULL DEFAULT 24,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerService" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerPackage" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "numSessions" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "includesReview" BOOLEAN NOT NULL DEFAULT false,
    "includesReport" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "meetingUrl" VARCHAR(500),
    "notes" TEXT,
    "recordingUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "communication" INTEGER NOT NULL,
    "technicalKnowledge" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "problemSolving" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT,
    "improvements" TEXT,
    "nextSteps" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE INDEX "TrainerProfile_verificationStatus_idx" ON "TrainerProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "TrainerProfile_averageRating_idx" ON "TrainerProfile"("averageRating");

-- CreateIndex
CREATE INDEX "TrainerService_trainerId_idx" ON "TrainerService"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerService_category_idx" ON "TrainerService"("category");

-- CreateIndex
CREATE INDEX "TrainerPackage_trainerId_idx" ON "TrainerPackage"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerPackage_serviceId_idx" ON "TrainerPackage"("serviceId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_trainerId_dayOfWeek_idx" ON "AvailabilityRule"("trainerId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Booking_trainerId_status_idx" ON "Booking"("trainerId", "status");

-- CreateIndex
CREATE INDEX "Booking_candidateId_idx" ON "Booking"("candidateId");

-- CreateIndex
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_bookingId_key" ON "Evaluation"("bookingId");

-- CreateIndex
CREATE INDEX "Evaluation_trainerId_idx" ON "Evaluation"("trainerId");

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerService" ADD CONSTRAINT "TrainerService_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerPackage" ADD CONSTRAINT "TrainerPackage_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerPackage" ADD CONSTRAINT "TrainerPackage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TrainerService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TrainerPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
