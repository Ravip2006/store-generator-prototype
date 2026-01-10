-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#0A7C2F',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "ownerStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProductOverride" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT,
    "nameOverride" TEXT,
    "priceOverride" DOUBLE PRECISION,
    "imageUrlOverride" TEXT,
    "isActiveOverride" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProductOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "deliverySlot" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE INDEX "Category_storeId_idx" ON "Category"("storeId");

-- CreateIndex
CREATE INDEX "Customer_storeId_idx" ON "Customer"("storeId");

-- CreateIndex
CREATE INDEX "CatalogProduct_isGlobal_idx" ON "CatalogProduct"("isGlobal");

-- CreateIndex
CREATE INDEX "CatalogProduct_ownerStoreId_idx" ON "CatalogProduct"("ownerStoreId");

-- CreateIndex
CREATE INDEX "StoreProductOverride_storeId_idx" ON "StoreProductOverride"("storeId");

-- CreateIndex
CREATE INDEX "StoreProductOverride_productId_idx" ON "StoreProductOverride"("productId");

-- CreateIndex
CREATE INDEX "StoreProductOverride_categoryId_idx" ON "StoreProductOverride"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProductOverride_storeId_productId_key" ON "StoreProductOverride"("storeId", "productId");

-- CreateIndex
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_ownerStoreId_fkey" FOREIGN KEY ("ownerStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductOverride" ADD CONSTRAINT "StoreProductOverride_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductOverride" ADD CONSTRAINT "StoreProductOverride_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductOverride" ADD CONSTRAINT "StoreProductOverride_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
