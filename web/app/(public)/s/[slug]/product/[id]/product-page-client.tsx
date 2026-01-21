"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Store = {
  name: string;
  phone: string;
  themeColor: string;
};

type Product = {
  id: string | number;
  name: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number | null;
  discountPrice?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  brand?: string | null;
  packSize?: string | null;
  stock?: number | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type CartLine = {
  product: Product;
  quantity: number;
};

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
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
      <path d="M12 2l1.2 4.3L17 7.5l-3.8 1.2L12 13l-1.2-4.3L7 7.5l3.8-1.2L12 2z" />
      <path d="M19 11l.7 2.5L22 14l-2.3.5L19 17l-.7-2.5L16 14l2.3-.5L19 11z" />
      <path d="M4 12l.7 2.5L7 15l-2.3.5L4 18l-.7-2.5L1 15l2.3-.5L4 12z" />
    </svg>
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

function cartStorageKey(tenant: string) {
  return `storegen:cart:${tenant}`;
}

function legacyCartStorageKey(tenant: string) {
  return `cart:${tenant}`;
}

function coerceCartRecord(value: unknown): Record<string, CartLine> {
  if (!value || typeof value !== "object") return {};

  const maybeRecord = value as Record<string, unknown>;
  const maybeItems = maybeRecord.items;
  if (Array.isArray(maybeItems)) {
    const next: Record<string, CartLine> = {};
    for (const item of maybeItems) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const product = it.product as Product | undefined;
      const qty = Number(it.quantity ?? it.qty);
      if (!product || !product.id) continue;
      if (!Number.isFinite(qty) || qty <= 0) continue;
      next[String(product.id)] = { product, quantity: Math.floor(qty) };
    }
    return next;
  }

  const next: Record<string, CartLine> = {};
  for (const [productId, line] of Object.entries(maybeRecord)) {
    if (!line || typeof line !== "object") continue;
    const l = line as Record<string, unknown>;
    const product = l.product as Product | undefined;
    const qty = Number(l.quantity);
    if (!product || !product.id) continue;
    if (String(productId) !== String(product.id)) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    next[String(productId)] = { product, quantity: Math.floor(qty) };
  }
  return next;
}

