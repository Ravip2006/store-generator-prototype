-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "Product_storeId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "ownerStoreId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
,                                                              CONSTRAINT "CatalogProduct_ownerStoreId_fkey" FOREIGN KEY ("ownerStoreId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE                                    );

-- CreateTable
CREATE TABLE "StoreProductOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT,
    "nameOverride" TEXT,
    "priceOverride" REAL,
    "imageUrlOverride" TEXT,
    "isActiveOverride" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
,                                                              CONSTRAINT "StoreProductOverride_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,                                           CONSTRAINT "StoreProductOverride_productId_fkey" FOREIGN
KEY ("productId") REFERENCES "CatalogProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,                              CONSTRAINT "StoreProductOverride_categoryId_fkey" FOREI
GN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE                               );

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
,                                                              CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("order
Id") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,                                                      CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("pro
ductId") REFERENCES "CatalogProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE                                      );
INSERT INTO "new_OrderItem" ("createdAt", "id", "orderId", 
"productId", "quantity", "unitPrice") SELECT "createdAt", "id", "orderId", "productId", "quantity", "unitPrice" FROM "OrderItem";                                                DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderI
d");                                                       CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("prod
uctId");                                                   PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CatalogProduct_isGlobal_idx" ON "CatalogProdu
ct"("isGlobal");                                           
-- CreateIndex
CREATE INDEX "CatalogProduct_ownerStoreId_idx" ON "CatalogP
roduct"("ownerStoreId");                                   
-- CreateIndex
CREATE INDEX "StoreProductOverride_storeId_idx" ON "StorePr
oductOverride"("storeId");                                 
-- CreateIndex
CREATE INDEX "StoreProductOverride_productId_idx" ON "Store
ProductOverride"("productId");                             
-- CreateIndex
CREATE INDEX "StoreProductOverride_categoryId_idx" ON "Stor
eProductOverride"("categoryId");                           
-- CreateIndex
CREATE UNIQUE INDEX "StoreProductOverride_storeId_productId
_key" ON "StoreProductOverride"("storeId", "productId");   
