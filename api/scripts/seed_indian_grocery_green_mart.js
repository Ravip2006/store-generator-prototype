// Seed generic Indian grocery products + categories + stock for the green-mart store.
// Uses DATABASE_URL (admin/owner). Safe to re-run (idempotent-ish by product name).

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

  // Sort order spacing so you can insert later.
  let sortOrder = 10;
  for (const [slug, master] of masterBySlug.entries()) {
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
      select: { id: true, masterCategoryId: true, name: true },
    });

    storeCategories.push(category);
    sortOrder += 10;
  }

  // Map masterCategoryId -> storeCategoryId
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
  const store = await prismaAdmin.store.findUnique({
    where: { slug: "green-mart" },
    select: { id: true, slug: true },
  });
  if (!store) throw new Error('Store with slug "green-mart" not found. Run seed_master_and_store.js first.');

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

  const products = [
    // Rice & grains
    { name: "Basmati Rice 5kg", basePrice: 32.0, stock: 40, categorySlug: "rice-grains" },
    { name: "Sona Masoori Rice 5kg", basePrice: 24.0, stock: 35, categorySlug: "rice-grains" },
    { name: "Poha (Flattened Rice) 1kg", basePrice: 3.5, stock: 50, categorySlug: "rice-grains" },

    // Atta & flours
    { name: "Whole Wheat Atta 10kg", basePrice: 24.0, stock: 20, categorySlug: "atta-flours" },
    { name: "Besan (Gram Flour) 1kg", basePrice: 4.2, stock: 25, categorySlug: "atta-flours" },
    { name: "Rava/Sooji 1kg", basePrice: 2.8, stock: 30, categorySlug: "atta-flours" },

    // Dals & pulses
    { name: "Toor Dal 2kg", basePrice: 18.5, stock: 30, categorySlug: "dals-pulses" },
    { name: "Moong Dal 1kg", basePrice: 6.9, stock: 35, categorySlug: "dals-pulses" },
    { name: "Chana Dal 1kg", basePrice: 5.8, stock: 35, categorySlug: "dals-pulses" },
    { name: "Kabuli Chana 1kg", basePrice: 5.5, stock: 30, categorySlug: "dals-pulses" },

    // Spices & masalas
    { name: "Garam Masala 200g", basePrice: 6.5, stock: 40, categorySlug: "spices-masalas" },
    { name: "Turmeric Powder 200g", basePrice: 2.5, stock: 60, categorySlug: "spices-masalas" },
    { name: "Red Chilli Powder 200g", basePrice: 2.9, stock: 55, categorySlug: "spices-masalas" },
    { name: "Cumin Seeds 200g", basePrice: 3.1, stock: 45, categorySlug: "spices-masalas" },

    // Oils & ghee
    { name: "Sunflower Oil 1L", basePrice: 4.9, stock: 25, categorySlug: "oils-ghee" },
    { name: "Mustard Oil 1L", basePrice: 5.5, stock: 20, categorySlug: "oils-ghee" },
    { name: "Desi Ghee 1L", basePrice: 12.5, stock: 15, categorySlug: "oils-ghee" },

    // Snacks
    { name: "Namkeen Mixture 500g", basePrice: 4.0, stock: 40, categorySlug: "snacks" },
    { name: "Masala Peanuts 500g", basePrice: 4.5, stock: 35, categorySlug: "snacks" },

    // Beverages
    { name: "Masala Chai Tea 500g", basePrice: 6.2, stock: 25, categorySlug: "beverages" },
    { name: "Instant Coffee 200g", basePrice: 5.9, stock: 20, categorySlug: "beverages" },
  ];

  let createdOrUpdated = 0;
  for (const p of products) {
    const master = masterBySlug.get(p.categorySlug);
    if (!master) throw new Error(`Missing master category for slug: ${p.categorySlug}`);

    const storeCategoryId = storeCategoryIdByMasterId.get(master.id);
    if (!storeCategoryId) throw new Error(`Missing store category id for masterCategoryId: ${master.id}`);

    const catalogProduct = await upsertCatalogProductByName({
      name: p.name,
      basePrice: p.basePrice,
      masterCategoryId: master.id,
      stock: p.stock,
      imageUrl: p.imageUrl,
    });

    // IMPORTANT: do NOT let override.stock default to 0, or it will override base stock in the order flow.
    await prismaAdmin.storeProductOverride.upsert({
      where: { storeId_productId: { storeId: store.id, productId: catalogProduct.id } },
      update: { categoryId: storeCategoryId, stock: null, isActiveOverride: true },
      create: {
        storeId: store.id,
        productId: catalogProduct.id,
        categoryId: storeCategoryId,
        stock: null,
        isActiveOverride: true,
      },
      select: { id: true },
    });

    createdOrUpdated += 1;
  }

  console.log(`Seeded ${createdOrUpdated} products for store: ${store.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAdmin.$disconnect();
  });
