// Seed master categories and a test store using the admin Prisma client
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// Seed master categories and a test store using the admin Prisma client
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const adminDbUrl = process.env.DATABASE_URL;
if (!adminDbUrl) throw new Error('Set DATABASE_URL to your Supabase service_role or owner connection string');

const prismaAdmin = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: adminDbUrl,
      ssl: process.env.PG_TLS_INSECURE === '1' ? { rejectUnauthorized: false } : undefined,
    })
  ),
});

async function main() {
  // Seed master categories
  const masterCategories = [
    { slug: 'grains', name: 'Grains' },
    { slug: 'spices', name: 'Spices' },
    { slug: 'flours', name: 'Flours' },
    { slug: 'lentils', name: 'Lentils' },
  ];
  for (const cat of masterCategories) {
    await prismaAdmin.masterCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
  }
  console.log('Seeded master categories');

  // Seed a test store
  const store = await prismaAdmin.store.upsert({
    where: { slug: 'green-mart' },
    update: { name: 'Green Mart', phone: '919999999999', themeColor: '#0A7C2F' },
    create: { slug: 'green-mart', name: 'Green Mart', phone: '919999999999', themeColor: '#0A7C2F' },
  });
  console.log('Seeded store:', store.slug);

  await prismaAdmin.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
