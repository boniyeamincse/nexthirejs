-- CreateEnum
CREATE TYPE "TalentPipelineStage" AS ENUM ('SHORTLISTED', 'CONTACTED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "TalentShortlist" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentShortlistMember" (
    "id" UUID NOT NULL,
    "shortlistId" UUID NOT NULL,
    "candidateUserId" UUID NOT NULL,
    "stage" "TalentPipelineStage" NOT NULL DEFAULT 'SHORTLISTED',
    "notes" TEXT,
    "tags" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedByUserId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentShortlistMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentShortlist_companyId_idx" ON "TalentShortlist"("companyId");

-- CreateIndex
CREATE INDEX "TalentShortlistMember_shortlistId_stage_sortOrder_idx" ON "TalentShortlistMember"("shortlistId", "stage", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TalentShortlistMember_shortlistId_candidateUserId_key" ON "TalentShortlistMember"("shortlistId", "candidateUserId");

-- AddForeignKey
ALTER TABLE "TalentShortlist" ADD CONSTRAINT "TalentShortlist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentShortlistMember" ADD CONSTRAINT "TalentShortlistMember_shortlistId_fkey" FOREIGN KEY ("shortlistId") REFERENCES "TalentShortlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentShortlistMember" ADD CONSTRAINT "TalentShortlistMember_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
