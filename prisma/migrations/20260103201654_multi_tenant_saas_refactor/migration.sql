/*
  Warnings:

  - The values [ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `studentId` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `bus_location_history` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `bus_location_history` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tripId,passengerId]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licensePlate]` on the table `buses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passengerId` to the `attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licensePlate` to the `buses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `buses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `trips` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL', 'CHURCH', 'COMPANY', 'CAMP', 'UNIVERSITY', 'HOTEL', 'TRANSPORTATION_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('BUS_APPROACHING', 'STUDENT_BOARDED', 'STUDENT_DROPPED', 'STUDENT_ABSENT', 'TRIP_STARTED', 'TRIP_COMPLETED', 'ROUTE_DELAYED', 'EMERGENCY_ALERT');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_busId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_parentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_routeId_fkey";

-- DropIndex
DROP INDEX "attendance_studentId_idx";

-- DropIndex
DROP INDEX "attendance_tripId_studentId_key";

-- DropIndex
DROP INDEX "notifications_userId_read_idx";

-- DropIndex
DROP INDEX "trips_startTime_idx";

-- AlterTable
ALTER TABLE "attendance" DROP COLUMN "studentId",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "passengerId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "bus_location_history" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "heading" DOUBLE PRECISION,
ADD COLUMN     "speed" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "buses" ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "licensePlate" TEXT NOT NULL,
ADD COLUMN     "maintenanceNotes" TEXT,
ADD COLUMN     "nextMaintenanceDue" TIMESTAMP(3),
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "registrationExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "read",
DROP COLUMN "updatedAt",
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "operatingDays" JSONB,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "routeType" TEXT,
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "actualEnd" TIMESTAMP(3),
ADD COLUMN     "actualStart" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "scheduledStart" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- DropTable
DROP TABLE "students";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'OTHER',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "maxBuses" INTEGER NOT NULL DEFAULT 5,
    "maxStudents" INTEGER NOT NULL DEFAULT 100,
    "maxDrivers" INTEGER NOT NULL DEFAULT 10,
    "maxAdmins" INTEGER NOT NULL DEFAULT 2,
    "hasSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "hasAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "hasWhiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "hasApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "rollNumber" TEXT,
    "employeeId" TEXT,
    "department" TEXT,
    "age" INTEGER,
    "guardianId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "busId" TEXT,
    "routeId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "qrCode" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "medicalNotes" TEXT,
    "allergies" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "organizationId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "invoiceNumber" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_isActive_idx" ON "organizations"("isActive");

-- CreateIndex
CREATE INDEX "organizations_subscriptionStatus_idx" ON "organizations"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_qrCode_key" ON "passengers"("qrCode");

-- CreateIndex
CREATE INDEX "passengers_guardianId_idx" ON "passengers"("guardianId");

-- CreateIndex
CREATE INDEX "passengers_organizationId_idx" ON "passengers"("organizationId");

-- CreateIndex
CREATE INDEX "passengers_busId_idx" ON "passengers"("busId");

-- CreateIndex
CREATE INDEX "passengers_routeId_idx" ON "passengers"("routeId");

-- CreateIndex
CREATE INDEX "passengers_qrCode_idx" ON "passengers"("qrCode");

-- CreateIndex
CREATE INDEX "passengers_rollNumber_idx" ON "passengers"("rollNumber");

-- CreateIndex
CREATE INDEX "passengers_employeeId_idx" ON "passengers"("employeeId");

-- CreateIndex
CREATE INDEX "passengers_organizationId_isActive_idx" ON "passengers"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_timestamp_idx" ON "audit_logs"("organizationId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_organizationId_idx" ON "invoices"("organizationId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "attendance_passengerId_idx" ON "attendance"("passengerId");

-- CreateIndex
CREATE INDEX "attendance_boardedAt_idx" ON "attendance"("boardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_tripId_passengerId_key" ON "attendance"("tripId", "passengerId");

-- CreateIndex
CREATE INDEX "bus_location_history_timestamp_idx" ON "bus_location_history"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "buses_licensePlate_key" ON "buses"("licensePlate");

-- CreateIndex
CREATE INDEX "buses_organizationId_idx" ON "buses"("organizationId");

-- CreateIndex
CREATE INDEX "buses_licensePlate_idx" ON "buses"("licensePlate");

-- CreateIndex
CREATE INDEX "buses_organizationId_status_idx" ON "buses"("organizationId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "routes_organizationId_idx" ON "routes"("organizationId");

-- CreateIndex
CREATE INDEX "routes_isActive_idx" ON "routes"("isActive");

-- CreateIndex
CREATE INDEX "routes_organizationId_isActive_idx" ON "routes"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "trips_organizationId_idx" ON "trips"("organizationId");

-- CreateIndex
CREATE INDEX "trips_scheduledStart_idx" ON "trips"("scheduledStart");

-- CreateIndex
CREATE INDEX "trips_actualStart_idx" ON "trips"("actualStart");

-- CreateIndex
CREATE INDEX "trips_organizationId_status_idx" ON "trips"("organizationId", "status");

-- CreateIndex
CREATE INDEX "trips_organizationId_scheduledStart_idx" ON "trips"("organizationId", "scheduledStart");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_organizationId_role_idx" ON "users"("organizationId", "role");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "passengers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
