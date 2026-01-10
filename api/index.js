// Load env vars from api/.env regardless of how the server is started (repo root vs api/).
// You can override with DOTENV_CONFIG_PATH.
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, ".env"),
});

// Local dev workaround: some Node TLS setups can fail to validate Supabase/pooler
// cert chains. Prefer using Node LTS, or configure proper CA.
// If needed for local dev only, set PG_TLS_INSECURE=1.
// NOTE: We intentionally do NOT set NODE_TLS_REJECT_UNAUTHORIZED=0 globally
// (that disables TLS verification for all HTTPS). We scope this only to the
// Postgres client via the Pool's `ssl.rejectUnauthorized=false` option.
if (process.env.PG_TLS_INSECURE === "1") {
  console.warn(
    "[dev] PG_TLS_INSECURE=1: Postgres TLS verification is disabled for local development. Do not use in production."
  );
}

const express = require('express');
const cors = require('cors');
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function callOpenAiForDescription({ apiKey, model, prompt }) {
  if (!apiKey) {
    const err = new Error("AI is not configured (missing OPENAI_API_KEY)");
    err.statusCode = 501;
    throw err;
  }
  if (typeof fetch !== "function") {
    const err = new Error("AI is not available in this Node runtime (missing global fetch)");
    err.statusCode = 500;
    throw err;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You write helpful, accurate, user-friendly grocery product descriptions for an online store. " +
            "Be concise and practical. Avoid medical/health claims. Don't mention being an AI. Output plain text only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI request failed (${res.status})`;
    const err = new Error(msg);
    err.statusCode = 502;
    throw err;
  }

  const text = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    const err = new Error("AI did not return a description");
    err.statusCode = 502;
    throw err;
  }

  // Keep it tidy.
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function withNoVerifyIfInsecure(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (process.env.PG_TLS_INSECURE !== "1") return raw;
  try {
    const u = new URL(raw);
    const mode = (u.searchParams.get("sslmode") || "").toLowerCase();
    if (!mode || mode === "require" || mode === "verify-full" || mode === "verify-ca") {
      u.searchParams.set("sslmode", "no-verify");
    }
    return u.toString();
  } catch {
    // Best-effort string replace (covers most cases)
    return raw.replace(/sslmode=require/gi, "sslmode=no-verify");
  }
}

const runtimeDbUrl = withNoVerifyIfInsecure(process.env.APP_DATABASE_URL);
if (!runtimeDbUrl) {
  throw new Error(
    "Missing APP_DATABASE_URL. Set it to your Supabase Postgres connection string for the restricted app_user so RLS is enforced."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: runtimeDbUrl,
      ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
    })
  ),
});

// Optional admin client (bypasses RLS) for cross-tenant catalog updates.
// Used to update global product fields like CatalogProduct.imageUrl.
const adminDbUrl = withNoVerifyIfInsecure(process.env.DATABASE_URL);
const prismaAdmin = adminDbUrl
  ? new PrismaClient({
      adapter: new PrismaPg(
        new Pool({
          connectionString: adminDbUrl,
          ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
        })
      ),
    })
  : null;

const app = express();
app.use(cors());
app.use(express.json());

function isPgTlsChainError(e) {
  const msg = String(e?.message || "");
  return (
    e?.code === "P1011" &&
    /self-signed certificate in certificate chain/i.test(msg)
  );
}

function respondPgTlsChainError(res, e) {
  return res.status(500).json({
    error: "Database TLS verification failed",
    details: String(e?.message || e || ""),
    hint:
      "For local dev with Supabase pooler, set PG_TLS_INSECURE=1 in api/.env to disable Postgres TLS verification (do NOT use in production). Prefer Node LTS or configuring the correct CA certs.",
  });
}

function isPrismaAuthError(e) {
  const msg = String(e?.message || "");
  return (
    e?.code === "P1000" ||
    /authentication failed/i.test(msg) ||
    /authentication query failed/i.test(msg) ||
    /connection terminated unexpectedly/i.test(msg) ||
    /failed to retrieve database credentials/i.test(msg) ||
    /circuit breaker open/i.test(msg)
  );
}

function respondPrismaAuthError(res, e) {
  return res.status(500).json({
    error: "Database authentication failed",
    details: String(e?.message || e || ""),
    hint:
      "Check api/.env DATABASE_URL and APP_DATABASE_URL after any password rotation (and URL-encode special characters in the password). If you're using Supabase pooler, ensure you're using the correct pooler credentials for each user.",
  });
}

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
      // Prefer admin client for reads if available. This avoids edge cases where
      // session variables / RLS + poolers can cause inconsistent visibility of global rows.
      const readProductsForStore = async (db) => {
        const [catalogProducts, overrides] = await Promise.all([
          db.catalogProduct.findMany({
            where: {
              isActive: true,
              OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
            },
            select: {
              id: true,
              name: true,
              basePrice: true,
              imageUrl: true,
              description: true,
              stock: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          db.storeProductOverride.findMany({
            where: { storeId: store.id },
            select: {
              productId: true,
              categoryId: true,
              nameOverride: true,
              priceOverride: true,
              imageUrlOverride: true,
              stock: true,
              isActiveOverride: true,
              category: { select: { id: true, name: true } },
            },
          }),
        ]);

        const overrideByProductId = new Map(overrides.map((o) => [o.productId, o]));

        return catalogProducts
          .map((p) => {
            const o = overrideByProductId.get(p.id);
            const effectiveIsActive = (o?.isActiveOverride ?? p.isActive) !== false;
            return {
              id: p.id,
              name: o?.nameOverride ?? p.name,
              price: o?.priceOverride ?? p.basePrice,
              imageUrl: o?.imageUrlOverride ?? p.imageUrl,
              description: typeof p.description === 'string' ? p.description : '',
              stock: typeof o?.stock === 'number' ? o.stock : (typeof p.stock === 'number' ? p.stock : null),
              brand: p.brand ?? null,
              packSize: p.packSize ?? null,
              categoryId: o?.categoryId ?? null,
              category: o?.category ?? null,
              isActive: effectiveIsActive,
              createdAt: p.createdAt,
            };
          })
          .filter((p) => p.isActive);
      };

      let productsFromDb;
      if (prismaAdmin) {
        try {
          productsFromDb = await readProductsForStore(prismaAdmin);
        } catch (e) {
          if (isPrismaAuthError(e)) {
            console.warn(
              "[warn] prismaAdmin failed auth; falling back to APP_DATABASE_URL client for GET /products"
            );
            productsFromDb = await withTenantDb(store.id, async (db) => readProductsForStore(db));
          } else {
            throw e;
          }
        }
      } else {
        productsFromDb = await withTenantDb(store.id, async (db) => readProductsForStore(db));
      }

      return res.json(productsFromDb);
    }

    return res.json(products[tenant] || []);
  } catch (e) {
    console.error('GET /products failed:', e);
    if (isPgTlsChainError(e)) return respondPgTlsChainError(res, e);
    if (isPrismaAuthError(e)) return respondPrismaAuthError(res, e);
    return res.status(500).json({ error: 'Failed to load products', details: e?.message || String(e) });
  }
});

