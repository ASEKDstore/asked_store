-- AlterTable
ALTER TABLE "orders" ADD COLUMN "notifyUserStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN "notifyUserError" VARCHAR(1000),
ADD COLUMN "notifyUserTgId" BIGINT;

