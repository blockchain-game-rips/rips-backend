-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLAIMED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "referrer_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_eligibility" (
    "id" BIGSERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "terms_version" INTEGER NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "user_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_policies" (
    "id" BIGSERIAL NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'eligibility',
    "blocked_countries" TEXT[],
    "terms_version" INTEGER NOT NULL,
    "terms_file" BYTEA NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eligibility_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evm_wallets" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "encrypted_private_key" BYTEA NOT NULL,
    "kek_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "evm_wallets_pkey" PRIMARY KEY ("id")
);

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
    "encrypted_private_key" BYTEA NOT NULL,
    "kek_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executor_id" BIGINT NOT NULL,

    CONSTRAINT "executor_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_definitions" (
    "id" BIGINT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rip_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_rips" (
    "rip_id" INTEGER NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settle_block_number" BIGINT,
    "settle_log_index" INTEGER,
    "draw_rules_fingerprint" TEXT,

    CONSTRAINT "synced_rips_pkey" PRIMARY KEY ("rip_id")
);

-- CreateTable
CREATE TABLE "admin_wallets" (
    "id" BIGSERIAL NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'admin',
    "address" TEXT NOT NULL,
    "encrypted_private_key" BYTEA NOT NULL,
    "kek_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_payouts" (
    "id" BIGSERIAL NOT NULL,
    "user_address" TEXT NOT NULL,
    "rip_id" INTEGER NOT NULL,
    "entry_number" INTEGER NOT NULL,
    "payout_amount" BIGINT NOT NULL,
    "card_definition_id" BIGINT NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_eligibility_user_id_key" ON "user_eligibility"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_policies_singleton_key" ON "eligibility_policies"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_address_key" ON "evm_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_user_id_key" ON "evm_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "executor_wallets_address_key" ON "executor_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "executor_wallets_executor_id_key" ON "executor_wallets"("executor_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_definitions_tier_name_key" ON "card_definitions"("tier", "name");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_rip_id_type_key" ON "notifications"("user_id", "rip_id", "type");

-- CreateIndex
CREATE INDEX "synced_rips_synced_at_rip_id_desc_idx" ON "synced_rips"("synced_at" DESC, "rip_id" DESC);

-- CreateIndex
CREATE INDEX "synced_rips_settle_block_number_settle_log_index_idx" ON "synced_rips"("settle_block_number", "settle_log_index");

-- CreateIndex
CREATE UNIQUE INDEX "admin_wallets_singleton_key" ON "admin_wallets"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "admin_wallets_address_key" ON "admin_wallets"("address");

-- CreateIndex
CREATE INDEX "entry_payouts_user_address_revealed_idx" ON "entry_payouts"("user_address", "revealed");

-- CreateIndex
CREATE UNIQUE INDEX "entry_payouts_rip_id_entry_number_key" ON "entry_payouts"("rip_id", "entry_number");

-- AddForeignKey
ALTER TABLE "user_eligibility" ADD CONSTRAINT "user_eligibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evm_wallets" ADD CONSTRAINT "evm_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_wallets" ADD CONSTRAINT "executor_wallets_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "executors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_payouts" ADD CONSTRAINT "entry_payouts_card_definition_id_fkey" FOREIGN KEY ("card_definition_id") REFERENCES "card_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_payouts" ADD CONSTRAINT "entry_payouts_rip_id_fkey" FOREIGN KEY ("rip_id") REFERENCES "synced_rips"("rip_id") ON DELETE CASCADE ON UPDATE CASCADE;