// --- Inventory management (admin-friendly)
// Updates stock for a product.
// Body:
//   { stock: number|null, scope?: 'store'|'global' }
// - scope='store' (default): sets StoreProductOverride.stock for this store (null clears override => falls back to global stock)
// - scope='global': sets CatalogProduct.stock (affects all stores)
// --- Inventory management (admin-friendly)
// Updates stock for a product.
// Body:
//   { stock: number|null, scope?: 'store'|'global' }
// - scope='store' (default): sets StoreProductOverride.stock for this store (null clears override => falls back to global stock)
// - scope='global': sets CatalogProduct.stock (affects all stores)
app.patch('/products/:id/stock', async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const productId = String(req.params.id || '').trim();
    if (!productId) return res.status(400).json({ error: 'Missing product id' });

    const scope = String(req.body?.scope || 'store').trim().toLowerCase();
    const rawStock = req.body?.stock;
    const stock = rawStock === null ? null : (typeof rawStock === 'number' ? rawStock : Number(rawStock));

    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative integer or null' });
    }

    // Validate product exists and is visible to this store
    const product = await (prismaAdmin
      ? prismaAdmin.catalogProduct.findFirst({
          where: {
            id: productId,
            isActive: true,
            OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
          },
          select: { id: true, name: true, basePrice: true, imageUrl: true, description: true, stock: true, isActive: true, createdAt: true },
        })
      : withTenantDb(store.id, (db) =>
          db.catalogProduct.findFirst({
            where: {
              id: productId,
              isActive: true,
              OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
            },
            select: { id: true, name: true, basePrice: true, imageUrl: true, description: true, stock: true, isActive: true, createdAt: true },
          })
        ));

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updated = await withTenantDb(store.id, async (db) => {
      if (scope === 'global') {
        if (!prismaAdmin) {
          return res.status(503).json({
            error: 'Global stock update requires DATABASE_URL (admin client) to bypass RLS',
          });
        }

        const p = await prismaAdmin.catalogProduct.update({
          where: { id: productId },
          data: { stock: stock === null ? 0 : stock },
          select: { id: true, name: true, basePrice: true, imageUrl: true, description: true, stock: true, isActive: true, createdAt: true },
        });
        return {
          id: p.id,
          name: p.name,
          price: p.basePrice,
          imageUrl: p.imageUrl,
          description: typeof p.description === 'string' ? p.description : '',
          stock: typeof p.stock === 'number' ? p.stock : null,
          brand: p.brand ?? null,
          packSize: p.packSize ?? null,
          categoryId: null,
          category: null,
          isActive: p.isActive !== false,
          createdAt: p.createdAt,
        };
      }

      // Store scope: set or clear override
      const override = await db.storeProductOverride.upsert({
        where: { storeId_productId: { storeId: store.id, productId } },
        update: { stock },
        create: { storeId: store.id, productId, stock },
        select: { stock: true },
      });

      return {
        id: product.id,
        name: product.name,
        price: product.basePrice,
        imageUrl: product.imageUrl,
        description: typeof product.description === 'string' ? product.description : '',
        stock: typeof override?.stock === 'number' ? override.stock : null,
        brand: product.brand ?? null,
        packSize: product.packSize ?? null,
        categoryId: null,
        category: null,
        isActive: product.isActive !== false,
        createdAt: product.createdAt,
      };
    });

    return res.json(updated);
  } catch (e) {
    console.error('PATCH /products/:id/stock failed:', e);
    if (isPgTlsChainError(e)) return respondPgTlsChainError(res, e);
    if (isPrismaAuthError(e)) return respondPrismaAuthError(res, e);
    return res.status(500).json({ error: 'Failed to update stock', details: e?.message || String(e) });
  }
});
// PATCH /inventory
// Body: { items: [{ productId: string, stock: number }]}  (sets store inventory)
app.patch('/inventory', async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'items is required (non-empty array)' });
    }

    const normalized = items
      .map((it) => ({
        productId: String(it?.productId || '').trim(),
        stock: typeof it?.stock === 'number' ? it.stock : Number(it?.stock),
      }))
      .filter((it) => it.productId);

    if (normalized.length === 0) {
      return res.status(400).json({ error: 'Each item must include productId' });
    }

    for (const it of normalized) {
      if (!Number.isInteger(it.stock) || it.stock < 0) {
        return res.status(400).json({ error: 'Each item stock must be a non-negative integer' });
      }
    }

    const uniqueProductIds = Array.from(new Set(normalized.map((it) => it.productId)));

    const visible = await (prismaAdmin
      ? prismaAdmin.catalogProduct.findMany({
          where: {
            id: { in: uniqueProductIds },
            OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
          },
          select: { id: true },
        })
      : withTenantDb(store.id, (db) =>
          db.catalogProduct.findMany({
            where: {
              id: { in: uniqueProductIds },
              OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
            },
            select: { id: true },
          })
        ));

    const visibleIds = new Set(visible.map((p) => p.id));
    const missing = uniqueProductIds.filter((id) => !visibleIds.has(id));
    if (missing.length) {
      return res.status(400).json({ error: 'Some products not found/visible for this store', missing });
    }

    const upsertMany = async (db) => {
      let updated = 0;
      for (const it of normalized) {
        await db.storeProductOverride.upsert({
          where: { storeId_productId: { storeId: store.id, productId: it.productId } },
          update: { stock: it.stock },
          create: { storeId: store.id, productId: it.productId, stock: it.stock, isActiveOverride: true },
          select: { id: true },
        });
        updated += 1;
      }
      return updated;
    };

    const updatedCount = await (prismaAdmin
      ? prismaAdmin.$transaction((tx) => upsertMany(tx))
      : withTenantDb(store.id, (db) => upsertMany(db)));

    return res.json({ storeId: store.id, updated: updatedCount });
  } catch (e) {
    console.error('PATCH /inventory failed:', e);
    return res.status(500).json({ error: 'Failed to update inventory', details: e?.message || String(e) });
  }
});

