-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivationReason" VARCHAR(100);

-- CreateTable
CREATE TABLE "CandidateDataExportRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "DataExportStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" VARCHAR(500),
    "fileSizeBytes" BIGINT,
    "checksumSha256" VARCHAR(64),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCategory" VARCHAR(100),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateDataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateDataExportRequest_userId_requestedAt_idx" ON "CandidateDataExportRequest"("userId", "requestedAt");

-- CreateIndex
CREATE INDEX "CandidateDataExportRequest_status_expiresAt_idx" ON "CandidateDataExportRequest"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "CandidateDataExportRequest" ADD CONSTRAINT "CandidateDataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
