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

-- CreateIndex
CREATE UNIQUE INDEX "user_eligibility_user_id_key" ON "user_eligibility"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_policies_singleton_key" ON "eligibility_policies"("singleton");

-- AddForeignKey
ALTER TABLE "user_eligibility" ADD CONSTRAINT "user_eligibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The policy singleton starts blocking nobody, with an empty terms document
-- pending the first admin upload. Nothing enforces that an empty file and
-- version 1 travel together, so test "terms_file" for emptiness rather than
-- inferring it from "terms_version".
INSERT INTO "eligibility_policies" ("singleton", "blocked_countries", "terms_version", "terms_file", "updated_at")
VALUES ('eligibility', '{}', 1, '\x', CURRENT_TIMESTAMP);

-- Existing users are swept, not grandfathered: no "user_eligibility" rows are
-- backfilled, so absence keeps recording "we never looked".
