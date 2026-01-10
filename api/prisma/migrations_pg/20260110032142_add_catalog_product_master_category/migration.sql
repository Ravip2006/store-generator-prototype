-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN     "masterCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "CatalogProduct_masterCategoryId_idx" ON "CatalogProduct"("masterCategoryId");

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_masterCategoryId_fkey" FOREIGN KEY ("masterCategoryId") REFERENCES "MasterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