// Add product for tenant
app.post('/products', async (req, res) => {
  try {
    const tenant = String(req.tenant || '').trim();
    if (!tenant) return res.status(400).json({ error: 'Missing x-tenant-id' });

    const { name, price, imageUrl, categoryId } = req.body || {};

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

    let cleanCategoryId = categoryId == null ? null : String(categoryId).trim();
    if (cleanCategoryId) {
      const category = await withTenantDb(store.id, (db) =>
        db.category.findFirst({
          where: { id: cleanCategoryId, storeId: store.id },
          select: { id: true },
        })
      );

      if (!category) {
        return res.status(400).json({ error: "Invalid categoryId for this store" });
      }
    } else {
      cleanCategoryId = null;
    }

    const created = await withTenantDb(store.id, async (db) => {
      const product = await db.catalogProduct.create({
        data: {
          name: cleanName,
          basePrice: numericPrice,
          imageUrl: cleanImageUrl || null,
          isGlobal: false,
          ownerStoreId: store.id,
        },
        select: { id: true, name: true, basePrice: true, imageUrl: true },
      });

      let category = null;
      if (cleanCategoryId) {
        const override = await db.storeProductOverride.upsert({
          where: { storeId_productId: { storeId: store.id, productId: product.id } },
          update: { categoryId: cleanCategoryId },
          create: { storeId: store.id, productId: product.id, categoryId: cleanCategoryId },
          select: { category: { select: { id: true, name: true } } },
        });
        category = override.category;
      }

      return {
        id: product.id,
        name: product.name,
        price: product.basePrice,
        imageUrl: product.imageUrl,
        description: product.description,
        categoryId: cleanCategoryId,
        category,
      };
    });

    return res.status(201).json(created);
  } catch (e) {
    console.error('POST /products failed:', e);
    return res.status(500).json({ error: 'Failed to add product', details: e?.message || String(e) });
  }
});

// Update product fields for tenant (categoryId, imageUrl, price)
app.patch("/products/:id", async (req, res) => {
  try {
    const tenant = String(req.tenant || "").trim();
    if (!tenant) return res.status(400).json({ error: "Missing x-tenant-id" });

    const productId = String(req.params.id || "").trim();
    if (!productId) return res.status(400).json({ error: "Missing product id" });

    const store = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { id: true },
    });
    if (!store) {
      return res.status(404).json({ error: `Store not found for tenant: ${tenant}` });
    }

    const { categoryId, imageUrl } = req.body || {};
    const cleanCategoryId = categoryId == null ? null : String(categoryId).trim();
    const cleanImageUrl = imageUrl == null ? null : String(imageUrl).trim();

    const rawPrice = req.body?.price;
    const hasPrice = rawPrice !== undefined;
    const cleanPrice = hasPrice ? (typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)) : null;
    if (hasPrice && (!Number.isFinite(cleanPrice) || cleanPrice < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }

    const updated = await withTenantDb(store.id, async (db) => {
      if (cleanCategoryId) {
        const category = await db.category.findFirst({
          where: { id: cleanCategoryId, storeId: store.id },
          select: { id: true },
        });
        if (!category) {
          const err = new Error("Invalid categoryId for this store");
          err.statusCode = 400;
          throw err;
        }
      }

      const product = await db.catalogProduct.findFirst({
        where: {
          id: productId,
          isActive: true,
          OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
        },
        select: { id: true, name: true, basePrice: true, imageUrl: true, isGlobal: true },
      });
      if (!product) {
        const err = new Error("Product not found");
        err.statusCode = 404;
        throw err;
      }

      // If a product is global (shared across stores), updating imageUrl should update
      // the base catalog imageUrl so all stores see it. This requires bypassing RLS.
      if (cleanImageUrl !== null && product.isGlobal === true && prismaAdmin) {
        const updatedProduct = await prismaAdmin.catalogProduct.update({
          where: { id: productId },
          data: { imageUrl: cleanImageUrl || null },
          select: { id: true, name: true, basePrice: true, imageUrl: true },
        });

        // Category stays tenant-specific via override.
        const override = await db.storeProductOverride.upsert({
          where: { storeId_productId: { storeId: store.id, productId } },
          update: {
            categoryId: cleanCategoryId || null,
            ...(hasPrice ? { priceOverride: cleanPrice } : {}),
          },
          create: {
            storeId: store.id,
            productId,
            categoryId: cleanCategoryId || null,
            ...(hasPrice ? { priceOverride: cleanPrice } : {}),
          },
          select: {
            categoryId: true,
            priceOverride: true,
            category: { select: { id: true, name: true } },
          },
        });

        return {
          id: updatedProduct.id,
          name: updatedProduct.name,
          price: override?.priceOverride ?? updatedProduct.basePrice,
          imageUrl: updatedProduct.imageUrl,
          categoryId: override.categoryId,
          category: override.category,
        };
      }

      const override = await db.storeProductOverride.upsert({
        where: { storeId_productId: { storeId: store.id, productId } },
        update: {
          categoryId: cleanCategoryId || null,
          imageUrlOverride: cleanImageUrl || null,
          ...(hasPrice ? { priceOverride: cleanPrice } : {}),
        },
        create: {
          storeId: store.id,
          productId,
          categoryId: cleanCategoryId || null,
          imageUrlOverride: cleanImageUrl || null,
          ...(hasPrice ? { priceOverride: cleanPrice } : {}),
        },
        select: {
          categoryId: true,
          priceOverride: true,
          category: { select: { id: true, name: true } },
          imageUrlOverride: true,
        },
      });

      return {
        id: product.id,
        name: product.name,
        price: override?.priceOverride ?? product.basePrice,
        imageUrl: override.imageUrlOverride ?? product.imageUrl,
        categoryId: override.categoryId,
        category: override.category,
      };
    }).catch((e) => {
      const statusCode = e?.statusCode;
      if (statusCode === 400 || statusCode === 404) throw e;
      throw e;
    });

    return res.json(updated);
  } catch (e) {
    if (e?.statusCode === 400) {
      return res.status(400).json({ error: e.message });
    }
    if (e?.statusCode === 404) {
      return res.status(404).json({ error: e.message });
    }
    console.error("PATCH /products/:id failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to update product", details: e?.message || String(e) });
  }
});

