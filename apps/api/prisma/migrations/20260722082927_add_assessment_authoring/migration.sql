-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "maximumAttempts" INTEGER,
ADD COLUMN     "passingScorePercentage" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "publicationVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPoints" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AssessmentSection" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestionAssignment" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "points" DECIMAL(8,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentSection_assessmentId_idx" ON "AssessmentSection"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSection_assessmentId_sortOrder_key" ON "AssessmentSection"("assessmentId", "sortOrder");

-- CreateIndex
CREATE INDEX "AssessmentQuestionAssignment_assessmentId_sectionId_idx" ON "AssessmentQuestionAssignment"("assessmentId", "sectionId");

-- CreateIndex
CREATE INDEX "AssessmentQuestionAssignment_questionId_idx" ON "AssessmentQuestionAssignment"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionAssignment_assessmentId_questionId_key" ON "AssessmentQuestionAssignment"("assessmentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionAssignment_sectionId_sortOrder_key" ON "AssessmentQuestionAssignment"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AssessmentSection" ADD CONSTRAINT "AssessmentSection_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionAssignment" ADD CONSTRAINT "AssessmentQuestionAssignment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionAssignment" ADD CONSTRAINT "AssessmentQuestionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AssessmentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionAssignment" ADD CONSTRAINT "AssessmentQuestionAssignment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
