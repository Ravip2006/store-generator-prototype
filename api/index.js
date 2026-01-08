const express = require('express');
const cors = require('cors');
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// --- Simple prototype data (replace with DB later)
const stores = {
  "green-mart": { name: "Green Mart", phone: "919999999999", themeColor: "#0A7C2F" },
  "sydney-spice": { name: "Sydney Spice", phone: "61400111222", themeColor: "#1E3A8A" }
};

const products = {
  "green-mart": [
    { id: 1, name: "Basmati Rice 5kg", price: 32.0 },
    { id: 2, name: "Toor Dal 2kg", price: 18.5 }
  ],
  "sydney-spice": [
    { id: 1, name: "Garam Masala 200g", price: 6.5 },
    { id: 2, name: "Aashirvaad Atta 10kg", price: 24.0 }
  ]
};

// --- Tenant resolver: reads x-tenant-id header
app.use((req, res, next) => {
  req.tenant = req.headers['x-tenant-id'];
  next();
});

// Health check
app.get('/', (req, res) => res.send('API is running'));

// Get store info
app.get('/store', async (req, res) => {
  try {
    const tenant = String(req.tenant || '').trim();
    if (!tenant) return res.status(400).json({ error: 'Missing x-tenant-id' });

    const storeFromDb = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { name: true, phone: true, themeColor: true },
    });

    if (storeFromDb) return res.json(storeFromDb);

    const storeFromMemory = stores[tenant];
    if (!storeFromMemory) return res.status(404).json({ error: 'Store not found' });
    return res.json(storeFromMemory);
  } catch (e) {
    console.error('GET /store failed:', e);
    return res.status(500).json({ error: 'Failed to load store', details: e?.message || String(e) });
  }
});

// Get products
app.get('/products', async (req, res) => {
  try {
    const tenant = String(req.tenant || '').trim();
    if (!tenant) return res.status(400).json({ error: 'Missing x-tenant-id' });

    const store = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { id: true },
    });

    if (store) {
      const productsFromDb = await prisma.product.findMany({
        where: { storeId: store.id },
        select: { id: true, name: true, price: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(productsFromDb);
    }

    return res.json(products[tenant] || []);
  } catch (e) {
    console.error('GET /products failed:', e);
    return res.status(500).json({ error: 'Failed to load products', details: e?.message || String(e) });
  }
});

// Add product for tenant
app.post('/products', async (req, res) => {
  try {
    const tenant = String(req.tenant || '').trim();
    if (!tenant) return res.status(400).json({ error: 'Missing x-tenant-id' });

    const { name, price, imageUrl } = req.body || {};

    const cleanName = String(name || '').trim();
    const numericPrice = typeof price === 'number' ? price : Number(price);
    const cleanImageUrl = imageUrl == null ? null : String(imageUrl).trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }

    const store = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({ error: `Store not found for tenant: ${tenant}` });
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: cleanName,
        price: numericPrice,
        imageUrl: cleanImageUrl || null,
      },
      select: { id: true, name: true, price: true, imageUrl: true, storeId: true },
    });

    return res.status(201).json(product);
  } catch (e) {
    console.error('POST /products failed:', e);
    return res.status(500).json({ error: 'Failed to add product', details: e?.message || String(e) });
  }
});

app.post("/stores", async (req, res) => {
  try {
    const { slug, name, phone, themeColor } = req.body || {};

    if (!slug || !name || !phone) {
      return res.status(400).json({ error: "slug, name, phone are required" });
    }

    const cleanSlug = String(slug).trim().toLowerCase();

    const store = await prisma.store.upsert({
      where: { slug: cleanSlug },
      update: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        themeColor: String(themeColor || "#0A7C2F").trim(),
      },
      create: {
        slug: cleanSlug,
        name: String(name).trim(),
        phone: String(phone).trim(),
        themeColor: String(themeColor || "#0A7C2F").trim(),
      },
    });

    return res.status(200).json(store);
  } catch (e) {
    console.error("POST /stores failed:", e);

    // Prisma known error handling
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "Unique constraint violation", meta: e.meta });
    }

    return res.status(500).json({
      error: "Failed to create/update store",
      details: e?.message || String(e),
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
