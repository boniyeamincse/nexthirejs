-- AlterTable
ALTER TABLE "ExpertProfile"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicSlug" VARCHAR(160);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_publicSlug_key" ON "ExpertProfile"("publicSlug");

-- CreateIndex
CREATE INDEX "ExpertProfile_isPublic_idx" ON "ExpertProfile"("isPublic");
