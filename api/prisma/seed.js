require("dotenv/config");

// Local dev workaround: some Node TLS setups (incl. Node v25) can fail to validate
// Supabase/pooler cert chains. Prefer using Node LTS, or configure proper CA.
// If needed for local dev only, set PG_TLS_INSECURE=1.
if (process.env.PG_TLS_INSECURE === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL for seeding. Use an admin/service connection string that can create global catalog rows under RLS."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
    })
  ),
});

async function withStore(storeId, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.store_id', ${storeId}, true);`;
    return fn(tx);
  });
}

const MASTER_TAXONOMY = [
  { slug: "rice-grains", name: "Rice & Grains" },
  { slug: "dals-pulses", name: "Dals & Pulses" },
  { slug: "spices", name: "Spices" },
  { slug: "atta-flour", name: "Atta & Flour" },
  { slug: "snacks", name: "Snacks" },
  { slug: "beverages", name: "Beverages" },
];

async function ensureMasterTaxonomy() {
  for (const item of MASTER_TAXONOMY) {
    await prisma.masterCategory.upsert({
      where: { slug: item.slug },
      update: { name: item.name },
      create: { slug: item.slug, name: item.name },
    });
  }
}

async function ensureStoreCategoriesFromMaster(storeId) {
  const master = await prisma.masterCategory.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true },
  });

  if (!master.length) return;

  await withStore(storeId, async (db) => {
    await db.category.createMany({
      data: master.map((m, i) => ({
        storeId,
        masterCategoryId: m.id,
        name: m.name,
        sortOrder: i * 10,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  });
}

async function getStoreCategoryIdByMasterSlug(storeId, masterSlug) {
  const master = await prisma.masterCategory.findUnique({
    where: { slug: masterSlug },
    select: { id: true },
  });
  if (!master) return null;

  return withStore(storeId, async (db) => {
    const category = await db.category.findFirst({
      where: { storeId, masterCategoryId: master.id },
      select: { id: true },
    });
    return category?.id || null;
  });
}

async function main() {
  await ensureMasterTaxonomy();

  const green = await prisma.store.upsert({
    where: { slug: "green-mart" },
    update: {},
    create: { slug: "green-mart", name: "Green Mart", phone: "919999999999", themeColor: "#0A7C2F" },
  });

  const sydney = await prisma.store.upsert({
    where: { slug: "sydney-spice" },
    update: {},
    create: { slug: "sydney-spice", name: "Sydney Spice", phone: "61400111222", themeColor: "#1E3A8A" },
  });

  await ensureStoreCategoriesFromMaster(green.id);
  await ensureStoreCategoriesFromMaster(sydney.id);

  // Shared catalog products (global)
  const rice = await prisma.catalogProduct.upsert({
    where: { id: "seed_rice" },
    update: {
      name: "Basmati Rice 5kg",
      basePrice: 32.0,
      isGlobal: true,
      isActive: true,
      imageUrl: "https://yiuhqthvxeaeoevtlmxc.supabase.co/storage/v1/object/public/product-images/tenants/green-mart/products/basmati_rice.jpg",
    },
    create: {
      id: "seed_rice",
      name: "Basmati Rice 5kg",
      basePrice: 32.0,
      isGlobal: true,
      imageUrl: "https://yiuhqthvxeaeoevtlmxc.supabase.co/storage/v1/object/public/product-images/tenants/green-mart/products/basmati_rice.jpg",
    },
  });

  const dal = await prisma.catalogProduct.upsert({
    where: { id: "seed_dal" },
    update: { name: "Toor Dal 2kg", basePrice: 18.5, isGlobal: true, isActive: true },
    create: { id: "seed_dal", name: "Toor Dal 2kg", basePrice: 18.5, isGlobal: true },
  });

  const masala = await prisma.catalogProduct.upsert({
    where: { id: "seed_masala" },
    update: { name: "Garam Masala 200g", basePrice: 6.5, isGlobal: true, isActive: true },
    create: { id: "seed_masala", name: "Garam Masala 200g", basePrice: 6.5, isGlobal: true },
  });

  const atta = await prisma.catalogProduct.upsert({
    where: { id: "seed_atta" },
    update: {
      name: "Aashirvaad Atta 10kg",
      basePrice: 24.0,
      isGlobal: true,
      isActive: true,
      imageUrl: "https://yiuhqthvxeaeoevtlmxc.supabase.co/storage/v1/object/public/product-images/tenants/green-mart/products/85464a3c-f3e3-47a8-b29d-15399577634c-ashirwad_10.jpg",
    },
    create: {
      id: "seed_atta",
      name: "Aashirvaad Atta 10kg",
      basePrice: 24.0,
      isGlobal: true,
      imageUrl: "https://yiuhqthvxeaeoevtlmxc.supabase.co/storage/v1/object/public/product-images/tenants/green-mart/products/85464a3c-f3e3-47a8-b29d-15399577634c-ashirwad_10.jpg",
    },
  });

  const greenRiceCatId = await getStoreCategoryIdByMasterSlug(green.id, "rice-grains");
  const greenDalCatId = await getStoreCategoryIdByMasterSlug(green.id, "dals-pulses");
  const greenMasalaCatId = await getStoreCategoryIdByMasterSlug(green.id, "spices");
  const greenAttaCatId = await getStoreCategoryIdByMasterSlug(green.id, "atta-flour");

  const sydneyRiceCatId = await getStoreCategoryIdByMasterSlug(sydney.id, "rice-grains");
  const sydneyDalCatId = await getStoreCategoryIdByMasterSlug(sydney.id, "dals-pulses");
  const sydneyMasalaCatId = await getStoreCategoryIdByMasterSlug(sydney.id, "spices");
  const sydneyAttaCatId = await getStoreCategoryIdByMasterSlug(sydney.id, "atta-flour");

  // Per-store overrides: keep prior behavior (each store sees its own subset)
  await withStore(green.id, async (db) => {
    await db.storeProductOverride.deleteMany({ where: { storeId: green.id } });
    await db.storeProductOverride.createMany({
      data: [
        { storeId: green.id, productId: rice.id, isActiveOverride: true, categoryId: greenRiceCatId },
        { storeId: green.id, productId: dal.id, isActiveOverride: true, categoryId: greenDalCatId },
        { storeId: green.id, productId: masala.id, isActiveOverride: false, categoryId: greenMasalaCatId },
        { storeId: green.id, productId: atta.id, isActiveOverride: false, categoryId: greenAttaCatId },
      ],
    });
  });

  await withStore(sydney.id, async (db) => {
    await db.storeProductOverride.deleteMany({ where: { storeId: sydney.id } });
    await db.storeProductOverride.createMany({
      data: [
        { storeId: sydney.id, productId: rice.id, isActiveOverride: false, categoryId: sydneyRiceCatId },
        { storeId: sydney.id, productId: dal.id, isActiveOverride: false, categoryId: sydneyDalCatId },
        { storeId: sydney.id, productId: masala.id, isActiveOverride: true, categoryId: sydneyMasalaCatId },
        { storeId: sydney.id, productId: atta.id, isActiveOverride: true, categoryId: sydneyAttaCatId },
      ],
    });
  });

  console.log("✅ Seeded stores + shared catalog + overrides");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
