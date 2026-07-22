-- CreateEnum
CREATE TYPE "AssessmentAttemptResultStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssessmentAttemptFinalizationReason" AS ENUM ('CANDIDATE_SUBMITTED', 'DEADLINE_REACHED', 'ADMIN_FINALIZED');

-- AlterTable
ALTER TABLE "AssessmentAttempt"
ADD COLUMN "correctCount" INTEGER,
ADD COLUMN "finalizationReason" "AssessmentAttemptFinalizationReason",
ADD COLUMN "incorrectCount" INTEGER,
ADD COLUMN "resultStatus" "AssessmentAttemptResultStatus",
ADD COLUMN "scoreEarned" DECIMAL(10,2),
ADD COLUMN "scorePercentage" DECIMAL(5,2),
ADD COLUMN "scorePossible" DECIMAL(10,2),
ADD COLUMN "scoringCompletedAt" TIMESTAMP(3),
ADD COLUMN "scoringVersion" INTEGER,
ADD COLUMN "unansweredCount" INTEGER;

-- AlterTable
ALTER TABLE "AssessmentAttemptAnswer"
ADD COLUMN "awardedPoints" DECIMAL(8,2),
ADD COLUMN "isCorrect" BOOLEAN,
ADD COLUMN "scoredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_scoringCompletedAt_idx" ON "AssessmentAttempt"("status", "scoringCompletedAt");

-- Add checks for finalized scoring data consistency.
ALTER TABLE "AssessmentAttempt"
ADD CONSTRAINT "AssessmentAttempt_score_bounds_check"
CHECK (
  "scoreEarned" IS NULL
  OR (
    "scorePossible" IS NOT NULL
    AND "scoreEarned" >= 0
    AND "scorePossible" >= 0
    AND "scoreEarned" <= "scorePossible"
  )
);

ALTER TABLE "AssessmentAttempt"
ADD CONSTRAINT "AssessmentAttempt_score_percentage_bounds_check"
CHECK (
  "scorePercentage" IS NULL
  OR ("scorePercentage" >= 0 AND "scorePercentage" <= 100)
);

ALTER TABLE "AssessmentAttempt"
ADD CONSTRAINT "AssessmentAttempt_scoring_version_positive_check"
CHECK ("scoringVersion" IS NULL OR "scoringVersion" > 0);

ALTER TABLE "AssessmentAttempt"
ADD CONSTRAINT "AssessmentAttempt_counts_consistency_check"
CHECK (
  "correctCount" IS NULL
  OR "incorrectCount" IS NULL
  OR "unansweredCount" IS NULL
  OR ("correctCount" + "incorrectCount" + "unansweredCount") = "questionCountSnapshot"
);