// Generate (and persist) a better product description using AI.
// POST /products/:id/ai-description
// Body: { force?: boolean }
app.post("/products/:id/ai-description", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const productId = String(req.params.id || "").trim();
    if (!productId) return res.status(400).json({ error: "Missing product id" });

    const force = Boolean(req.body?.force);

    const product = await withTenantDb(store.id, async (db) =>
      db.catalogProduct.findFirst({
        where: {
          id: productId,
          isActive: true,
          OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
        },
        select: {
          id: true,
          name: true,
          basePrice: true,
          description: true,
          isGlobal: true,
        },
      })
    );

    if (!product) return res.status(404).json({ error: "Product not found" });

    const existing = String(product.description || "").trim();
    if (existing && !force) {
      return res.json({ id: product.id, description: existing, generated: false });
    }

    const categoryName = await withTenantDb(store.id, async (db) => {
      const override = await db.storeProductOverride.findFirst({
        where: { storeId: store.id, productId: product.id },
        select: { category: { select: { name: true } } },
      });
      return override?.category?.name || null;
    });

    const promptLines = [];
    promptLines.push(`Product name: ${product.name}`);
    if (product.brand) promptLines.push(`Brand: ${product.brand}`);
    if (product.packSize) promptLines.push(`Pack size: ${product.packSize}`);
    if (categoryName) promptLines.push(`Category: ${categoryName}`);
    if (Number.isFinite(product.basePrice)) promptLines.push(`Price: ₹${product.basePrice}`);
    promptLines.push("");
    promptLines.push(
      "Write a short, friendly, e-commerce description (2 short paragraphs max). Include: what it is, best uses, and simple storage tips."
    );

    const description = await callOpenAiForDescription({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      prompt: promptLines.join("\n"),
    });

    // Persist description.
    if (product.isGlobal === true) {
      if (!prismaAdmin) {
        return res.status(503).json({
          error:
            "AI generated a description, but cannot persist global product description because DATABASE_URL (admin client) is not configured.",
          description,
          generated: true,
        });
      }
      await prismaAdmin.catalogProduct.update({
        where: { id: product.id },
        data: { description },
        select: { id: true },
      });
    } else {
      await withTenantDb(store.id, (db) =>
        db.catalogProduct.update({
          where: { id: product.id },
          data: { description },
          select: { id: true },
        })
      );
    }

    return res.json({ id: product.id, description, generated: true });
  } catch (e) {
    const code = e?.statusCode;
    if (code === 404) return res.status(404).json({ error: e.message });
    if (code === 501) return res.status(501).json({ error: e.message });
    if (code === 502) return res.status(502).json({ error: e.message });
    console.error("POST /products/:id/ai-description failed:", e);
    return res.status(500).json({ error: "Failed to generate description", details: e?.message || String(e) });
  }
});

// Promote a product to global (shared across all stores)
app.post("/products/:id/make-global", async (req, res) => {
  try {
    const tenant = String(req.tenant || "").trim();
    if (!tenant) return res.status(400).json({ error: "Missing x-tenant-id" });

    const productId = String(req.params.id || "").trim();
    if (!productId) return res.status(400).json({ error: "Missing product id" });

    if (!prismaAdmin) {
      return res
        .status(403)
        .json({ error: "Admin DB client not configured", details: "Set DATABASE_URL to enable global catalog updates." });
    }

    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken) {
      const headerToken = String(req.headers["x-admin-token"] || "").trim();
      if (!headerToken || headerToken !== adminToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    // Ensure the product exists and is visible to this tenant (global or owned by tenant).
    const store = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { id: true },
    });
    if (!store) {
      return res.status(404).json({ error: `Store not found for tenant: ${tenant}` });
    }

    const product = await prismaAdmin.catalogProduct.findFirst({
      where: {
        id: productId,
        isActive: true,
        OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
      },
      select: { id: true, isGlobal: true, ownerStoreId: true, masterCategoryId: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Best-effort: if the product doesn't yet have a global category classification,
    // infer it from this store's category assignment (if that category is linked to a master category).
    let inferredMasterCategoryId = null;
    if (!product.masterCategoryId) {
      const inferred = await prismaAdmin.storeProductOverride.findFirst({
        where: { storeId: store.id, productId },
        select: { category: { select: { masterCategoryId: true } } },
      });
      inferredMasterCategoryId = inferred?.category?.masterCategoryId ?? null;
    }

    const updateData = {
      isGlobal: true,
      ownerStoreId: null,
      ...(product.masterCategoryId ? {} : inferredMasterCategoryId ? { masterCategoryId: inferredMasterCategoryId } : {}),
    };

    const updated = await prismaAdmin.catalogProduct.update({
      where: { id: productId },
      data: updateData,
      select: { id: true, isGlobal: true, ownerStoreId: true, masterCategoryId: true, imageUrl: true },
    });

    return res.json(updated);
  } catch (e) {
    console.error("POST /products/:id/make-global failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to promote product", details: e?.message || String(e) });
  }
});

// Enable/disable a product for a specific store (tenant) via override
app.post("/products/:id/set-active", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const productId = String(req.params.id || "").trim();
    if (!productId) return res.status(400).json({ error: "Missing product id" });

    const { isActive } = req.body || {};
    const flag = Boolean(isActive);

    const updated = await withTenantDb(store.id, async (db) => {
      const product = await db.catalogProduct.findFirst({
        where: {
          id: productId,
          OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
        },
        select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
      });

      if (!product) {
        const err = new Error("Product not found");
        err.statusCode = 404;
        throw err;
      }

      const override = await db.storeProductOverride.upsert({
        where: { storeId_productId: { storeId: store.id, productId } },
        update: { isActiveOverride: flag },
        create: { storeId: store.id, productId, isActiveOverride: flag },
        select: { isActiveOverride: true },
      });

      return {
        id: product.id,
        name: product.name,
        price: override?.priceOverride ?? product.basePrice,
        imageUrl: product.imageUrl,
        isActive: (override.isActiveOverride ?? product.isActive) !== false,
      };
    });

    return res.json(updated);
  } catch (e) {
    if (e?.statusCode === 404) return res.status(404).json({ error: e.message });
    console.error("POST /products/:id/set-active failed:", e);
    return res.status(500).json({ error: "Failed to update product active flag", details: e?.message || String(e) });
  }
});

