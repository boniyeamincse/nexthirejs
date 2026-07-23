-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'RESTRICTED');

-- CreateTable
CREATE TABLE "CareerPassport" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" VARCHAR(200),
    "summary" TEXT,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "profileUrl" VARCHAR(500),
    "lastPublishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportSection" (
    "id" UUID NOT NULL,
    "passportId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassportSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportView" (
    "id" UUID NOT NULL,
    "passportId" UUID NOT NULL,
    "viewedBy" UUID,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,

    CONSTRAINT "PassportView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerPassport_userId_key" ON "CareerPassport"("userId");

-- CreateIndex
CREATE INDEX "CareerPassport_status_idx" ON "CareerPassport"("status");

-- CreateIndex
CREATE INDEX "CareerPassport_publicProfile_idx" ON "CareerPassport"("publicProfile");

-- CreateIndex
CREATE INDEX "CareerPassport_userId_updatedAt_idx" ON "CareerPassport"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "PassportSection_passportId_sortOrder_idx" ON "PassportSection"("passportId", "sortOrder");

-- CreateIndex
CREATE INDEX "PassportSection_type_idx" ON "PassportSection"("type");

-- CreateIndex
CREATE INDEX "PassportView_passportId_viewedAt_idx" ON "PassportView"("passportId", "viewedAt");

-- CreateIndex
CREATE INDEX "PassportView_viewedBy_idx" ON "PassportView"("viewedBy");

-- AddForeignKey
ALTER TABLE "CareerPassport" ADD CONSTRAINT "CareerPassport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportSection" ADD CONSTRAINT "PassportSection_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "CareerPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportView" ADD CONSTRAINT "PassportView_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "CareerPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
