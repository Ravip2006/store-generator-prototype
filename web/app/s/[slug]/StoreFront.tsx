"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Store = {
  name: string;
  phone: string;
  themeColor: string;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type CartLine = {
  product: Product;
  quantity: number;
};

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    Number.isFinite(v.price)
  );
}

function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("") || "S";
}

function hexWithAlpha(hex: string, alphaHex: string) {
  const value = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return null;
  return `${value}${alphaHex}`;
}

function TrolleyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L22 8H6" />
    </svg>
  );
}

export default function StoreFront({ slug }: { slug: string }) {
  const tenant = slug.trim().toLowerCase();
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  function cartStorageKey(currentTenant: string) {
    return `storegen:cart:${currentTenant}`;
  }

  function legacyCartStorageKey(currentTenant: string) {
    return `cart:${currentTenant}`;
  }

  function coerceCartRecord(value: unknown): Record<string, CartLine> {
    if (!value || typeof value !== "object") return {};

    // Accept either the current schema: { [productId]: { product, quantity } }
    // or legacy schema: { items: [{ product, qty|quantity }] }
    const maybeRecord = value as Record<string, unknown>;
    const maybeItems = maybeRecord.items;
    if (Array.isArray(maybeItems)) {
      const next: Record<string, CartLine> = {};
      for (const item of maybeItems) {
        if (!item || typeof item !== "object") continue;
        const it = item as Record<string, unknown>;
        const product = it.product;
        const qty = Number(it.quantity ?? it.qty);
        if (!isProduct(product)) continue;
        if (!Number.isFinite(qty) || qty <= 0) continue;
        next[product.id] = { product, quantity: Math.floor(qty) };
      }
      return next;
    }

    const next: Record<string, CartLine> = {};
    for (const [productId, line] of Object.entries(maybeRecord)) {
      if (!line || typeof line !== "object") continue;
      const l = line as Record<string, unknown>;
      const product = l.product;
      const qty = Number(l.quantity);
      if (!isProduct(product)) continue;
      if (productId !== product.id) continue;
      if (!Number.isFinite(qty) || qty <= 0) continue;
      next[productId] = { product, quantity: Math.floor(qty) };
    }
    return next;
  }

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const [cart, setCart] = useState<Record<string, CartLine>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [cartPanelView, setCartPanelView] = useState<"cart" | "checkout">("cart");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  function lastOrderStorageKey(currentTenant: string) {
    return `storegen:lastOrderId:${currentTenant}`;
  }

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [cartLines]
  );

  const cartItemCount = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.quantity, 0),
    [cartLines]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = !categoryId || p.categoryId === categoryId;
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, categoryId]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      const nextQty = (existing?.quantity || 0) + 1;
      return {
        ...prev,
        [product.id]: { product, quantity: nextQty },
      };
    });
  }

  function quantityInCart(productId: string) {
    return cart[productId]?.quantity || 0;
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...existing, quantity: nextQty } };
    });
  }

  function clearCart() {
    setCart({});
    try {
      localStorage.removeItem(cartStorageKey(tenant));
    } catch {
      // ignore
    }
  }

  // Load cart from localStorage per tenant
  useEffect(() => {
    try {
      const primaryKey = cartStorageKey(tenant);
      const legacyKey = legacyCartStorageKey(tenant);

      const primaryRaw = localStorage.getItem(primaryKey);
      const legacyRaw = primaryRaw ? null : localStorage.getItem(legacyKey);

      const raw = primaryRaw ?? legacyRaw;
      if (!raw) {
        setCart({});
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = coerceCartRecord(parsed);
      setCart(normalized);

      // If we loaded legacy data, migrate it to the canonical key.
      if (!primaryRaw && legacyRaw) {
        try {
          localStorage.setItem(primaryKey, JSON.stringify(normalized));
          localStorage.removeItem(legacyKey);
        } catch {
          // ignore
        }
      }
    } catch {
      setCart({});
    }
  }, [tenant]);

  // Persist cart to localStorage per tenant
  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [tenant, cart]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [storeRes, categoriesRes, productsRes] = await Promise.all([
        fetch(`${apiBase}/store`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
        fetch(`${apiBase}/categories`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
        fetch(`${apiBase}/products`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
      ]);

      const storeData = await storeRes.json().catch(() => null);
      const categoriesData = await categoriesRes.json().catch(() => []);
      const productsData = await productsRes.json().catch(() => []);

      if (!storeRes.ok) throw new Error(storeData?.error || "Store not found");
      setStore(storeData);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (e) {
      setStore(null);
      setCategories([]);
      setProducts([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiBase, tenant]);

  function whatsappPhone(): string | null {
    const raw = store?.phone || "";
    const digits = raw.replace(/[^0-9]/g, "");
    return digits ? digits : null;
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cartItemCount === 0) setCartPanelOpen(false);
  }, [cartItemCount]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lastOrderStorageKey(tenant));
      const clean = String(raw || "").trim();
      setLastOrderId(clean || null);
    } catch {
      setLastOrderId(null);
    }
  }, [tenant]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-5xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <div className="h-7 w-48 rounded-lg bg-foreground/10" />
            <div className="mt-3 h-4 w-72 rounded-lg bg-foreground/10" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !store) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-5xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Store unavailable</h1>
            <p className="mt-2 text-sm text-foreground/70">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const storeName = store?.name || "Store";
  const accent = store?.themeColor || undefined;
  const logoText = initialsFromName(storeName);
  const currentYear = new Date().getFullYear();
  const whatsappStoreHref = (() => {
    const phone = whatsappPhone();
    return phone ? `https://wa.me/${phone}` : null;
  })();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 text-xs font-bold tracking-tight shadow-sm"
                style={{ backgroundColor: accent }}
              >
                <span className="text-background">{logoText}</span>
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                {storeName}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {whatsappStoreHref && (
              <a
                href={whatsappStoreHref}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 sm:inline-flex"
                style={accent ? { borderColor: accent, color: accent } : undefined}
              >
                WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                setCartPanelOpen((v) => {
                  const next = !v;
                  if (next) setCartPanelView("cart");
                  return next;
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-3 py-2 text-sm font-semibold text-background hover:opacity-90"
              style={accent ? { backgroundColor: accent, borderColor: accent } : undefined}
            >
              <TrolleyIcon className="h-4 w-4" />
              <span>Cart</span>
              <span className="rounded-full border border-background/30 bg-background px-2 py-0.5 text-xs text-foreground">
                {cartItemCount}
              </span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/5 via-background to-background" />

          <div className="relative p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Storefront
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {storeName}
                </h2>
                <p className="mt-2 max-w-prose text-sm text-foreground/70">
                  Fresh picks, fast checkout — add items and place an order.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs text-foreground/70">
                  Items in cart: <span className="font-semibold">{cartItemCount}</span>
                </span>
                {whatsappStoreHref && (
                  <a
                    href={whatsappStoreHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-medium hover:bg-foreground/5"
                  >
                    WhatsApp store
                  </a>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
                <b>Error:</b> {error}
              </div>
            )}

            <div className="mt-8 grid gap-4 lg:grid-cols-[240px_1fr]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-2xl border border-foreground/10 bg-background p-4">
                  <div className="text-sm font-semibold">Categories</div>
                  <div className="mt-3 grid gap-1">
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      style={
                        !categoryId && store?.themeColor
                          ? {
                              borderLeftColor: store.themeColor,
                              color: store.themeColor,
                              backgroundColor:
                                hexWithAlpha(store.themeColor, "14") ?? undefined,
                            }
                          : undefined
                      }
                      className={
                        categoryId
                          ? "w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-left text-sm font-medium hover:bg-foreground/5"
                          : "w-full rounded-xl border border-foreground/10 border-l-4 bg-foreground/5 px-3 py-2 text-left text-sm font-semibold"
                      }
                    >
                      All products
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        style={
                          categoryId === c.id && store?.themeColor
                            ? {
                                borderLeftColor: store.themeColor,
                                color: store.themeColor,
                                backgroundColor:
                                  hexWithAlpha(store.themeColor, "14") ?? undefined,
                              }
                            : undefined
                        }
                        className={
                          categoryId === c.id
                            ? "w-full rounded-xl border border-foreground/10 border-l-4 bg-foreground/5 px-3 py-2 text-left text-sm font-semibold"
                            : "w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-left text-sm font-medium hover:bg-foreground/5"
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="rounded-2xl border border-foreground/10 bg-background p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold">Products</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products"
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                    />
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 sm:max-w-60 lg:hidden"
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      style={
                        !categoryId && store?.themeColor
                          ? {
                              borderColor: store.themeColor,
                              color: store.themeColor,
                              backgroundColor:
                                hexWithAlpha(store.themeColor, "14") ?? undefined,
                            }
                          : undefined
                      }
                      className={
                        categoryId
                          ? "whitespace-nowrap rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-medium hover:bg-foreground/5"
                          : "whitespace-nowrap rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold"
                      }
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        style={
                          categoryId === c.id && store?.themeColor
                            ? {
                                borderColor: store.themeColor,
                                color: store.themeColor,
                                backgroundColor:
                                  hexWithAlpha(store.themeColor, "14") ?? undefined,
                              }
                            : undefined
                        }
                        className={
                          categoryId === c.id
                            ? "whitespace-nowrap rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold"
                            : "whitespace-nowrap rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-medium hover:bg-foreground/5"
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                    <div className="text-sm font-semibold">No products found</div>
                    <p className="mt-1 text-sm text-foreground/70">
                      Try clearing the search or switching categories.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="group overflow-hidden rounded-2xl border border-foreground/10 bg-background hover:bg-foreground/5"
                      >
                        <Link
                          href={`/s/${encodeURIComponent(tenant)}/product/${encodeURIComponent(String(p.id))}`}
                          className="block"
                        >
                          <div className="aspect-[4/3] w-full border-b border-foreground/10 bg-foreground/5">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-foreground/50">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="p-4 pb-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{p.name}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">₹{p.price}</span>
                                {p.category?.name && (
                                  <span className="rounded-full border border-foreground/15 bg-background px-2 py-0.5 text-xs text-foreground/70">
                                    {p.category.name}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-xs font-medium underline underline-offset-4 text-foreground/70 group-hover:text-foreground/90">
                                View details
                              </div>
                            </div>
                          </div>
                        </Link>

                        <div className="px-4 pb-4">
                          <div className="flex items-center justify-end gap-2">
                            {quantityInCart(p.id) > 0 ? (
                              <div className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-background px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(p.id)}
                                  className="rounded-lg border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                                  style={accent ? { borderColor: accent, color: accent } : undefined}
                                >
                                  −
                                </button>
                                <span className="min-w-6 text-center text-sm font-semibold">
                                  {quantityInCart(p.id)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(p)}
                                  className="rounded-lg border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                                  style={accent ? { borderColor: accent, color: accent } : undefined}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(p)}
                                className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold hover:bg-foreground/5"
                                style={accent ? { borderColor: accent, color: accent } : undefined}
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-foreground/10 bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 text-xs font-bold tracking-tight shadow-sm"
                  style={accent ? { backgroundColor: accent } : undefined}
                >
                  <span className="text-background">{logoText}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{storeName}</div>
                  <div className="truncate text-xs text-foreground/60">Fast delivery • Easy ordering</div>
                </div>
              </div>

              {store?.phone ? (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
                >
                  Call store
                </a>
              ) : (
                <div className="text-sm text-foreground/60">Store phone not available</div>
              )}
              {whatsappStoreHref ? (
                <a
                  href={whatsappStoreHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
                >
                  WhatsApp store
                </a>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-semibold">Company</div>
              <div className="mt-3 grid gap-2 text-sm text-foreground/70">
                <a href="#about-store" className="hover:text-foreground/90">About</a>
                <a href="#contact" className="hover:text-foreground/90">Contact</a>
                <a href="#top" className="hover:text-foreground/90">Back to top</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Help</div>
              <div className="mt-3 grid gap-2 text-sm text-foreground/70">
                <a href="#delivery" className="hover:text-foreground/90">Delivery info</a>
                <a href="#cancellation-policy" className="hover:text-foreground/90">Cancellation policy</a>
                <a href="#support" className="hover:text-foreground/90">Support</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Legal</div>
              <div className="mt-3 grid gap-2 text-sm text-foreground/70">
                <a href="#terms" className="hover:text-foreground/90">Terms</a>
                <a href="#privacy" className="hover:text-foreground/90">Privacy</a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 rounded-2xl border border-foreground/10 bg-foreground/5 p-6">
            <div id="about-store" className="scroll-mt-24">
              <div className="text-sm font-semibold">About</div>
              <p className="mt-2 text-sm text-foreground/70">
                {storeName} is a local store. Prices and availability may vary by location.
              </p>
            </div>

            <div id="contact" className="scroll-mt-24">
              <div className="text-sm font-semibold">Contact</div>
              <p className="mt-2 text-sm text-foreground/70">
                For order updates, you can call or WhatsApp the store.
              </p>
            </div>

            <div id="delivery" className="scroll-mt-24">
              <div className="text-sm font-semibold">Delivery info</div>
              <p className="mt-2 text-sm text-foreground/70">
                Delivery slots are subject to availability. Exact timings can vary based on demand and address.
              </p>
            </div>

            <div id="support" className="scroll-mt-24">
              <div className="text-sm font-semibold">Support</div>
              <p className="mt-2 text-sm text-foreground/70">
                If you received a damaged or incorrect item, contact the store as soon as possible.
              </p>
            </div>

            <div id="cancellation-policy" className="scroll-mt-24">
              <div className="text-sm font-semibold">Cancellation policy</div>
              <p className="mt-2 text-sm text-foreground/70">
                Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund may be provided, if applicable.
              </p>
            </div>

            <div id="terms" className="scroll-mt-24">
              <div className="text-sm font-semibold">Terms</div>
              <p className="mt-2 text-sm text-foreground/70">
                By placing an order, you agree to provide accurate contact and delivery details.
              </p>
            </div>

            <div id="privacy" className="scroll-mt-24">
              <div className="text-sm font-semibold">Privacy</div>
              <p className="mt-2 text-sm text-foreground/70">
                Your information is used only to fulfill your order and contact you about delivery.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-foreground/10 pt-6 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <div>© {currentYear} {storeName}. All rights reserved.</div>
            <div>Powered by Store Generator</div>
          </div>
        </div>
      </footer>

      {cartPanelOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 z-0 bg-foreground/20"
            onClick={() => {
              setCartPanelOpen(false);
              setCartPanelView("cart");
            }}
          />

          <div className="absolute right-0 top-0 z-10 h-full w-full max-w-md border-l border-foreground/10 bg-background shadow-sm">
            <div className="sticky top-0 z-10 border-b border-foreground/10 bg-background/90 backdrop-blur">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10"
                      style={accent ? { backgroundColor: accent } : undefined}
                    >
                      <TrolleyIcon className="h-5 w-5 text-background" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">My cart</div>
                      <div className="text-xs text-foreground/60">
                        {cartItemCount} item{cartItemCount === 1 ? "" : "s"} • ₹{cartTotal}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/s/${encodeURIComponent(tenant)}/cart`}
                    onClick={() => {
                      setCartPanelOpen(false);
                      setCartPanelView("cart");
                    }}
                    className="text-xs font-medium underline underline-offset-4 hover:text-foreground/80"
                  >
                    Open checkout
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCartPanelOpen(false);
                      setCartPanelView("cart");
                    }}
                    className="rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-semibold hover:bg-foreground/5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="h-full overflow-y-auto p-5">
              {cartItemCount === 0 ? (
                <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                  <div className="text-sm font-semibold">Your cart is empty</div>
                  <p className="mt-1 text-sm text-foreground/70">
                    Add a few products to start checkout.
                  </p>
                </div>
              ) : cartPanelView === "checkout" ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
                    <div className="text-sm font-semibold">Checkout</div>
                    <p className="mt-1 text-sm text-foreground/70">
                      Log in to save details and see your orders, or continue as a guest.
                    </p>

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold opacity-60"
                      >
                        Log in (coming soon)
                      </button>
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold opacity-60"
                      >
                        Sign up (coming soon)
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
                    <div className="text-sm font-semibold">Quick links</div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <Link
                        href={`/s/${encodeURIComponent(tenant)}`}
                        onClick={() => {
                          setCartPanelOpen(false);
                          setCartPanelView("cart");
                        }}
                        className="rounded-xl border border-foreground/15 bg-background px-4 py-3 font-medium hover:bg-foreground/5"
                      >
                        Buy again
                      </Link>

                      {lastOrderId ? (
                        <Link
                          href={`/s/${encodeURIComponent(tenant)}/order/${encodeURIComponent(lastOrderId)}`}
                          onClick={() => {
                            setCartPanelOpen(false);
                            setCartPanelView("cart");
                          }}
                          className="rounded-xl border border-foreground/15 bg-background px-4 py-3 font-medium hover:bg-foreground/5"
                        >
                          My orders
                        </Link>
                      ) : (
                        <div className="rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground/60">
                          My orders (no recent orders yet)
                        </div>
                      )}

                      {whatsappStoreHref ? (
                        <a
                          href={whatsappStoreHref}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-foreground/15 bg-background px-4 py-3 font-medium hover:bg-foreground/5"
                        >
                          Help & support (WhatsApp)
                        </a>
                      ) : (
                        <div className="rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground/60">
                          Help & support
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 border-t border-foreground/10 bg-background/90 pt-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Subtotal</div>
                      <div className="text-sm font-semibold">₹{cartTotal}</div>
                    </div>
                    <Link
                      href={`/s/${encodeURIComponent(tenant)}/cart`}
                      onClick={() => {
                        setCartPanelOpen(false);
                        setCartPanelView("cart");
                      }}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-foreground/15 px-4 py-3 text-sm font-semibold text-background hover:opacity-90"
                      style={accent ? { backgroundColor: accent, borderColor: accent } : undefined}
                    >
                      Continue to checkout
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCartPanelView("cart")}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5"
                    >
                      Back to cart
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {cartLines.map((l) => (
                      <div
                        key={l.product.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-background p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{l.product.name}</div>
                          <div className="text-xs text-foreground/70">
                            ₹{l.product.price} × {l.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(l.product.id)}
                            className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                            style={accent ? { borderColor: accent, color: accent } : undefined}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(l.product)}
                            className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                            style={accent ? { borderColor: accent, color: accent } : undefined}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 flex items-center justify-between border-t border-foreground/10 pt-3">
                      <span className="text-sm text-foreground/70">Subtotal</span>
                      <span className="text-sm font-semibold">₹{cartTotal}</span>
                    </div>

                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-left text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
                    >
                      Clear cart
                    </button>
                  </div>

                  <div className="sticky bottom-0 mt-6 border-t border-foreground/10 bg-background/90 pt-4 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setCartPanelView("checkout")}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-foreground/15 px-4 py-3 text-sm font-semibold text-background hover:opacity-90"
                      style={accent ? { backgroundColor: accent, borderColor: accent } : undefined}
                    >
                      Checkout
                    </button>
                    <p className="mt-2 text-center text-xs text-foreground/60">
                      You’ll enter delivery details on the next screen.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
