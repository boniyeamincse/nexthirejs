-- CreateEnum
CREATE TYPE "AssessmentAttemptStatus" AS ENUM ('IN_PROGRESS', 'EXPIRED', 'SUBMITTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "assessmentPublicationVersion" INTEGER NOT NULL,
    "assessmentTitleSnapshot" VARCHAR(200) NOT NULL,
    "assessmentSlugSnapshot" VARCHAR(220) NOT NULL,
    "instructionsSnapshot" TEXT,
    "durationMinutesSnapshot" INTEGER NOT NULL,
    "passingScoreSnapshot" INTEGER NOT NULL,
    "totalPointsSnapshot" DECIMAL(10,2) NOT NULL,
    "questionCountSnapshot" INTEGER NOT NULL,
    "status" "AssessmentAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttemptSection" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "sourceSectionId" UUID,
    "titleSnapshot" VARCHAR(200) NOT NULL,
    "descriptionSnapshot" TEXT,
    "instructionsSnapshot" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttemptSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttemptQuestion" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "attemptSectionId" UUID NOT NULL,
    "sourceQuestionId" UUID,
    "typeSnapshot" "AssessmentQuestionType" NOT NULL,
    "promptSnapshot" TEXT NOT NULL,
    "explanationSnapshot" TEXT,
    "acceptedAnswersJson" JSONB,
    "pointsSnapshot" DECIMAL(8,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttemptQuestionOption" (
    "id" UUID NOT NULL,
    "attemptQuestionId" UUID NOT NULL,
    "sourceOptionId" UUID,
    "labelSnapshot" TEXT NOT NULL,
    "isCorrectSnapshot" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttemptQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttemptAnswer" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "attemptQuestionId" UUID NOT NULL,
    "selectedOptionIds" TEXT[],
    "shortTextAnswer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_candidateId_status_idx" ON "AssessmentAttempt"("candidateId", "status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_candidateId_idx" ON "AssessmentAttempt"("assessmentId", "candidateId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_deadlineAt_idx" ON "AssessmentAttempt"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "AssessmentAttemptSection_attemptId_idx" ON "AssessmentAttemptSection"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttemptSection_attemptId_sortOrder_key" ON "AssessmentAttemptSection"("attemptId", "sortOrder");

-- CreateIndex
CREATE INDEX "AssessmentAttemptQuestion_attemptId_idx" ON "AssessmentAttemptQuestion"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttemptQuestion_attemptId_sourceQuestionId_key" ON "AssessmentAttemptQuestion"("attemptId", "sourceQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttemptQuestion_attemptSectionId_sortOrder_key" ON "AssessmentAttemptQuestion"("attemptSectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "AssessmentAttemptQuestionOption_attemptQuestionId_idx" ON "AssessmentAttemptQuestionOption"("attemptQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttemptQuestionOption_attemptQuestionId_sortOrder_key" ON "AssessmentAttemptQuestionOption"("attemptQuestionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttemptAnswer_attemptQuestionId_key" ON "AssessmentAttemptAnswer"("attemptQuestionId");

-- CreateIndex
CREATE INDEX "AssessmentAttemptAnswer_attemptId_idx" ON "AssessmentAttemptAnswer"("attemptId");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptSection" ADD CONSTRAINT "AssessmentAttemptSection_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptQuestion" ADD CONSTRAINT "AssessmentAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptQuestion" ADD CONSTRAINT "AssessmentAttemptQuestion_attemptSectionId_fkey" FOREIGN KEY ("attemptSectionId") REFERENCES "AssessmentAttemptSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptQuestionOption" ADD CONSTRAINT "AssessmentAttemptQuestionOption_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "AssessmentAttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptAnswer" ADD CONSTRAINT "AssessmentAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttemptAnswer" ADD CONSTRAINT "AssessmentAttemptAnswer_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "AssessmentAttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
