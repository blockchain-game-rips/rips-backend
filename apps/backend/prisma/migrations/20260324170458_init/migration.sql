-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evm_wallets" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "kms_key_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "evm_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_payouts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rip_id" INTEGER NOT NULL,
    "preset_id" INTEGER NOT NULL,
    "entry_number" INTEGER NOT NULL,
    "payout_amount" BIGINT NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_address_key" ON "evm_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_user_id_key" ON "evm_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entry_payouts_rip_id_entry_number_key" ON "entry_payouts"("rip_id", "entry_number");

-- AddForeignKey
ALTER TABLE "evm_wallets" ADD CONSTRAINT "evm_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_payouts" ADD CONSTRAINT "entry_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
