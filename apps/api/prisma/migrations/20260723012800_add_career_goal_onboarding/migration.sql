-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PROFILE_SETUP';

-- AlterTable
ALTER TABLE "CandidatePreference" ADD COLUMN     "careerGoalId" UUID,
ALTER COLUMN "currentCity" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CareerGoal" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerGoal_code_key" ON "CareerGoal"("code");

-- CreateIndex
CREATE INDEX "CareerGoal_isActive_sortOrder_idx" ON "CareerGoal"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidatePreference_careerGoalId_idx" ON "CandidatePreference"("careerGoalId");

-- AddForeignKey
ALTER TABLE "CandidatePreference" ADD CONSTRAINT "CandidatePreference_careerGoalId_fkey" FOREIGN KEY ("careerGoalId") REFERENCES "CareerGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
