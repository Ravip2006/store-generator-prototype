const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
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

  await prisma.product.deleteMany({ where: { storeId: green.id } });
  await prisma.product.deleteMany({ where: { storeId: sydney.id } });

  await prisma.product.createMany({
    data: [
      { storeId: green.id, name: "Basmati Rice 5kg", price: 32.0 },
      { storeId: green.id, name: "Toor Dal 2kg", price: 18.5 },
      { storeId: sydney.id, name: "Garam Masala 200g", price: 6.5 },
      { storeId: sydney.id, name: "Aashirvaad Atta 10kg", price: 24.0 },
    ],
  });

  console.log("✅ Seeded stores + products");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
