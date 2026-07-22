-- Active-attempt uniqueness: at most one IN_PROGRESS attempt per candidate+assessment
-- Prisma cannot express partial unique indexes directly; this is added manually.
CREATE UNIQUE INDEX "AssessmentAttempt_candidateId_assessmentId_active_key"
ON "AssessmentAttempt"("candidateId", "assessmentId")
WHERE "status" = 'IN_PROGRESS';