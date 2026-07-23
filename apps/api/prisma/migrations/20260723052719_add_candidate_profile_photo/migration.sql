-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "photoMimeType" VARCHAR(50),
ADD COLUMN     "photoSizeBytes" INTEGER,
ADD COLUMN     "photoStorageKey" VARCHAR(255),
ADD COLUMN     "photoUpdatedAt" TIMESTAMP(3);
