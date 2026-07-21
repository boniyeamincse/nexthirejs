-- CreateEnum
CREATE TYPE "ProfessionalLinkType" AS ENUM ('LINKEDIN', 'GITHUB', 'PORTFOLIO', 'PERSONAL_WEBSITE', 'BEHANCE', 'DRIBBBLE', 'STACK_OVERFLOW', 'MEDIUM', 'YOUTUBE', 'OTHER');

-- CreateTable
CREATE TABLE "CandidateAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "issuer" VARCHAR(200),
    "achievedAt" DATE,
    "description" TEXT,
    "referenceUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfessionalLink" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ProfessionalLinkType" NOT NULL,
    "label" VARCHAR(100),
    "url" VARCHAR(500) NOT NULL,
    "normalizedUrl" VARCHAR(500) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfessionalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateAchievement_userId_sortOrder_idx" ON "CandidateAchievement"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateAchievement_userId_achievedAt_idx" ON "CandidateAchievement"("userId", "achievedAt");

-- CreateIndex
CREATE INDEX "CandidateProfessionalLink_userId_sortOrder_idx" ON "CandidateProfessionalLink"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfessionalLink_userId_normalizedUrl_key" ON "CandidateProfessionalLink"("userId", "normalizedUrl");

-- AddForeignKey
ALTER TABLE "CandidateAchievement" ADD CONSTRAINT "CandidateAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfessionalLink" ADD CONSTRAINT "CandidateProfessionalLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
