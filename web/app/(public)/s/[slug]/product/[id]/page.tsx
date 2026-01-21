import Link from "next/link";
import ProductPageClient from "./product-page-client";

type Product = {
  id: string | number;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type Store = {
  name: string;
  phone: string;
  themeColor: string;
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = slug.trim().toLowerCase();

  const apiBase =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3001";

  let store: Store | null = null;
  let product: Product | null = null;
  let products: Product[] = [];
  let error: string | null = null;

  try {
    const [storeRes, productsRes] = await Promise.all([
      fetch(`${apiBase}/store`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      }),
      fetch(`${apiBase}/products`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      }),
    ]);

    store = storeRes.ok ? await storeRes.json() : null;
    products = (productsRes.ok ? await productsRes.json() : []) as Product[];

    const match = Array.isArray(products)
      ? products.find((p) => String(p?.id) === String(id))
      : null;

    product = match || null;

    if (!store) error = "Store not found";
    else if (!product) error = "Product not found";
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Product</h1>
            <p className="mt-2 text-sm text-foreground/70">{error}</p>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/s/${encodeURIComponent(tenant)}`}
                className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                Back to store
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ProductPageClient
      tenant={tenant}
      store={store!}
      product={product!}
      products={Array.isArray(products) ? products : []}
    />
  );
}
