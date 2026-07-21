-- CreateTable
CREATE TABLE "WorkExperienceRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "jobTitle" VARCHAR(150) NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "location" VARCHAR(150),
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "currentlyWorking" BOOLEAN NOT NULL DEFAULT false,
    "responsibilities" TEXT,
    "achievements" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkExperienceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkExperienceRecord_userId_sortOrder_idx" ON "WorkExperienceRecord"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkExperienceRecord_userId_startDate_idx" ON "WorkExperienceRecord"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "WorkExperienceRecord" ADD CONSTRAINT "WorkExperienceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
