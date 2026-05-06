/*
  Warnings:

  - You are about to drop the column `notified_at` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "notified_at",
ADD COLUMN     "is_notified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "admin_wallets" (
    "id" BIGSERIAL NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'admin',
    "address" TEXT NOT NULL,
    "kms_key_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_wallets_singleton_key" ON "admin_wallets"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "admin_wallets_address_key" ON "admin_wallets"("address");
