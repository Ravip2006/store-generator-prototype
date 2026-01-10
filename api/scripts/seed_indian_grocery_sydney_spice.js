// Seed Indian grocery products for the sydney-spice store with store-specific price overrides
// and some store-specific stock overrides (to test override-stock behavior).
// Uses DATABASE_URL (admin/owner). Safe to re-run.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv/config");

const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adminDbUrl = process.env.DATABASE_URL;
if (!adminDbUrl) throw new Error("Set DATABASE_URL to your Supabase owner/service_role connection string");

const prismaAdmin = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: adminDbUrl,
      ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
    })
  ),
});

async function ensureMasterCategories(masterCategories) {
  for (const c of masterCategories) {
    await prismaAdmin.masterCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
  }

  const rows = await prismaAdmin.masterCategory.findMany({
    where: { slug: { in: masterCategories.map((c) => c.slug) } },
    select: { id: true, slug: true, name: true },
  });

  return new Map(rows.map((r) => [r.slug, r]));
}

async function ensureStoreCategories(storeId, masterBySlug) {
  const storeCategories = [];
  let sortOrder = 10;

  for (const [, master] of masterBySlug.entries()) {
    const category = await prismaAdmin.category.upsert({
      where: {
        storeId_masterCategoryId: {
          storeId,
          masterCategoryId: master.id,
        },
      },
      update: {
        name: master.name,
        isActive: true,
      },
      create: {
        storeId,
        masterCategoryId: master.id,
        name: master.name,
        sortOrder,
        isActive: true,
      },
      select: { id: true, masterCategoryId: true },
    });

    storeCategories.push(category);
    sortOrder += 10;
  }

  return new Map(storeCategories.map((c) => [c.masterCategoryId, c.id]));
}

async function upsertCatalogProductByName(data) {
  const existing = await prismaAdmin.catalogProduct.findFirst({
    where: {
      name: data.name,
      isGlobal: true,
      ownerStoreId: null,
    },
    select: { id: true },
  });

  if (existing) {
    return prismaAdmin.catalogProduct.update({
      where: { id: existing.id },
      data: {
        basePrice: data.basePrice,
        masterCategoryId: data.masterCategoryId ?? null,
        stock: data.stock,
        imageUrl: data.imageUrl ?? null,
        isActive: true,
        isGlobal: true,
        ownerStoreId: null,
      },
      select: { id: true, name: true },
    });
  }

  return prismaAdmin.catalogProduct.create({
    data: {
      name: data.name,
      basePrice: data.basePrice,
      masterCategoryId: data.masterCategoryId ?? null,
      stock: data.stock,
      imageUrl: data.imageUrl ?? null,
      isActive: true,
      isGlobal: true,
      ownerStoreId: null,
    },
    select: { id: true, name: true },
  });
}

async function main() {
  // Ensure store exists
  const store = await prismaAdmin.store.upsert({
    where: { slug: "sydney-spice" },
    update: { name: "Sydney Spice", phone: "61400111222", themeColor: "#1E3A8A" },
    create: { slug: "sydney-spice", name: "Sydney Spice", phone: "61400111222", themeColor: "#1E3A8A" },
    select: { id: true, slug: true },
  });

  const masterCategories = [
    { slug: "atta-flours", name: "Atta & Flours" },
    { slug: "rice-grains", name: "Rice & Grains" },
    { slug: "dals-pulses", name: "Dals & Pulses" },
    { slug: "spices-masalas", name: "Spices & Masalas" },
    { slug: "oils-ghee", name: "Oils & Ghee" },
    { slug: "snacks", name: "Snacks" },
    { slug: "beverages", name: "Beverages" },
  ];

  const masterBySlug = await ensureMasterCategories(masterCategories);
  const storeCategoryIdByMasterId = await ensureStoreCategories(store.id, masterBySlug);

  // Sydney store assortment: focus on spices, atta, beverages, and a few staples.
  // Some items get priceOverride and stock override.
  const assortment = [
    // Spices & masalas (store-specific stock overrides here)
    { name: "Garam Masala 200g", basePrice: 6.5, stock: 40, categorySlug: "spices-masalas", priceOverride: 7.2, stockOverride: 12 },
    { name: "Turmeric Powder 200g", basePrice: 2.5, stock: 60, categorySlug: "spices-masalas", priceOverride: 2.8, stockOverride: 25 },
    { name: "Red Chilli Powder 200g", basePrice: 2.9, stock: 55, categorySlug: "spices-masalas", priceOverride: 3.3, stockOverride: 18 },

    // Atta & flours (override stock null => base stock path)
    { name: "Whole Wheat Atta 10kg", basePrice: 24.0, stock: 20, categorySlug: "atta-flours", priceOverride: 25.5, stockOverride: null },
    { name: "Besan (Gram Flour) 1kg", basePrice: 4.2, stock: 25, categorySlug: "atta-flours", priceOverride: 4.6, stockOverride: null },

    // Beverages
    { name: "Masala Chai Tea 500g", basePrice: 6.2, stock: 25, categorySlug: "beverages", priceOverride: 6.9, stockOverride: 10 },
    { name: "Instant Coffee 200g", basePrice: 5.9, stock: 20, categorySlug: "beverages", priceOverride: 6.6, stockOverride: null },

    // Staples
    { name: "Basmati Rice 5kg", basePrice: 32.0, stock: 40, categorySlug: "rice-grains", priceOverride: 34.5, stockOverride: null },
    { name: "Toor Dal 2kg", basePrice: 18.5, stock: 30, categorySlug: "dals-pulses", priceOverride: 19.9, stockOverride: 6 },

    // One deliberately unavailable item for testing
    { name: "Desi Ghee 1L", basePrice: 12.5, stock: 15, categorySlug: "oils-ghee", priceOverride: 13.9, stockOverride: 0, isActiveOverride: false },
  ];

  let upserted = 0;
  for (const item of assortment) {
    const master = masterBySlug.get(item.categorySlug);
    if (!master) throw new Error(`Missing master category for slug: ${item.categorySlug}`);

    const storeCategoryId = storeCategoryIdByMasterId.get(master.id);
    if (!storeCategoryId) throw new Error(`Missing store category id for masterCategoryId: ${master.id}`);

    const catalogProduct = await upsertCatalogProductByName({
      name: item.name,
      basePrice: item.basePrice,
      masterCategoryId: master.id,
      stock: item.stock,
      imageUrl: item.imageUrl,
    });

    // If stockOverride is a number, set override stock; if null/undefined, set override stock to null
    // so base stock is used.
    const overrideStock = typeof item.stockOverride === "number" ? item.stockOverride : null;

    await prismaAdmin.storeProductOverride.upsert({
      where: { storeId_productId: { storeId: store.id, productId: catalogProduct.id } },
      update: {
        categoryId: storeCategoryId,
        priceOverride: typeof item.priceOverride === "number" ? item.priceOverride : null,
        stock: overrideStock,
        isActiveOverride: item.isActiveOverride === false ? false : true,
      },
      create: {
        storeId: store.id,
        productId: catalogProduct.id,
        categoryId: storeCategoryId,
        priceOverride: typeof item.priceOverride === "number" ? item.priceOverride : null,
        stock: overrideStock,
        isActiveOverride: item.isActiveOverride === false ? false : true,
      },
      select: { id: true },
    });

    upserted += 1;
  }

  console.log(`Seeded ${upserted} products for store: ${store.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAdmin.$disconnect();
  });
