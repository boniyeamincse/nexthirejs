-- CreateEnum
CREATE TYPE "ExpertBookingStatus" AS ENUM ('HELD', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ExpertBooking" (
    "id" UUID NOT NULL,
    "expertUserId" UUID NOT NULL,
    "expertServiceId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "status" "ExpertBookingStatus" NOT NULL DEFAULT 'HELD',
    "slotStartUtc" TIMESTAMP(3) NOT NULL,
    "slotEndUtc" TIMESTAMP(3) NOT NULL,
    "holdExpiresAt" TIMESTAMP(3),
    "meetingUrl" VARCHAR(500),
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpertBooking_expertUserId_status_idx" ON "ExpertBooking"("expertUserId", "status");

-- CreateIndex
CREATE INDEX "ExpertBooking_candidateId_status_idx" ON "ExpertBooking"("candidateId", "status");

-- CreateIndex
CREATE INDEX "ExpertBooking_slotStartUtc_idx" ON "ExpertBooking"("slotStartUtc");

-- AddForeignKey
ALTER TABLE "ExpertBooking" ADD CONSTRAINT "ExpertBooking_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertBooking" ADD CONSTRAINT "ExpertBooking_expertServiceId_fkey" FOREIGN KEY ("expertServiceId") REFERENCES "ExpertService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertBooking" ADD CONSTRAINT "ExpertBooking_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique index: the authoritative race guard against double-booking
-- the same expert's slot. Only HELD/CONFIRMED bookings occupy a slot, so
-- CANCELLED/EXPIRED/COMPLETED rows for the same (expertUserId, slotStartUtc)
-- do not block a new booking from being created for that slot.
CREATE UNIQUE INDEX "ExpertBooking_expertUserId_slotStartUtc_active_key"
ON "ExpertBooking" ("expertUserId", "slotStartUtc")
WHERE "status" IN ('HELD', 'CONFIRMED');
