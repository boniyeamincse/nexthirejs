-- CreateEnum
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CompanyDocumentType" AS ENUM ('BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'AUTHORIZATION_LETTER', 'OTHER_SUPPORTING_DOCUMENT');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "legalName" VARCHAR(200),
    "website" VARCHAR(500),
    "industry" VARCHAR(150),
    "companySize" VARCHAR(50),
    "headquartersCountryId" UUID NOT NULL,
    "headquartersCity" VARCHAR(120),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVerificationApplication" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "status" "CompanyVerificationStatus" NOT NULL DEFAULT 'DRAFT',
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

    CONSTRAINT "CompanyVerificationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVerificationDocument" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "type" "CompanyDocumentType" NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" VARCHAR(64) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ownerUserId_key" ON "Company"("ownerUserId");

-- CreateIndex
CREATE INDEX "Company_ownerUserId_idx" ON "Company"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyVerificationApplication_companyId_key" ON "CompanyVerificationApplication"("companyId");

-- CreateIndex
CREATE INDEX "CompanyVerificationApplication_status_submittedAt_idx" ON "CompanyVerificationApplication"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "CompanyVerificationApplication_reviewedById_reviewedAt_idx" ON "CompanyVerificationApplication"("reviewedById", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyVerificationDocument_storageKey_key" ON "CompanyVerificationDocument"("storageKey");

-- CreateIndex
CREATE INDEX "CompanyVerificationDocument_applicationId_type_removedAt_idx" ON "CompanyVerificationDocument"("applicationId", "type", "removedAt");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyVerificationApplication" ADD CONSTRAINT "CompanyVerificationApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyVerificationDocument" ADD CONSTRAINT "CompanyVerificationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CompanyVerificationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
