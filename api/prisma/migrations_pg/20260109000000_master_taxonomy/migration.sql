-- CreateTable
CREATE TABLE "MasterCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterCategory_pkey" PRIMARY KEY ("id")
);

-- AddColumns
ALTER TABLE "Category" ADD COLUMN "masterCategoryId" TEXT;
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "MasterCategory_slug_key" ON "MasterCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_storeId_masterCategoryId_key" ON "Category"("storeId", "masterCategoryId");

-- CreateIndex
CREATE INDEX "Category_masterCategoryId_idx" ON "Category"("masterCategoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_masterCategoryId_fkey" FOREIGN KEY ("masterCategoryId") REFERENCES "MasterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
