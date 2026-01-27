/*
  Warnings:

  - A unique constraint covering the columns `[tripId,studentId]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BUS_APPROACHING', 'STUDENT_BOARDED', 'STUDENT_DROPPED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'ALERT');

-- AlterTable
ALTER TABLE "buses" ADD COLUMN     "lastMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "model" TEXT,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "licenseExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "routeId" TEXT;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "distanceCovered" DOUBLE PRECISION,
ADD COLUMN     "routeId" TEXT;

-- CreateTable
CREATE TABLE "bus_location_history" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bus_location_history_tripId_timestamp_idx" ON "bus_location_history"("tripId", "timestamp");

-- CreateIndex
CREATE INDEX "attendance_tripId_idx" ON "attendance"("tripId");

-- CreateIndex
CREATE INDEX "attendance_studentId_idx" ON "attendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_tripId_studentId_key" ON "attendance"("tripId", "studentId");

-- CreateIndex
CREATE INDEX "buses_driverId_idx" ON "buses"("driverId");

-- CreateIndex
CREATE INDEX "buses_busNumber_idx" ON "buses"("busNumber");

-- CreateIndex
CREATE INDEX "buses_status_idx" ON "buses"("status");

-- CreateIndex
CREATE INDEX "drivers_userId_idx" ON "drivers"("userId");

-- CreateIndex
CREATE INDEX "drivers_licenseNumber_idx" ON "drivers"("licenseNumber");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "routes_busId_idx" ON "routes"("busId");

-- CreateIndex
CREATE INDEX "students_parentId_idx" ON "students"("parentId");

-- CreateIndex
CREATE INDEX "students_busId_idx" ON "students"("busId");

-- CreateIndex
CREATE INDEX "students_routeId_idx" ON "students"("routeId");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "trips_busId_idx" ON "trips"("busId");

-- CreateIndex
CREATE INDEX "trips_driverId_idx" ON "trips"("driverId");

-- CreateIndex
CREATE INDEX "trips_routeId_idx" ON "trips"("routeId");

-- CreateIndex
CREATE INDEX "trips_startTime_idx" ON "trips"("startTime");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_location_history" ADD CONSTRAINT "bus_location_history_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
