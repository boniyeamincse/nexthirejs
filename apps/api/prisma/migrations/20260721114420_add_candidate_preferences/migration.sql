/*
  Warnings:

  - You are about to drop the column `city` on the `CandidateProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- AlterTable
ALTER TABLE "CandidateProfile" DROP COLUMN "city";

-- CreateTable
CREATE TABLE "Country" (
    "id" UUID NOT NULL,
    "code" CHAR(2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phoneCode" VARCHAR(10) NOT NULL,
    "defaultCurrency" CHAR(3) NOT NULL,
    "defaultTimezone" VARCHAR(100) NOT NULL,
    "supportedLanguages" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatePreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "countryId" UUID NOT NULL,
    "currentCity" VARCHAR(100) NOT NULL,
    "preferredJobRoles" TEXT[],
    "preferredWorkModes" "WorkMode"[],
    "preferredEmploymentTypes" "EmploymentType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_isActive_sortOrder_idx" ON "Country"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePreference_userId_key" ON "CandidatePreference"("userId");

-- CreateIndex
CREATE INDEX "CandidatePreference_countryId_idx" ON "CandidatePreference"("countryId");

-- AddForeignKey
ALTER TABLE "CandidatePreference" ADD CONSTRAINT "CandidatePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePreference" ADD CONSTRAINT "CandidatePreference_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
