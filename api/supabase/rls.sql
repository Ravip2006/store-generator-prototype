-- Row Level Security (RLS) policies based on a per-request session variable.
-- Your API must set it each request/transaction:
--   SELECT set_config('app.store_id', '<store-id>', true);
-- Then RLS enforces: only rows for that store.
--
-- Run this in Supabase SQL Editor after creating tables.

-- Helper: current store id for this session
CREATE OR REPLACE FUNCTION public.current_store_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.store_id', true);
$$;

-- CatalogProduct (shared catalog)
ALTER TABLE "CatalogProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogProduct" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalogproduct_select ON "CatalogProduct";
DROP POLICY IF EXISTS catalogproduct_insert ON "CatalogProduct";
DROP POLICY IF EXISTS catalogproduct_update ON "CatalogProduct";
DROP POLICY IF EXISTS catalogproduct_delete ON "CatalogProduct";
CREATE POLICY catalogproduct_select ON "CatalogProduct"
  FOR SELECT
  USING (
    "isGlobal" = true
    OR "ownerStoreId" = public.current_store_id()
  );

-- Only allow store-owned (non-global) products to be modified by that store
CREATE POLICY catalogproduct_insert ON "CatalogProduct"
  FOR INSERT
  WITH CHECK (
    "isGlobal" = false
    AND "ownerStoreId" = public.current_store_id()
  );

CREATE POLICY catalogproduct_update ON "CatalogProduct"
  FOR UPDATE
  USING (
    "isGlobal" = false
    AND "ownerStoreId" = public.current_store_id()
  )
  WITH CHECK (
    "isGlobal" = false
    AND "ownerStoreId" = public.current_store_id()
  );

CREATE POLICY catalogproduct_delete ON "CatalogProduct"
  FOR DELETE
  USING (
    "isGlobal" = false
    AND "ownerStoreId" = public.current_store_id()
  );

-- StoreProductOverride (per-store overrides for shared products)
ALTER TABLE "StoreProductOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoreProductOverride" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS storeproductoverride_select ON "StoreProductOverride";
DROP POLICY IF EXISTS storeproductoverride_insert ON "StoreProductOverride";
DROP POLICY IF EXISTS storeproductoverride_update ON "StoreProductOverride";
DROP POLICY IF EXISTS storeproductoverride_delete ON "StoreProductOverride";
CREATE POLICY storeproductoverride_select ON "StoreProductOverride"
  FOR SELECT
  USING ("storeId" = public.current_store_id());
CREATE POLICY storeproductoverride_insert ON "StoreProductOverride"
  FOR INSERT
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY storeproductoverride_update ON "StoreProductOverride"
  FOR UPDATE
  USING ("storeId" = public.current_store_id())
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY storeproductoverride_delete ON "StoreProductOverride"
  FOR DELETE
  USING ("storeId" = public.current_store_id());

-- Category
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS category_tenant_select ON "Category";
DROP POLICY IF EXISTS category_tenant_insert ON "Category";
DROP POLICY IF EXISTS category_tenant_update ON "Category";
DROP POLICY IF EXISTS category_tenant_delete ON "Category";
CREATE POLICY category_tenant_select ON "Category"
  FOR SELECT
  USING ("storeId" = public.current_store_id());
CREATE POLICY category_tenant_insert ON "Category"
  FOR INSERT
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY category_tenant_update ON "Category"
  FOR UPDATE
  USING ("storeId" = public.current_store_id())
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY category_tenant_delete ON "Category"
  FOR DELETE
  USING ("storeId" = public.current_store_id());

-- Customer
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenant_select ON "Customer";
DROP POLICY IF EXISTS customer_tenant_insert ON "Customer";
DROP POLICY IF EXISTS customer_tenant_update ON "Customer";
DROP POLICY IF EXISTS customer_tenant_delete ON "Customer";
CREATE POLICY customer_tenant_select ON "Customer"
  FOR SELECT
  USING ("storeId" = public.current_store_id());
CREATE POLICY customer_tenant_insert ON "Customer"
  FOR INSERT
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY customer_tenant_update ON "Customer"
  FOR UPDATE
  USING ("storeId" = public.current_store_id())
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY customer_tenant_delete ON "Customer"
  FOR DELETE
  USING ("storeId" = public.current_store_id());

-- Order
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_tenant_select ON "Order";
DROP POLICY IF EXISTS order_tenant_insert ON "Order";
DROP POLICY IF EXISTS order_tenant_update ON "Order";
DROP POLICY IF EXISTS order_tenant_delete ON "Order";
CREATE POLICY order_tenant_select ON "Order"
  FOR SELECT
  USING ("storeId" = public.current_store_id());
CREATE POLICY order_tenant_insert ON "Order"
  FOR INSERT
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY order_tenant_update ON "Order"
  FOR UPDATE
  USING ("storeId" = public.current_store_id())
  WITH CHECK ("storeId" = public.current_store_id());
CREATE POLICY order_tenant_delete ON "Order"
  FOR DELETE
  USING ("storeId" = public.current_store_id());

-- OrderItem (no storeId column; infer tenant via its Order)
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orderitem_tenant_select ON "OrderItem";
DROP POLICY IF EXISTS orderitem_tenant_insert ON "OrderItem";
DROP POLICY IF EXISTS orderitem_tenant_update ON "OrderItem";
DROP POLICY IF EXISTS orderitem_tenant_delete ON "OrderItem";
CREATE POLICY orderitem_tenant_select ON "OrderItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND o."storeId" = public.current_store_id()
    )
  );
CREATE POLICY orderitem_tenant_insert ON "OrderItem"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND o."storeId" = public.current_store_id()
    )
  );
CREATE POLICY orderitem_tenant_update ON "OrderItem"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND o."storeId" = public.current_store_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND o."storeId" = public.current_store_id()
    )
  );
CREATE POLICY orderitem_tenant_delete ON "OrderItem"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND o."storeId" = public.current_store_id()
    )
  );
