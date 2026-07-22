-- CreateEnum
CREATE TYPE "ExpertApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ExpertVerificationDocumentType" AS ENUM ('GOVERNMENT_ID', 'PROFESSIONAL_CERTIFICATE', 'EMPLOYMENT_PROOF', 'EDUCATION_CERTIFICATE', 'OTHER_SUPPORTING_DOCUMENT');

-- DropIndex
DROP INDEX "AssessmentAttempt_assessmentId_status_scorePercentage_idx";

-- DropIndex
DROP INDEX "AssessmentAttempt_candidateId_submittedAt_idx";

-- DropIndex
DROP INDEX "AssessmentAttempt_resultStatus_submittedAt_idx";

-- CreateTable
CREATE TABLE "ExpertProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "professionalTitle" VARCHAR(150) NOT NULL,
    "professionalSummary" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    "currentCompany" VARCHAR(150),
    "currentPosition" VARCHAR(150),
    "highestEducation" VARCHAR(200),
    "linkedinUrl" VARCHAR(500),
    "portfolioUrl" VARCHAR(500),
    "personalWebsiteUrl" VARCHAR(500),
    "interviewLanguages" JSONB NOT NULL,
    "countryId" UUID NOT NULL,
    "city" VARCHAR(120),
    "profilePhotoFileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expertProfileId" UUID NOT NULL,
    "status" "ExpertApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submissionVersion" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "reviewStartedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "decisionReasonCode" VARCHAR(100),
    "reviewerNote" TEXT,
    "applicantResponse" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertVerificationDocument" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "type" "ExpertVerificationDocumentType" NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" VARCHAR(64) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_userId_key" ON "ExpertProfile"("userId");

-- CreateIndex
CREATE INDEX "ExpertProfile_countryId_idx" ON "ExpertProfile"("countryId");

-- CreateIndex
CREATE INDEX "ExpertApplication_userId_status_idx" ON "ExpertApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "ExpertApplication_status_submittedAt_idx" ON "ExpertApplication"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ExpertApplication_reviewedById_reviewedAt_idx" ON "ExpertApplication"("reviewedById", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertVerificationDocument_storageKey_key" ON "ExpertVerificationDocument"("storageKey");

-- CreateIndex
CREATE INDEX "ExpertVerificationDocument_applicationId_type_removedAt_idx" ON "ExpertVerificationDocument"("applicationId", "type", "removedAt");

-- AddForeignKey
ALTER TABLE "ExpertProfile" ADD CONSTRAINT "ExpertProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertApplication" ADD CONSTRAINT "ExpertApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertApplication" ADD CONSTRAINT "ExpertApplication_expertProfileId_fkey" FOREIGN KEY ("expertProfileId") REFERENCES "ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertVerificationDocument" ADD CONSTRAINT "ExpertVerificationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ExpertApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
