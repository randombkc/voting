/*
  Warnings:

  - You are about to drop the column `token` on the `OtpToken` table. All the data in the column will be lost.
  - Added the required column `name` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `OtpToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `OtpToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otpHash` to the `OtpToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OtpToken_token_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OtpToken" DROP COLUMN "token",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "otpHash" TEXT NOT NULL,
ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'VOTER_VERIFICATION',
ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "votingSessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoterSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "VoterSession_tokenHash_key" ON "VoterSession"("tokenHash");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "OtpToken"("email");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterSession" ADD CONSTRAINT "VoterSession_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterSession" ADD CONSTRAINT "VoterSession_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "VotingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
