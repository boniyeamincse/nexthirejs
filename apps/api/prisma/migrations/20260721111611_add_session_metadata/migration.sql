-- DropIndex
DROP INDEX "UserSession_userId_status_idx";

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "browserName" VARCHAR(100),
ADD COLUMN     "deviceType" VARCHAR(30),
ADD COLUMN     "ipAddress" VARCHAR(64),
ADD COLUMN     "operatingSystem" VARCHAR(100),
ADD COLUMN     "userAgent" VARCHAR(512);

-- CreateIndex
CREATE INDEX "UserSession_userId_status_lastUsedAt_idx" ON "UserSession"("userId", "status", "lastUsedAt");
