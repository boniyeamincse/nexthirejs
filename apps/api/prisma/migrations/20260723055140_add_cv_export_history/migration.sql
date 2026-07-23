-- CreateEnum
CREATE TYPE "CvExportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "CvExport" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CvExportStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" VARCHAR(255),
    "checksumSha256" VARCHAR(64),
    "fileSizeBytes" INTEGER,
    "failureCategory" VARCHAR(100),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "CvExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CvExport_cvId_requestedAt_idx" ON "CvExport"("cvId", "requestedAt");

-- CreateIndex
CREATE INDEX "CvExport_userId_requestedAt_idx" ON "CvExport"("userId", "requestedAt");

-- AddForeignKey
ALTER TABLE "CvExport" ADD CONSTRAINT "CvExport_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
