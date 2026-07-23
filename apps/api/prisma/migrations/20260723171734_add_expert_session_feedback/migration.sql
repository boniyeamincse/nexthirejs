-- CreateTable
CREATE TABLE "ExpertSessionEvaluation" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "expertUserId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "communication" INTEGER NOT NULL,
    "technicalKnowledge" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "problemSolving" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT,
    "improvements" TEXT,
    "nextSteps" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertSessionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertReview" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "expertUserId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "hiddenReason" VARCHAR(300),
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertSessionEvaluation_bookingId_key" ON "ExpertSessionEvaluation"("bookingId");

-- CreateIndex
CREATE INDEX "ExpertSessionEvaluation_expertUserId_idx" ON "ExpertSessionEvaluation"("expertUserId");

-- CreateIndex
CREATE INDEX "ExpertSessionEvaluation_candidateId_idx" ON "ExpertSessionEvaluation"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertReview_bookingId_key" ON "ExpertReview"("bookingId");

-- CreateIndex
CREATE INDEX "ExpertReview_expertUserId_isHidden_idx" ON "ExpertReview"("expertUserId", "isHidden");

-- CreateIndex
CREATE INDEX "ExpertReview_candidateId_idx" ON "ExpertReview"("candidateId");

-- AddForeignKey
ALTER TABLE "ExpertSessionEvaluation" ADD CONSTRAINT "ExpertSessionEvaluation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ExpertBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertSessionEvaluation" ADD CONSTRAINT "ExpertSessionEvaluation_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertSessionEvaluation" ADD CONSTRAINT "ExpertSessionEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ExpertBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
