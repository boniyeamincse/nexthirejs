-- CreateEnum
CREATE TYPE "AssessmentCertificateStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateValidityDays" INTEGER,
ADD COLUMN     "retakeCooldownHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retakeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AssessmentCertificate" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "certificateNumber" VARCHAR(80) NOT NULL,
    "verificationCodeHash" VARCHAR(128) NOT NULL,
    "verificationCodeHint" VARCHAR(20),
    "status" "AssessmentCertificateStatus" NOT NULL DEFAULT 'PENDING',
    "holderNameSnapshot" VARCHAR(200) NOT NULL,
    "assessmentTitleSnapshot" VARCHAR(200) NOT NULL,
    "assessmentSlugSnapshot" VARCHAR(220) NOT NULL,
    "scorePercentageSnapshot" DECIMAL(5,2) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCategory" VARCHAR(100),
    "revokedAt" TIMESTAMP(3),
    "storageKey" VARCHAR(500),
    "fileSizeBytes" BIGINT,
    "checksumSha256" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCertificate_attemptId_key" ON "AssessmentCertificate"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCertificate_certificateNumber_key" ON "AssessmentCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCertificate_verificationCodeHash_key" ON "AssessmentCertificate"("verificationCodeHash");

-- CreateIndex
CREATE INDEX "AssessmentCertificate_candidateId_status_issuedAt_idx" ON "AssessmentCertificate"("candidateId", "status", "issuedAt");

-- CreateIndex
CREATE INDEX "AssessmentCertificate_assessmentId_issuedAt_idx" ON "AssessmentCertificate"("assessmentId", "issuedAt");

-- CreateIndex
CREATE INDEX "AssessmentCertificate_status_expiresAt_idx" ON "AssessmentCertificate"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_candidateId_assessmentId_attemptNumber_key" ON "AssessmentAttempt"("candidateId", "assessmentId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "AssessmentCertificate" ADD CONSTRAINT "AssessmentCertificate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCertificate" ADD CONSTRAINT "AssessmentCertificate_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCertificate" ADD CONSTRAINT "AssessmentCertificate_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
