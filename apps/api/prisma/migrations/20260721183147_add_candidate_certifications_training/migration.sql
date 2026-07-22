-- CreateTable
CREATE TABLE "CandidateCertification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "issuer" VARCHAR(200) NOT NULL,
    "issueDate" DATE NOT NULL,
    "expiryDate" DATE,
    "doesNotExpire" BOOLEAN NOT NULL DEFAULT false,
    "credentialId" VARCHAR(150),
    "credentialUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTraining" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "provider" VARCHAR(200) NOT NULL,
    "completionDate" DATE NOT NULL,
    "durationHours" DECIMAL(7,1),
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateTraining_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateCertification_userId_sortOrder_idx" ON "CandidateCertification"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateCertification_userId_issueDate_idx" ON "CandidateCertification"("userId", "issueDate");

-- CreateIndex
CREATE INDEX "CandidateTraining_userId_sortOrder_idx" ON "CandidateTraining"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateTraining_userId_completionDate_idx" ON "CandidateTraining"("userId", "completionDate");

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTraining" ADD CONSTRAINT "CandidateTraining_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
