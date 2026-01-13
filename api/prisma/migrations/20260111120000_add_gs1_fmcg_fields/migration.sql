-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN "gtin" TEXT,
ADD COLUMN "brand" TEXT,
ADD COLUMN "gs1SKU" TEXT,
ADD COLUMN "isBrandedFMCG" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_gtin_key" ON "CatalogProduct"("gtin");

-- CreateIndex
CREATE INDEX "CatalogProduct_brand_idx" ON "CatalogProduct"("brand");

-- CreateIndex
CREATE INDEX "CatalogProduct_isBrandedFMCG_idx" ON "CatalogProduct"("isBrandedFMCG");
