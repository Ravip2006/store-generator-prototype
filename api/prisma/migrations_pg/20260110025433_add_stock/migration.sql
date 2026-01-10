-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoreProductOverride" ADD COLUMN     "stock" INTEGER DEFAULT 0;
