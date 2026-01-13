-- Add discount fields to StoreProductOverride
-- Using simple ADD COLUMN (no NOT NULL constraint to avoid requiring a default or backfill)

ALTER TABLE "StoreProductOverride" ADD COLUMN "discountPercent" DOUBLE PRECISION DEFAULT NULL;

ALTER TABLE "StoreProductOverride" ADD COLUMN "discountPrice" DOUBLE PRECISION DEFAULT NULL;
