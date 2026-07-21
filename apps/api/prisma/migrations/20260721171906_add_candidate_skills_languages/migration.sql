-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'DEVELOPING', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'FLUENT', 'NATIVE');

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "yearsOfExperience" DECIMAL(4,1),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateLanguage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "speaking" "LanguageProficiency" NOT NULL,
    "reading" "LanguageProficiency" NOT NULL,
    "writing" "LanguageProficiency" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateSkill_userId_sortOrder_idx" ON "CandidateSkill"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSkill_userId_normalizedName_key" ON "CandidateSkill"("userId", "normalizedName");

-- CreateIndex
CREATE INDEX "CandidateLanguage_userId_sortOrder_idx" ON "CandidateLanguage"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateLanguage_userId_normalizedName_key" ON "CandidateLanguage"("userId", "normalizedName");

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateLanguage" ADD CONSTRAINT "CandidateLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
