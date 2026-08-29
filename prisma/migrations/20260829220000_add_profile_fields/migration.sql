-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "contactUpdatedAt" TIMESTAMP(3);