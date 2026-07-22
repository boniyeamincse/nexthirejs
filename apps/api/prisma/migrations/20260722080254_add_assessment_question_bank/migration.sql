-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT');

-- CreateEnum
CREATE TYPE "AssessmentQuestionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "type" "AssessmentQuestionType" NOT NULL,
    "status" "AssessmentQuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "acceptedAnswers" TEXT[],
    "tags" TEXT[],
    "sourceReference" VARCHAR(300),
    "estimatedSeconds" INTEGER,
    "createdById" UUID,
    "updatedById" UUID,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestionOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentQuestion_categoryId_status_idx" ON "AssessmentQuestion"("categoryId", "status");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_type_difficulty_status_idx" ON "AssessmentQuestion"("type", "difficulty", "status");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_createdAt_idx" ON "AssessmentQuestion"("createdAt");

-- CreateIndex
CREATE INDEX "AssessmentQuestionOption_questionId_idx" ON "AssessmentQuestionOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionOption_questionId_sortOrder_key" ON "AssessmentQuestionOption"("questionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionOption" ADD CONSTRAINT "AssessmentQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
