-- Card draws become a pure function of chain data, so payouts settled under
-- the old non-deterministic scheme cannot be reproduced and are discarded.
-- There is no production data yet; the contract is redeployed alongside this.
DELETE FROM "entry_payouts";
DELETE FROM "synced_rips";

-- Card ids come from the seed rather than a sequence, so that the order the
-- seed runs in cannot influence a draw.
ALTER TABLE "card_definitions" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "card_definitions_id_seq";

-- Settlement key: the block and log index of the rip's RandomnessFulfilled.
ALTER TABLE "synced_rips" ADD COLUMN "settle_block_number" BIGINT;
ALTER TABLE "synced_rips" ADD COLUMN "settle_log_index" INTEGER;
-- Which cards existed and which tier biases applied when this rip settled.
ALTER TABLE "synced_rips" ADD COLUMN "draw_rules_fingerprint" TEXT;

CREATE INDEX "synced_rips_settle_block_number_settle_log_index_idx"
    ON "synced_rips" ("settle_block_number", "settle_log_index");

-- A payout only exists for a rip the worker has settled, so the row it belongs
-- to is the one carrying that rip's settlement key.
ALTER TABLE "entry_payouts" ADD CONSTRAINT "entry_payouts_rip_id_fkey"
    FOREIGN KEY ("rip_id") REFERENCES "synced_rips"("rip_id") ON DELETE CASCADE ON UPDATE CASCADE;