app.post("/stores", async (req, res) => {
  try {
    const { slug, name, phone, themeColor } = req.body || {};

    if (!slug || !name || !phone) {
      return res.status(400).json({ error: "slug, name, phone are required" });
    }

    const cleanSlug = String(slug).trim().toLowerCase();

    // Admin operation: creating/updating stores should bypass RLS.
    // Use prismaAdmin when available; otherwise fall back to prisma (will require RLS policies).
    const store = await (prismaAdmin || prisma).store.upsert({
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

    // Auto-seed store categories from the master taxonomy so every store starts
    // with a consistent baseline, while remaining store-specific.
    if (prismaAdmin) {
      await ensureStoreCategoriesFromMasterAdmin(store.id);

      await bootstrapStoreCatalogAdmin(store.id);
    } else {
      await ensureStoreCategoriesFromMaster(store.id);

      await bootstrapStoreCatalog(store.id);
    }

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
app.get("/stores", async (req, res) => {
  try {
    const readStores = (client) =>
      client.store.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        phone: true,
        themeColor: true,
        createdAt: true,
      },
    });

    let stores;
    if (prismaAdmin) {
      try {
        stores = await readStores(prismaAdmin);
      } catch (e) {
        if (isPrismaAuthError(e)) {
          console.warn(
            "[warn] prismaAdmin failed auth; falling back to APP_DATABASE_URL client for GET /stores"
          );
          stores = await readStores(prisma);
        } else {
          throw e;
        }
      }
    } else {
      stores = await readStores(prisma);
    }

    res.json(stores);
  } catch (e) {
    console.error("GET /stores failed:", e);
    if (isPgTlsChainError(e)) return respondPgTlsChainError(res, e);
    if (isPrismaAuthError(e)) return respondPrismaAuthError(res, e);
    return res.status(500).json({ error: "Failed to load stores", details: e?.message || String(e) });
  }
});

const isPostgres = true;

async function withTenantDb(storeId, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.store_id', ${storeId}, true);`;
    return fn(tx);
  });
}

async function requireTenantStore(req, res) {
  const tenant = String(req.tenant || "").trim();
  if (!tenant) {
    res.status(400).json({ error: "Missing x-tenant-id" });
    return null;
  }

  let store;
  try {
    store = await prisma.store.findUnique({
      where: { slug: tenant },
      select: { id: true, slug: true, name: true },
    });
  } catch (e) {
    console.error("requireTenantStore failed:", e);
    if (isPgTlsChainError(e)) {
      respondPgTlsChainError(res, e);
      return null;
    }
    res.status(500).json({ error: "Failed to load store", details: e?.message || String(e) });
    return null;
  }

  if (!store) {
    res.status(404).json({ error: `Store not found for tenant: ${tenant}` });
    return null;
  }

  return store;
}

async function getMasterCategories() {
  const client = prismaAdmin || prisma;
  return client.masterCategory.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, slug: true, name: true, createdAt: true },
  });
}

