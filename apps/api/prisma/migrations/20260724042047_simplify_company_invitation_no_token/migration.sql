/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `CompanyInvitation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CompanyInvitation_tokenHash_key";

-- AlterTable
ALTER TABLE "CompanyInvitation" DROP COLUMN "tokenHash";
