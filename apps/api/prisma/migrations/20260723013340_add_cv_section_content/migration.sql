-- CreateTable
CREATE TABLE "CvSectionContent" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "sectionType" VARCHAR(50) NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvSectionContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CvSectionContent_cvId_idx" ON "CvSectionContent"("cvId");

-- CreateIndex
CREATE UNIQUE INDEX "CvSectionContent_cvId_sectionType_key" ON "CvSectionContent"("cvId", "sectionType");

-- AddForeignKey
ALTER TABLE "CvSectionContent" ADD CONSTRAINT "CvSectionContent_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
