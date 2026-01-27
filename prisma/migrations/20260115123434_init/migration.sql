/*
  Warnings:

  - You are about to drop the column `dropoffAddress` on the `passengers` table. All the data in the column will be lost.
  - You are about to drop the column `dropoffLat` on the `passengers` table. All the data in the column will be lost.
  - You are about to drop the column `dropoffLng` on the `passengers` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `passengers` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLat` on the `passengers` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLng` on the `passengers` table. All the data in the column will be lost.
  - Added the required column `address` to the `passengers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `passengers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `passengers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "passengers" DROP COLUMN "dropoffAddress",
DROP COLUMN "dropoffLat",
DROP COLUMN "dropoffLng",
DROP COLUMN "pickupAddress",
DROP COLUMN "pickupLat",
DROP COLUMN "pickupLng",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "scheduleId" TEXT;

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "boardingTime" TEXT NOT NULL,
    "operatingDays" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_routeId_idx" ON "schedules"("routeId");

-- CreateIndex
CREATE INDEX "schedules_busId_idx" ON "schedules"("busId");

-- CreateIndex
CREATE INDEX "schedules_driverId_idx" ON "schedules"("driverId");

-- CreateIndex
CREATE INDEX "schedules_organizationId_idx" ON "schedules"("organizationId");

-- CreateIndex
CREATE INDEX "schedules_isActive_idx" ON "schedules"("isActive");

-- CreateIndex
CREATE INDEX "schedules_organizationId_isActive_idx" ON "schedules"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "trips_scheduleId_idx" ON "trips"("scheduleId");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
