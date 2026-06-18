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
CREATE TABLE "ticket_prizes" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "round_id" INTEGER NOT NULL,
    "stake_id" INTEGER NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "prize_amount" BIGINT NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_address_key" ON "evm_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "evm_wallets_user_id_key" ON "evm_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_prizes_round_id_ticket_number_key" ON "ticket_prizes"("round_id", "ticket_number");

-- AddForeignKey
ALTER TABLE "evm_wallets" ADD CONSTRAINT "evm_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_prizes" ADD CONSTRAINT "ticket_prizes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
