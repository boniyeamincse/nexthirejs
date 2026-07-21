-- CreateTable
CREATE TABLE "CandidateProfileShareToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfileShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfileShareToken_userId_key" ON "CandidateProfileShareToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfileShareToken_tokenHash_key" ON "CandidateProfileShareToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CandidateProfileShareToken_enabled_idx" ON "CandidateProfileShareToken"("enabled");

-- AddForeignKey
ALTER TABLE "CandidateProfileShareToken" ADD CONSTRAINT "CandidateProfileShareToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
