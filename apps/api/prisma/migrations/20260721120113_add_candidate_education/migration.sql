-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SECONDARY', 'HIGHER_SECONDARY', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'PROFESSIONAL', 'OTHER');

-- CreateTable
CREATE TABLE "EducationRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "institutionName" VARCHAR(200) NOT NULL,
    "qualification" VARCHAR(150) NOT NULL,
    "fieldOfStudy" VARCHAR(150),
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "currentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "grade" VARCHAR(100),
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EducationRecord_userId_sortOrder_idx" ON "EducationRecord"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "EducationRecord_userId_startDate_idx" ON "EducationRecord"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "EducationRecord" ADD CONSTRAINT "EducationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
