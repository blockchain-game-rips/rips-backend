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

-- The policy singleton is not seeded here: the row carries a terms document,
-- and an initial-setup step supplies that document as an input. Seeding from
-- DDL could only write a placeholder, and a schema built by "db push" would
-- skip the seed anyway.

-- Existing users are swept, not grandfathered: no "user_eligibility" rows are
-- backfilled, so absence keeps recording "we never looked".