export default function ProductPageClient({
  tenant,
  store,
  product,
  products,
}: {
  tenant: string;
  store: Store;
  product: Product;
  products: Product[];
}) {
  const productId = String(product.id);
  const [cart, setCart] = useState<Record<string, CartLine>>({});

  const [description, setDescription] = useState<string>(
    String(product.description || "").trim()
  );

  const accent = store.themeColor || undefined;
  const logoText = initialsFromName(store.name);
  const currentYear = new Date().getFullYear();
  const whatsappStoreHref = (() => {
    const phone = String(store.phone || "").replace(/\D/g, "");
    return phone ? `https://wa.me/${phone}` : null;
  })();

  const qty = cart[productId]?.quantity || 0;

  const isOutOfStock = typeof product.stock === "number" ? product.stock <= 0 : false;
  const descriptionParagraphs = useMemo(() => {
    const text = String(description || "").trim();
    if (!text) return [] as string[];
    return text
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [description]);

  const similarProducts = useMemo(() => {
    const currentCategoryId = product.categoryId ?? null;
    if (!currentCategoryId) return [];
    return (Array.isArray(products) ? products : [])
      .filter((p) => String(p?.id) !== String(product.id))
      .filter((p) => (p.categoryId ?? null) === currentCategoryId)
      .slice(0, 8);
  }, [products, product.id, product.categoryId]);

  const cartItemCount = useMemo(
    () => Object.values(cart).reduce((sum, l) => sum + l.quantity, 0),
    [cart]
  );

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

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [tenant, cart]);

  function addToCart(p: Product) {
    if (typeof p.stock === "number" && p.stock <= 0) return;
    const id = String(p.id);
    setCart((prev) => {
      const existing = prev[id];
      return {
        ...prev,
        [id]: { product: p, quantity: (existing?.quantity || 0) + 1 },
      };
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...existing, quantity: nextQty } };
    });
  }

  return (
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xs font-bold tracking-tight shadow-sm"
                style={{ backgroundColor: accent }}
              >
                <span className="text-white">{logoText}</span>
              </div>
              <div className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">{store.name}</div>
            </div>
            <div className="mt-1 text-xs text-white/60 truncate">
              {product.category?.name ? product.category.name : "Product"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/s/${encodeURIComponent(tenant)}/cart`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              style={accent ? { backgroundColor: accent, borderColor: accent } : undefined}
            >
              <TrolleyIcon className="h-4 w-4" />
              <span>Cart</span>
              <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-xs text-white">
                {cartItemCount}
              </span>
            </Link>
            <Link
              href={`/s/${encodeURIComponent(tenant)}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <div className="flex w-full items-center justify-center overflow-hidden bg-white/10 aspect-square sm:aspect-[4/3]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  /* w-full h-full + object-contain is the gold standard.
                   * The image will resize to fit the box perfectly
                   * without ever stretching or squishing.
                   */
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                  No image
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Product description</div>
              </div>

              <div className="mt-2 space-y-3 text-sm text-white/70">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((p, idx) => <p key={idx}>{p}</p>)
                ) : (
                  <p>No description available yet.</p>
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="text-sm font-semibold text-white">Product details</div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  {product.brand ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-white/80">Brand</dt>
                      <dd className="mt-1 text-white/90">{product.brand}</dd>
                    </div>
                  ) : null}
                  {product.packSize ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-white/80">Pack size</dt>
                      <dd className="mt-1 text-white/90">{product.packSize}</dd>
                    </div>
                  ) : null}
                  {product.category?.name ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-white/80">Category</dt>
                      <dd className="mt-1 text-white/90">{product.category.name}</dd>
                    </div>
                  ) : null}
                  {typeof product.stock === "number" ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-white/80">Availability</dt>
                      <dd className="mt-1 text-white/90">
                        {product.stock <= 0 ? "Out of stock" : `${product.stock} in stock`}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="min-w-0">
                {product.brand ? (
                  <div className="text-xs font-medium uppercase tracking-wide text-white/80">
                    {product.brand}
                  </div>
                ) : null}
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">{product.name}</h1>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-white/70">
                  {product.packSize ? <span>{product.packSize}</span> : null}
                  {product.packSize && product.category?.name ? (
                    <span className="text-white/40">•</span>
                  ) : null}
                  {product.category?.name ? <span>{product.category.name}</span> : null}
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  {typeof product.regularPrice === "number" && product.regularPrice !== product.price ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-semibold text-green-600">₹{product.price.toFixed(2)}</div>
                        {typeof product.discountPercent === "number" && product.discountPercent > 0 ? (
                          <div className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            {product.discountPercent.toFixed(0)}% OFF
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm text-white/60 line-through">₹{product.regularPrice.toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-semibold">₹{product.price.toFixed(2)}</div>
                  )}
                  <div className="text-xs text-white/70 mt-1">Inclusive of all taxes</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {qty > 0 ? (
                  <div className="inline-flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeFromCart(productId)}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                      style={accent ? { borderColor: accent, color: accent } : undefined}
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                      style={accent ? { borderColor: accent, color: accent } : undefined}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                    style={accent ? { borderColor: accent, color: accent } : undefined}
                  >
                    {isOutOfStock ? "Out of stock" : "Add to cart"}
                  </button>
                )}

                <Link
                  href={`/s/${encodeURIComponent(tenant)}/cart`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Go to cart
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Why shop from {store.name}?</div>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                      style={accent ? { backgroundColor: accent } : undefined}
                    >
                      <ShieldIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm text-white/80">
                      Trusted local store with secure checkout.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                      style={accent ? { backgroundColor: accent } : undefined}
                    >
                      <ClockIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm text-white/80">
                      Quick ordering and easy updates over WhatsApp.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                      style={accent ? { backgroundColor: accent } : undefined}
                    >
                      <SparkleIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm text-white/80">
                      Fresh assortment curated for your daily needs.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Similar products</h2>
            {product.category?.name ? (
              <div className="text-xs text-white/70">From {product.category.name}</div>
            ) : null}
          </div>

          {similarProducts.length === 0 ? (
            <p className="mt-2 text-sm text-white/70">
              No similar products found.
            </p>
          ) : (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
              {similarProducts.map((p) => {
                const id = String(p.id);
                const lineQty = cart[id]?.quantity || 0;
                const pOutOfStock = typeof p.stock === "number" ? p.stock <= 0 : false;
                return (
                  <div
                    key={id}
                    className="w-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl sm:w-auto"
                  >
                    <Link
                      href={`/s/${encodeURIComponent(tenant)}/product/${encodeURIComponent(id)}`}
                      className="block"
                    >
                      <div className="aspect-[4/3] w-full bg-white/10">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-medium text-white">{p.name}</div>
                        <div className="mt-1 text-sm font-semibold text-white">₹{p.price}</div>
                      </div>
                    </Link>

                    <div className="px-3 pb-3">
                      {lineQty > 0 ? (
                        <div className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(id)}
                            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20"
                            style={accent ? { borderColor: accent, color: accent } : undefined}
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-white">
                            {lineQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            disabled={pOutOfStock}
                            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20"
                            style={accent ? { borderColor: accent, color: accent } : undefined}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          disabled={pOutOfStock}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                          style={accent ? { borderColor: accent, color: accent } : undefined}
                        >
                          {pOutOfStock ? "Out" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-10 border-t border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xs font-bold tracking-tight shadow-sm"
                  style={accent ? { backgroundColor: accent } : undefined}
                >
                  <span className="text-white">{logoText}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{store.name}</div>
                  <div className="truncate text-xs text-white/60">Fast delivery • Easy ordering</div>
                </div>
              </div>

              {store?.phone ? (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white"
                >
                  Call store
                </a>
              ) : (
                <div className="text-sm text-white/60">Store phone not available</div>
              )}
              {whatsappStoreHref ? (
                <a
                  href={whatsappStoreHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white"
                >
                  WhatsApp store
                </a>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Company</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#about-store" className="hover:text-white">About</a>
                <a href="#contact" className="hover:text-white">Contact</a>
                <a href="#top" className="hover:text-white">Back to top</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Help</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#delivery" className="hover:text-white">Delivery info</a>
                <a href="#cancellation-policy" className="hover:text-white">Cancellation policy</a>
                <a href="#support" className="hover:text-white">Support</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Legal</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#terms" className="hover:text-white">Terms</a>
                <a href="#privacy" className="hover:text-white">Privacy</a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div id="about-store" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">About</div>
              <p className="mt-2 text-sm text-white/70">
                {store.name} is a local store. Prices and availability may vary by location.
              </p>
            </div>

            <div id="contact" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Contact</div>
              <p className="mt-2 text-sm text-white/70">
                For order updates, you can call or WhatsApp the store.
              </p>
            </div>

            <div id="delivery" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Delivery info</div>
              <p className="mt-2 text-sm text-white/70">
                Delivery slots are subject to availability. Exact timings can vary based on demand and address.
              </p>
            </div>

            <div id="support" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Support</div>
              <p className="mt-2 text-sm text-white/70">
                If you received a damaged or incorrect item, contact the store as soon as possible.
              </p>
            </div>

            <div id="cancellation-policy" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Cancellation policy</div>
              <p className="mt-2 text-sm text-white/70">
                Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund may be provided, if applicable.
              </p>
            </div>

            <div id="terms" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Terms</div>
              <p className="mt-2 text-sm text-white/70">
                By placing an order, you agree to provide accurate contact and delivery details.
              </p>
            </div>

            <div id="privacy" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Privacy</div>
              <p className="mt-2 text-sm text-white/70">
                Your information is used only to fulfill your order and contact you about delivery.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <div>© {currentYear} {store.name}. All rights reserved.</div>
            <div>Powered by Store Generator</div>
          </div>
        </div>
      </footer>
    </motion.main>
  );
}
