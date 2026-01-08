import { headers } from "next/headers";

type Store = {
  name: string;
  phone: string;
  themeColor: string;
};

type Product = {
  id: number | string;
  name: string;
  price: number;
};

export default async function Page() {
  const h = await headers();
  const tenant = h.get("x-tenant-id") || "green-mart";

  const apiBase = process.env.API_BASE_URL || "http://localhost:3001";

  const storeRes = await fetch(`${apiBase}/store`, {
    headers: { "x-tenant-id": tenant },
    cache: "no-store",
  });

  const productsRes = await fetch(`${apiBase}/products`, {
    headers: { "x-tenant-id": tenant },
    cache: "no-store",
  });

  const store: Store | null = storeRes.ok ? await storeRes.json() : null;
  const products: Product[] = productsRes.ok ? await productsRes.json() : [];

  if (!store) {
    return <h1 style={{ padding: 20 }}>Store not found</h1>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 8 }}>{store.name}</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>Tenant: {tenant}</p>

      <div style={{ marginTop: 24 }}>
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <p style={{ margin: "6px 0" }}>₹{p.price}</p>

              <a
                href={`https://wa.me/${store.phone}?text=${encodeURIComponent(
                  `Hi ${store.name}, I want to order: ${p.name} (₹${p.price})`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Order on WhatsApp
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
