-- CreateEnum
CREATE TYPE "CandidateDiscoverability" AS ENUM ('PRIVATE', 'LINK_ONLY', 'PLATFORM_DISCOVERABLE');

-- CreateEnum
CREATE TYPE "CandidateSectionVisibility" AS ENUM ('HIDDEN', 'PLATFORM_ONLY', 'PUBLIC');

-- CreateTable
CREATE TABLE "CandidateProfilePrivacy" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "overallDiscoverability" "CandidateDiscoverability" NOT NULL DEFAULT 'PRIVATE',
    "basicProfile" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "locationAndPreferences" "CandidateSectionVisibility" NOT NULL DEFAULT 'HIDDEN',
    "education" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "workExperience" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "skillsAndLanguages" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "certificationsAndTraining" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "achievementsAndLinks" "CandidateSectionVisibility" NOT NULL DEFAULT 'PLATFORM_ONLY',
    "policyVersion" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfilePrivacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfilePrivacy_userId_key" ON "CandidateProfilePrivacy"("userId");

-- AddForeignKey
ALTER TABLE "CandidateProfilePrivacy" ADD CONSTRAINT "CandidateProfilePrivacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