async function ensureStoreCategoriesFromMasterAdmin(storeId) {
  if (!prismaAdmin) throw new Error("Admin DB client not configured (missing DATABASE_URL)");
  const master = await getMasterCategories();
  if (!master.length) return { seeded: 0 };

  const result = await prismaAdmin.category.createMany({
    data: master.map((m, i) => ({
      storeId,
      masterCategoryId: m.id,
      name: m.name,
      sortOrder: i * 10,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  return { seeded: result?.count ?? 0 };
}

async function ensureStoreCategoriesFromMaster(storeId) {
  const master = await getMasterCategories();
  if (!master.length) return { seeded: 0 };

  const data = master.map((m, i) => ({
    storeId,
    masterCategoryId: m.id,
    name: m.name,
    sortOrder: i * 10,
    isActive: true,
  }));

  const result = await withTenantDb(storeId, (db) =>
    db.category.createMany({
      data,
      skipDuplicates: true,
    })
  );

  return { seeded: result?.count ?? 0 };
}

async function bootstrapStoreCatalogAdmin(storeId) {
  if (!prismaAdmin) throw new Error("Admin DB client not configured (missing DATABASE_URL)");

  const uncategorized = await ensureUncategorizedCategoryAdmin(storeId);

  const categories = await prismaAdmin.category.findMany({
    where: { storeId },
    select: { id: true, masterCategoryId: true },
  });

  const categoryIdByMasterId = new Map(
    categories.filter((c) => typeof c.masterCategoryId === 'string' && c.masterCategoryId.length > 0).map((c) => [c.masterCategoryId, c.id])
  );

  const products = await prismaAdmin.catalogProduct.findMany({
    where: {
      isActive: true,
      OR: [{ isGlobal: true }, { ownerStoreId: storeId }],
    },
    select: { id: true, stock: true, masterCategoryId: true },
  });

  if (!products.length) return { bootstrapped: 0 };

  const result = await prismaAdmin.storeProductOverride.createMany({
    data: products.map((p) => ({
      storeId,
      productId: p.id,
      categoryId:
        typeof p.masterCategoryId === 'string' && categoryIdByMasterId.has(p.masterCategoryId)
          ? categoryIdByMasterId.get(p.masterCategoryId)
          : uncategorized.id,
      stock: 0,
      isActiveOverride: true,
    })),
    skipDuplicates: true,
  });

  return { bootstrapped: result?.count ?? 0 };
}

async function bootstrapStoreCatalog(storeId) {
  const uncategorized = await ensureUncategorizedCategory(storeId);

  const categories = await withTenantDb(storeId, (db) =>
    db.category.findMany({
      where: { storeId },
      select: { id: true, masterCategoryId: true },
    })
  );

  const categoryIdByMasterId = new Map(
    categories.filter((c) => typeof c.masterCategoryId === 'string' && c.masterCategoryId.length > 0).map((c) => [c.masterCategoryId, c.id])
  );

  const products = await withTenantDb(storeId, (db) =>
    db.catalogProduct.findMany({
      where: {
        isActive: true,
        OR: [{ isGlobal: true }, { ownerStoreId: storeId }],
      },
      select: { id: true, stock: true, masterCategoryId: true },
    })
  );

  if (!products.length) return { bootstrapped: 0 };

  const result = await withTenantDb(storeId, (db) =>
    db.storeProductOverride.createMany({
      data: products.map((p) => ({
        storeId,
        productId: p.id,
        categoryId:
          typeof p.masterCategoryId === 'string' && categoryIdByMasterId.has(p.masterCategoryId)
            ? categoryIdByMasterId.get(p.masterCategoryId)
            : uncategorized.id,
        stock: 0,
        isActiveOverride: true,
      })),
      skipDuplicates: true,
    })
  );

  return { bootstrapped: result?.count ?? 0 };
}

async function ensureUncategorizedCategoryAdmin(storeId) {
  if (!prismaAdmin) throw new Error("Admin DB client not configured (missing DATABASE_URL)");

  const existing = await prismaAdmin.category.findFirst({
    where: { storeId, masterCategoryId: null, name: "Uncategorized" },
    select: { id: true },
  });
  if (existing) return existing;

  return prismaAdmin.category.create({
    data: {
      storeId,
      masterCategoryId: null,
      name: "Uncategorized",
      sortOrder: 9999,
      isActive: true,
    },
    select: { id: true },
  });
}

async function ensureUncategorizedCategory(storeId) {
  const existing = await withTenantDb(storeId, (db) =>
    db.category.findFirst({
      where: { storeId, masterCategoryId: null, name: "Uncategorized" },
      select: { id: true },
    })
  );
  if (existing) return existing;

  return withTenantDb(storeId, (db) =>
    db.category.create({
      data: {
        storeId,
        masterCategoryId: null,
        name: "Uncategorized",
        sortOrder: 9999,
        isActive: true,
      },
      select: { id: true },
    })
  );
}

async function assignAllVisibleProductsToCategoryAdmin(storeId, categoryId) {
  if (!prismaAdmin) throw new Error("Admin DB client not configured (missing DATABASE_URL)");

  const products = await prismaAdmin.catalogProduct.findMany({
    where: {
      isActive: true,
      OR: [{ isGlobal: true }, { ownerStoreId: storeId }],
    },
    select: { id: true },
  });

  if (!products.length) return { assigned: 0 };

  const result = await prismaAdmin.storeProductOverride.createMany({
    data: products.map((p) => ({
      storeId,
      productId: p.id,
      categoryId,
      isActiveOverride: true,
      stock: null,
    })),
    skipDuplicates: true,
  });

  return { assigned: result?.count ?? 0 };
}

async function assignAllVisibleProductsToCategory(storeId, categoryId) {
  const products = await withTenantDb(storeId, (db) =>
    db.catalogProduct.findMany({
      where: {
        isActive: true,
        OR: [{ isGlobal: true }, { ownerStoreId: storeId }],
      },
      select: { id: true },
    })
  );

  if (!products.length) return { assigned: 0 };

  const result = await withTenantDb(storeId, (db) =>
    db.storeProductOverride.createMany({
      data: products.map((p) => ({
        storeId,
        productId: p.id,
        categoryId,
        isActiveOverride: true,
        stock: null,
      })),
      skipDuplicates: true,
    })
  );

  return { assigned: result?.count ?? 0 };
}

// --- Categories
app.get("/categories", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    // Auto-seed on first access so every store has the baseline taxonomy.
    await ensureStoreCategoriesFromMaster(store.id);

    const categories = await withTenantDb(store.id, (db) =>
      db.category.findMany({
        where: { storeId: store.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          createdAt: true,
          sortOrder: true,
          isActive: true,
          masterCategoryId: true,
        },
      })
    );

    return res.json(categories);
  } catch (e) {
    console.error("GET /categories failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to load categories", details: e?.message || String(e) });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const { name } = req.body || {};
    const cleanName = String(name || "").trim();
    if (!cleanName) return res.status(400).json({ error: "name is required" });

    const category = await withTenantDb(store.id, (db) =>
      db.category.create({
        data: { storeId: store.id, name: cleanName },
        select: {
          id: true,
          name: true,
          createdAt: true,
          storeId: true,
          sortOrder: true,
          isActive: true,
          masterCategoryId: true,
        },
      })
    );

    return res.status(201).json(category);
  } catch (e) {
    console.error("POST /categories failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to create category", details: e?.message || String(e) });
  }
});

// --- Customers
app.get("/customers", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const customers = await withTenantDb(store.id, (db) =>
      db.customer.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, phone: true, email: true, createdAt: true },
      })
    );

    return res.json(customers);
  } catch (e) {
    console.error("GET /customers failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to load customers", details: e?.message || String(e) });
  }
});

app.post("/customers", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const { name, phone, email } = req.body || {};
    const cleanName = String(name || "").trim();
    const cleanPhone = phone == null ? null : String(phone).trim();
    const cleanEmail = email == null ? null : String(email).trim();

    if (!cleanName) return res.status(400).json({ error: "name is required" });

    const customer = await withTenantDb(store.id, (db) =>
      db.customer.create({
        data: {
          storeId: store.id,
          name: cleanName,
          phone: cleanPhone || null,
          email: cleanEmail || null,
        },
        select: { id: true, name: true, phone: true, email: true, createdAt: true, storeId: true },
      })
    );

    return res.status(201).json(customer);
  } catch (e) {
    console.error("POST /customers failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to create customer", details: e?.message || String(e) });
  }
});

