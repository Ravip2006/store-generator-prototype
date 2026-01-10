// Backfill CatalogProduct.masterCategoryId based on existing store category assignments.
// Uses DATABASE_URL (admin/owner). Safe to re-run.

// Local dev TLS workaround for Supabase pooler cert chains.
if (process.env.PG_TLS_INSECURE === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

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

async function main() {
  // Find one category assignment per product where:
  // - product.masterCategoryId is currently null
  // - override.category.masterCategoryId is not null
  const candidates = await prismaAdmin.storeProductOverride.findMany({
    where: {
      product: { masterCategoryId: null },
      category: { masterCategoryId: { not: null } },
    },
    select: {
      productId: true,
      category: { select: { masterCategoryId: true } },
    },
    distinct: ["productId"],
  });

  let updated = 0;
  for (const c of candidates) {
    const masterCategoryId = c.category?.masterCategoryId;
    if (!masterCategoryId) continue;

    await prismaAdmin.catalogProduct.update({
      where: { id: c.productId },
      data: { masterCategoryId },
      select: { id: true },
    });

    updated += 1;
  }

  console.log(`Backfilled masterCategoryId for ${updated} products.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaAdmin.$disconnect();
  });
