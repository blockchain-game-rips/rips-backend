/*
  Warnings:

  - You are about to drop the column `stake_id` on the `ticket_prizes` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ticket_prizes` table. All the data in the column will be lost.
  - Added the required column `card_definition_id` to the `ticket_prizes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_address` to the `ticket_prizes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLAIMED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "ticket_prizes" DROP CONSTRAINT "ticket_prizes_user_id_fkey";

-- AlterTable
ALTER TABLE "ticket_prizes" DROP COLUMN "stake_id",
DROP COLUMN "user_id",
ADD COLUMN     "card_definition_id" BIGINT NOT NULL,
ADD COLUMN     "user_address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referrer_address" TEXT;

-- CreateTable
CREATE TABLE "executors" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_wallets" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "kms_key_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executor_id" BIGINT NOT NULL,

    CONSTRAINT "executor_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_definitions" (
    "id" BIGSERIAL NOT NULL,
    "stake_id" INTEGER NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cards" (
    "id" BIGSERIAL NOT NULL,
    "user_address" TEXT NOT NULL,
    "card_definition_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "first_obtained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "round_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_rounds" (
    "round_id" INTEGER NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_rounds_pkey" PRIMARY KEY ("round_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "executor_wallets_address_key" ON "executor_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "executor_wallets_executor_id_key" ON "executor_wallets"("executor_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_definitions_stake_id_tier_name_key" ON "card_definitions"("stake_id", "tier", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_user_address_card_definition_id_key" ON "user_cards"("user_address", "card_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_round_id_type_key" ON "notifications"("user_id", "round_id", "type");

-- AddForeignKey
ALTER TABLE "executor_wallets" ADD CONSTRAINT "executor_wallets_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "executors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_definition_id_fkey" FOREIGN KEY ("card_definition_id") REFERENCES "card_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_prizes" ADD CONSTRAINT "ticket_prizes_card_definition_id_fkey" FOREIGN KEY ("card_definition_id") REFERENCES "card_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
