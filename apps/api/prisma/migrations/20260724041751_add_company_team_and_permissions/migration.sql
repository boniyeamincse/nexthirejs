-- CreateEnum
CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'ADMIN', 'RECRUITER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CompanyInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CompanyMemberRole" NOT NULL,
    "invitedByUserId" UUID,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInvitation" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "CompanyMemberRole" NOT NULL,
    "status" "CompanyInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" VARCHAR(64) NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "acceptedByUserId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvitation_tokenHash_key" ON "CompanyInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "CompanyInvitation_companyId_status_idx" ON "CompanyInvitation"("companyId", "status");

-- CreateIndex
CREATE INDEX "CompanyInvitation_email_status_idx" ON "CompanyInvitation"("email", "status");

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