// --- Orders
app.get("/orders", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const orders = await withTenantDb(store.id, async (db) => {
      const orders = await db.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          deliverySlot: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      const productIds = Array.from(
        new Set(
          orders
            .flatMap((o) => o.items)
            .map((it) => String(it.productId))
            .filter(Boolean)
        )
      );

      if (productIds.length === 0) return orders;

      const overrides = await db.storeProductOverride.findMany({
        where: { storeId: store.id, productId: { in: productIds } },
        select: { productId: true, nameOverride: true },
      });

      const nameOverrideById = new Map(overrides.map((o) => [o.productId, o.nameOverride]));

      return orders.map((o) => ({
        ...o,
        items: o.items.map((it) => {
          const overrideName = nameOverrideById.get(String(it.productId));
          if (!overrideName) return it;
          return {
            ...it,
            product: it.product ? { ...it.product, name: overrideName } : { name: overrideName },
          };
        }),
      }));
    });

    return res.json(orders);
  } catch (e) {
    console.error("GET /orders failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to load orders", details: e?.message || String(e) });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const orderId = String(req.params.id || "").trim();
    if (!orderId) return res.status(400).json({ error: "Missing order id" });

    const order = await withTenantDb(store.id, async (db) => {
      const order = await db.order.findFirst({
        where: { id: orderId, storeId: store.id },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          deliverySlot: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      if (!order) return null;

      const productIds = Array.from(
        new Set(order.items.map((it) => String(it.productId)).filter(Boolean))
      );
      if (productIds.length === 0) return order;

      const overrides = await db.storeProductOverride.findMany({
        where: { storeId: store.id, productId: { in: productIds } },
        select: { productId: true, nameOverride: true },
      });
      const nameOverrideById = new Map(overrides.map((o) => [o.productId, o.nameOverride]));

      return {
        ...order,
        items: order.items.map((it) => {
          const overrideName = nameOverrideById.get(String(it.productId));
          if (!overrideName) return it;
          return {
            ...it,
            product: it.product ? { ...it.product, name: overrideName } : { name: overrideName },
          };
        }),
      };
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (e) {
    console.error("GET /orders/:id failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to load order", details: e?.message || String(e) });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const {
      status,
      intent,
      customerId,
      customerName,
      customerPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      deliverySlot,
      items,
    } = req.body || {};

    const cleanIntent = String(intent || "reserve").trim().toLowerCase();
    const isReserve = cleanIntent !== "confirm" && cleanIntent !== "commit";

    const orderItemsInput = Array.isArray(items) ? items : [];
    if (orderItemsInput.length === 0) {
      return res.status(400).json({ error: "items is required (non-empty array)" });
    }

    const normalized = orderItemsInput
      .map((it) => ({
        productId: String(it?.productId || "").trim(),
        quantity: typeof it?.quantity === "number" ? it.quantity : Number(it?.quantity),
      }))
      .filter((it) => it.productId);

    if (normalized.length === 0) {
      return res.status(400).json({ error: "Each item must include productId" });
    }

    for (const it of normalized) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({ error: "Each item quantity must be a positive integer" });
      }
    }

    const uniqueProductIds = Array.from(new Set(normalized.map((it) => it.productId)));
    const { productById, overrideByProductId } = await withTenantDb(store.id, async (db) => {
      const [catalogProducts, overrides] = await Promise.all([
        db.catalogProduct.findMany({
          where: {
            id: { in: uniqueProductIds },
            isActive: true,
            OR: [{ isGlobal: true }, { ownerStoreId: store.id }],
          },
          select: { id: true, basePrice: true, name: true, isActive: true, stock: true },
        }),
        db.storeProductOverride.findMany({
          where: { storeId: store.id, productId: { in: uniqueProductIds } },
          select: { productId: true, priceOverride: true, isActiveOverride: true, stock: true },
        }),
      ]);

      return {
        productById: new Map(catalogProducts.map((p) => [p.id, p])),
        overrideByProductId: new Map(overrides.map((o) => [o.productId, o])),
      };
    });

    if (productById.size !== uniqueProductIds.length) {
      const found = new Set(Array.from(productById.keys()));
      const missing = uniqueProductIds.filter((id) => !found.has(id));
      return res.status(400).json({ error: "Some products not found", missing });
    }

    // Inventory check: ensure enough stock for each item
    for (const it of normalized) {
      const productId = it.productId;
      const p = productById.get(productId);
      const o = overrideByProductId.get(productId);
      const availableStock = typeof o?.stock === 'number' ? o.stock : p.stock;
      if (o?.isActiveOverride === false) {
        return res.status(400).json({ error: `Product is not available: ${productId}` });
      }
      if (typeof availableStock !== 'number' || availableStock < it.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${productId}` });
      }
    }

    const orderItemsData = normalized.map((it) => {
      const productId = it.productId;
      const p = productById.get(productId);
      const o = overrideByProductId.get(productId);
      return {
        productId,
        quantity: it.quantity,
        unitPrice: o?.priceOverride ?? p.basePrice,
      };
    });

    const total = orderItemsData.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    const created = await prisma.$transaction(async (tx) => {
      if (isPostgres) {
        await tx.$executeRaw`select set_config('app.store_id', ${store.id}, true);`;
      }

      // Deduct stock for each product (override or base)
      for (const it of normalized) {
        const productId = it.productId;
        const o = overrideByProductId.get(productId);
        if (typeof o?.stock === 'number') {
          await tx.storeProductOverride.update({
            where: { storeId_productId: { storeId: store.id, productId } },
            data: { stock: { decrement: it.quantity } },
          });
        } else {
          await tx.catalogProduct.update({
            where: { id: productId },
            data: { stock: { decrement: it.quantity } },
          });
        }
      }

      const order = await tx.order.create({
        data: {
          storeId: store.id,
          total,
          status: isReserve ? "PENDING_PAYMENT" : (String(status || "NEW").trim() || "NEW"),
          customerId: customerId ? String(customerId).trim() : null,
          customerName: customerName == null ? null : String(customerName).trim() || null,
          customerPhone: customerPhone == null ? null : String(customerPhone).trim() || null,
          addressLine1: addressLine1 == null ? null : String(addressLine1).trim() || null,
          addressLine2: addressLine2 == null ? null : String(addressLine2).trim() || null,
          city: city == null ? null : String(city).trim() || null,
          state: state == null ? null : String(state).trim() || null,
          postalCode: postalCode == null ? null : String(postalCode).trim() || null,
          country: country == null ? null : String(country).trim() || null,
          deliverySlot: deliverySlot == null ? null : String(deliverySlot).trim() || null,
        },
        select: { id: true },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((it) => ({ ...it, orderId: order.id })),
      });

      // Fetch full order with all details and product names (with overrides)
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          deliverySlot: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      // Get product name overrides for this store
      const productIds = Array.from(new Set(fullOrder.items.map((it) => String(it.productId)).filter(Boolean)));
      let nameOverrideById = new Map();
      if (productIds.length > 0) {
        const overrides = await tx.storeProductOverride.findMany({
          where: { storeId: store.id, productId: { in: productIds } },
          select: { productId: true, nameOverride: true },
        });
        nameOverrideById = new Map(overrides.map((o) => [String(o.productId), o.nameOverride]));
      }

      // Compute estimated delivery
      let estimatedDelivery = null;
      if (fullOrder.deliverySlot) {
        // If deliverySlot is an ISO string or time range, use it directly
        estimatedDelivery = fullOrder.deliverySlot;
      } else {
        // ASAP: estimate e.g. 30-60 min from now
        const now = new Date();
        const eta = new Date(now.getTime() + 45 * 60000); // 45 min from now
        estimatedDelivery = eta.toISOString();
      }

      // Build rich order summary
      return {
        ...fullOrder,
        items: fullOrder.items.map((it) => {
          const overrideName = nameOverrideById.get(String(it.productId));
          return {
            ...it,
            product: { name: overrideName || (it.product ? it.product.name : "") },
          };
        }),
        estimatedDelivery,
        payment: {
          required: isReserve,
          status: isReserve ? "PENDING" : "NOT_REQUIRED",
        },
      };
    });

    return res.status(201).json(created);
  } catch (e) {
    if (e?.statusCode === 400) {
      return res.status(400).json({ error: e.message });
    }
    console.error("POST /orders failed:", e);
    return res
      .status(500)
      .json({ error: "Failed to create order", details: e?.message || String(e) });
  }
});

// Confirm payment for an order (finalize reservation)
app.post("/orders/:id/confirm", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const orderId = String(req.params.id || "").trim();
    if (!orderId) return res.status(400).json({ error: "Missing order id" });

    const updated = await prisma.$transaction(async (tx) => {
      if (isPostgres) {
        await tx.$executeRaw`select set_config('app.store_id', ${store.id}, true);`;
      }

      const order = await tx.order.findFirst({
        where: { id: orderId, storeId: store.id },
        select: { id: true, status: true },
      });

      if (!order) {
        const err = new Error("Order not found");
        err.statusCode = 404;
        throw err;
      }

      if (order.status === "CANCELLED") {
        const err = new Error("Order was cancelled");
        err.statusCode = 409;
        throw err;
      }

      if (order.status !== "PENDING_PAYMENT") {
        // Idempotent-ish: if already confirmed/placed, return as-is.
        return tx.order.findUnique({
          where: { id: order.id },
          select: { id: true, status: true },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
        select: { id: true, status: true },
      });
    });

    return res.json(updated);
  } catch (e) {
    if (e?.statusCode === 404) return res.status(404).json({ error: e.message });
    if (e?.statusCode === 409) return res.status(409).json({ error: e.message });
    console.error("POST /orders/:id/confirm failed:", e);
    return res.status(500).json({ error: "Failed to confirm order", details: e?.message || String(e) });
  }
});

// Cancel an order and restore reserved stock
app.post("/orders/:id/cancel", async (req, res) => {
  try {
    const store = await requireTenantStore(req, res);
    if (!store) return;

    const orderId = String(req.params.id || "").trim();
    if (!orderId) return res.status(400).json({ error: "Missing order id" });

    const result = await prisma.$transaction(async (tx) => {
      if (isPostgres) {
        await tx.$executeRaw`select set_config('app.store_id', ${store.id}, true);`;
      }

      const order = await tx.order.findFirst({
        where: { id: orderId, storeId: store.id },
        select: {
          id: true,
          status: true,
          items: { select: { productId: true, quantity: true } },
        },
      });

      if (!order) {
        const err = new Error("Order not found");
        err.statusCode = 404;
        throw err;
      }

      if (order.status === "CANCELLED") {
        return { id: order.id, status: order.status, restored: 0 };
      }

      if (order.status !== "PENDING_PAYMENT") {
        const err = new Error("Only PENDING_PAYMENT orders can be cancelled");
        err.statusCode = 409;
        throw err;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const productIds = Array.from(new Set(items.map((it) => String(it.productId)).filter(Boolean)));

      const overrides = productIds.length
        ? await tx.storeProductOverride.findMany({
            where: { storeId: store.id, productId: { in: productIds } },
            select: { productId: true, stock: true },
          })
        : [];
      const overrideByProductId = new Map(overrides.map((o) => [String(o.productId), o]));

      let restored = 0;
      for (const it of items) {
        const productId = String(it.productId || "");
        const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity);
        if (!productId || !Number.isInteger(qty) || qty <= 0) continue;

        const o = overrideByProductId.get(productId);
        if (typeof o?.stock === 'number') {
          await tx.storeProductOverride.update({
            where: { storeId_productId: { storeId: store.id, productId } },
            data: { stock: { increment: qty } },
          });
        } else {
          await tx.catalogProduct.update({
            where: { id: productId },
            data: { stock: { increment: qty } },
          });
        }
        restored += qty;
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        select: { id: true, status: true },
      });

      return { ...updated, restored };
    });

    return res.json(result);
  } catch (e) {
    if (e?.statusCode === 404) return res.status(404).json({ error: e.message });
    if (e?.statusCode === 409) return res.status(409).json({ error: e.message });
    console.error("POST /orders/:id/cancel failed:", e);
    return res.status(500).json({ error: "Failed to cancel order", details: e?.message || String(e) });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
