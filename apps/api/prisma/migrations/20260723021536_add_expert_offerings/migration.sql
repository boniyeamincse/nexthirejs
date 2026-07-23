-- CreateEnum
CREATE TYPE "ExpertExpertiseLevel" AS ENUM ('INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ExpertServiceType" AS ENUM ('MOCK_INTERVIEW', 'CV_REVIEW', 'CAREER_COACHING', 'TECHNICAL_INTERVIEW_PREPARATION', 'BEHAVIORAL_INTERVIEW_PREPARATION', 'PORTFOLIO_REVIEW');

-- CreateEnum
CREATE TYPE "ExpertServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpertAvailabilityOverrideType" AS ENUM ('UNAVAILABLE', 'CUSTOM_HOURS');

-- CreateTable
CREATE TABLE "ExpertiseArea" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertiseArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertExpertise" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expertiseAreaId" UUID NOT NULL,
    "level" "ExpertExpertiseLevel" NOT NULL,
    "yearsExperience" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertService" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expertiseAreaId" UUID NOT NULL,
    "type" "ExpertServiceType" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "shortDescription" VARCHAR(300) NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceAmount" DECIMAL(12,2) NOT NULL,
    "priceCurrency" CHAR(3) NOT NULL,
    "languageCodes" TEXT[],
    "preparationInstructions" TEXT,
    "status" "ExpertServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertAvailabilityProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "minimumNoticeHours" INTEGER NOT NULL DEFAULT 12,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertAvailabilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertWeeklyAvailability" (
    "id" UUID NOT NULL,
    "availabilityProfileId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startLocalTime" VARCHAR(5) NOT NULL,
    "endLocalTime" VARCHAR(5) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertAvailabilityOverride" (
    "id" UUID NOT NULL,
    "availabilityProfileId" UUID NOT NULL,
    "localDate" VARCHAR(10) NOT NULL,
    "type" "ExpertAvailabilityOverrideType" NOT NULL,
    "reason" VARCHAR(300),
    "windows" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertAvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseArea_slug_key" ON "ExpertiseArea"("slug");

-- CreateIndex
CREATE INDEX "ExpertiseArea_isActive_sortOrder_idx" ON "ExpertiseArea"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ExpertExpertise_userId_isPrimary_idx" ON "ExpertExpertise"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "ExpertExpertise_expertiseAreaId_idx" ON "ExpertExpertise"("expertiseAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertExpertise_userId_expertiseAreaId_key" ON "ExpertExpertise"("userId", "expertiseAreaId");

-- CreateIndex
CREATE INDEX "ExpertService_userId_status_idx" ON "ExpertService"("userId", "status");

-- CreateIndex
CREATE INDEX "ExpertService_expertiseAreaId_status_idx" ON "ExpertService"("expertiseAreaId", "status");

-- CreateIndex
CREATE INDEX "ExpertService_type_status_idx" ON "ExpertService"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertAvailabilityProfile_userId_key" ON "ExpertAvailabilityProfile"("userId");

-- CreateIndex
CREATE INDEX "ExpertWeeklyAvailability_availabilityProfileId_dayOfWeek_idx" ON "ExpertWeeklyAvailability"("availabilityProfileId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ExpertAvailabilityOverride_availabilityProfileId_localDate_idx" ON "ExpertAvailabilityOverride"("availabilityProfileId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertAvailabilityOverride_availabilityProfileId_localDate_key" ON "ExpertAvailabilityOverride"("availabilityProfileId", "localDate");

-- AddForeignKey
ALTER TABLE "ExpertExpertise" ADD CONSTRAINT "ExpertExpertise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertExpertise" ADD CONSTRAINT "ExpertExpertise_expertiseAreaId_fkey" FOREIGN KEY ("expertiseAreaId") REFERENCES "ExpertiseArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertService" ADD CONSTRAINT "ExpertService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertService" ADD CONSTRAINT "ExpertService_expertiseAreaId_fkey" FOREIGN KEY ("expertiseAreaId") REFERENCES "ExpertiseArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAvailabilityProfile" ADD CONSTRAINT "ExpertAvailabilityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertWeeklyAvailability" ADD CONSTRAINT "ExpertWeeklyAvailability_availabilityProfileId_fkey" FOREIGN KEY ("availabilityProfileId") REFERENCES "ExpertAvailabilityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAvailabilityOverride" ADD CONSTRAINT "ExpertAvailabilityOverride_availabilityProfileId_fkey" FOREIGN KEY ("availabilityProfileId") REFERENCES "ExpertAvailabilityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
