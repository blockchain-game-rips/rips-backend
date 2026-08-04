-- CreateIndex
CREATE INDEX "synced_rips_synced_at_rip_id_desc_idx" ON "synced_rips"("synced_at" DESC, "rip_id" DESC);
