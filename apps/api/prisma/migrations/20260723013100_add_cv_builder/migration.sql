-- CreateEnum
CREATE TYPE "CvTemplate" AS ENUM ('MODERN', 'CLASSIC', 'MINIMAL', 'ATS_OPTIMIZED');

-- CreateEnum
CREATE TYPE "CvVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateTable
CREATE TABLE "Cv" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "template" "CvTemplate" NOT NULL DEFAULT 'ATS_OPTIMIZED',
    "visibility" "CvVisibility" NOT NULL DEFAULT 'PRIVATE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "completionScore" INTEGER NOT NULL DEFAULT 0,
    "jobPostingId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvSection" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CvSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvVersion" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cv_userId_isDefault_idx" ON "Cv"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "Cv_visibility_idx" ON "Cv"("visibility");

-- CreateIndex
CREATE INDEX "Cv_createdAt_idx" ON "Cv"("createdAt");

-- CreateIndex
CREATE INDEX "CvSection_cvId_sortOrder_idx" ON "CvSection"("cvId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CvSection_cvId_type_key" ON "CvSection"("cvId", "type");

-- CreateIndex
CREATE INDEX "CvVersion_cvId_versionNumber_idx" ON "CvVersion"("cvId", "versionNumber");

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvSection" ADD CONSTRAINT "CvSection_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
