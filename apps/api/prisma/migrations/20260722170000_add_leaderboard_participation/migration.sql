-- AlterTable
ALTER TABLE "CandidateProfilePrivacy"
ADD COLUMN "leaderboardParticipationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "leaderboardDisplayName" VARCHAR(80),
ADD COLUMN "leaderboardEnabledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CandidateProfilePrivacy_leaderboardParticipationEnabled_idx" ON "CandidateProfilePrivacy"("leaderboardParticipationEnabled");

-- Add leaderboard activity indexes for report/ranking queries
CREATE INDEX "AssessmentAttempt_candidateId_submittedAt_idx" ON "AssessmentAttempt"("candidateId", "submittedAt");
CREATE INDEX "AssessmentAttempt_resultStatus_submittedAt_idx" ON "AssessmentAttempt"("resultStatus", "submittedAt");
CREATE INDEX "AssessmentAttempt_assessmentId_status_scorePercentage_idx" ON "AssessmentAttempt"("assessmentId", "status", "scorePercentage");
