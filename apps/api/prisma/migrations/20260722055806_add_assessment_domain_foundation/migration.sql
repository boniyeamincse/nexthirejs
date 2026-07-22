-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AssessmentVisibility" AS ENUM ('CANDIDATE_CATALOG', 'INVITE_ONLY', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AssessmentDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK');

-- CreateEnum
CREATE TYPE "AssessmentAvailability" AS ENUM ('AVAILABLE', 'COMING_SOON', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "shortDescription" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "type" "AssessmentType" NOT NULL,
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "AssessmentVisibility" NOT NULL DEFAULT 'CANDIDATE_CATALOG',
    "availability" "AssessmentAvailability" NOT NULL DEFAULT 'COMING_SOON',
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCategory_slug_key" ON "AssessmentCategory"("slug");

-- CreateIndex
CREATE INDEX "AssessmentCategory_isActive_sortOrder_idx" ON "AssessmentCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");

-- CreateIndex
CREATE INDEX "Assessment_status_visibility_availability_idx" ON "Assessment"("status", "visibility", "availability");

-- CreateIndex
CREATE INDEX "Assessment_categoryId_status_idx" ON "Assessment"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Assessment_difficulty_type_idx" ON "Assessment"("difficulty", "type");

-- CreateIndex
CREATE INDEX "Assessment_publishedAt_idx" ON "Assessment"("publishedAt");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
