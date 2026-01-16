"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { AuthModal } from "@/components/AuthModal";

type Product = {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number | null;
  discountPrice?: number | null;
  imageUrl?: string | null;
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

// Currency formatter based on currency code
function formatPrice(price: number, currency: string = "AUD"): string {
  const currencySymbols: Record<string, string> = {
    AUD: "$",
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€",
  };
  const symbol = currencySymbols[currency] || "$";
  return `${symbol}${price.toFixed(2)}`;
}

function getCurrencyForCountry(country: string): string {
  const countryToCurrency: Record<string, string> = {
    AU: "AUD",
    IN: "INR",
    US: "USD",
    GB: "GBP",
    EU: "EUR",
  };
  return countryToCurrency[country?.toUpperCase() || "AU"] || "AUD";
}

export default function CartPageClient({ slug }: { slug: string }) {
  const tenant = slug.trim().toLowerCase();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  type Store = { name?: string | null; phone?: string | null; themeColor?: string | null; currency?: string; country?: string };

  function cartStorageKey(currentTenant: string) {
    return `storegen:cart:${currentTenant}`;
  }

  function lastOrderStorageKey(currentTenant: string) {
    return `storegen:lastOrderId:${currentTenant}`;
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

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [loadingCart, setLoadingCart] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [deliverySlot, setDeliverySlot] = useState("Today 6-8pm");
  const [placing, setPlacing] = useState(false);
  const [placingWhatsApp, setPlacingWhatsApp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const accent = store?.themeColor || undefined;
  const storeName = store?.name || "Cart";
  const logoText = initialsFromName(storeName);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.quantity, 0),
    [cartLines]
  );
  const cartTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [cartLines]
  );

  const checkoutIssues = useMemo(() => {
    const issues: string[] = [];
    if (cartLines.length === 0) issues.push("Add at least 1 item");
    if (!customerName.trim()) issues.push("Enter your name");
    if (!customerPhone.trim()) issues.push("Enter your phone");
    if (!addressLine1.trim()) issues.push("Enter your address");
    if (!postalCode.trim()) issues.push("Enter postal code");
    if (!country) issues.push("Select country");
    return issues;
  }, [cartLines.length, customerName, customerPhone, addressLine1, postalCode, country]);

  const canProceedToPay = checkoutIssues.length === 0 && !placing && !placingWhatsApp;

  function whatsappPhone(): string | null {
    const raw = store?.phone || "";
    const digits = raw.replace(/[^0-9]/g, "");
    return digits ? digits : null;
  }

  function buildWhatsAppText(id?: string) {
    const lines: string[] = [];
    const currency = getCurrencyForCountry(country || "AU");
    lines.push(`New order${id ? ` ${id}` : ""}`);
    lines.push("");

    for (const l of cartLines) {
      lines.push(`${l.product.name} x ${l.quantity} (${formatPrice(l.product.price, currency)})`);
    }

    lines.push("");
    lines.push(`Total: ${formatPrice(cartTotal, currency)}`);
    if (deliverySlot.trim()) lines.push(`Delivery slot: ${deliverySlot.trim()}`);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = addressLine1.trim();
    if (cleanName) lines.push(`Name: ${cleanName}`);
    if (cleanPhone) lines.push(`Phone: ${cleanPhone}`);
    if (cleanAddress) lines.push(`Address: ${cleanAddress}`);
    const tail = [city.trim(), postalCode.trim(), country?.trim()].filter(Boolean).join(", ");
    if (tail) lines.push(tail);

    return lines.join("\n");
  }

  function whatsappHref(id?: string): string | null {
    const phone = whatsappPhone();
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppText(id))}`;
  }

  function persist(nextCart: Record<string, CartLine>) {
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(nextCart));
    } catch {
      // ignore
    }
  }

  function clearCart() {
    setCart({});
    try {
      localStorage.removeItem(cartStorageKey(tenant));
    } catch {
      // ignore
    }
  }

  function addOne(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const next = { ...prev, [productId]: { ...existing, quantity: existing.quantity + 1 } };
      persist(next);
      return next;
    });
  }

  function removeOne(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      let next: Record<string, CartLine>;
      if (nextQty <= 0) {
        next = { ...prev };
        delete next[productId];
      } else {
        next = { ...prev, [productId]: { ...existing, quantity: nextQty } };
      }
      persist(next);
      return next;
    });
  }

  useEffect(() => {
    setLoadingCart(true);
    setError(null);

    try {
      const primaryKey = cartStorageKey(tenant);
      const legacyKey = legacyCartStorageKey(tenant);

      console.log(`[CartPage] Initial load: checking for cart key="${primaryKey}"`);
      const primaryRaw = localStorage.getItem(primaryKey);
      const legacyRaw = primaryRaw ? null : localStorage.getItem(legacyKey);

      const raw = primaryRaw ?? legacyRaw;
      console.log(`[CartPage] Initial load: found data=${!!raw}`);
      if (raw) {
        console.log(`[CartPage] Initial load: raw data=`, raw);
      }
      
      if (!raw) {
        console.log(`[CartPage] Initial load: no cart data found, setting empty`);
        setCart({});
        setLoadingCart(false);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = coerceCartRecord(parsed);
      console.log(`[CartPage] Initial load: loaded cart with ${Object.keys(normalized).length} items`);
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
    } catch (e) {
      console.error(`[CartPage] Initial load error:`, e);
      setCart({});
    } finally {
      setLoadingCart(false);
    }
  }, [tenant]);

  // Load store details (for WhatsApp phone)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/backend/store`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as Store | null;
        if (!cancelled) setStore(res.ok ? data : null);
      } catch {
        if (!cancelled) setStore(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  useEffect(() => {
    if (store?.country && !country) {
      setCountry(store.country);
    }
  }, [store?.country, country]);

  // Auto-fill user data when authenticated
  useEffect(() => {
    if (user && !authLoading) {
      if (user.name && !customerName) {
        setCustomerName(user.name);
      }
      if (user.phone && !customerPhone) {
        setCustomerPhone(user.phone);
      }
    }
  }, [user, authLoading, customerName, customerPhone]);

  // Persist cart to localStorage whenever it changes (but not during initial load)
  useEffect(() => {
    if (loadingCart) {
      return;
    }
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [tenant, cart, loadingCart]);

  async function placeOrder(sendOnWhatsApp: boolean) {
    setError(null);

    if (cartLines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = addressLine1.trim();

    if (!cleanName || !cleanPhone || !cleanAddress) {
      setError("Please enter name, phone, and address.");
      return;
    }

    if (sendOnWhatsApp) setPlacingWhatsApp(true);
    else setPlacing(true);

    try {
      const res = await fetch(`/api/backend/orders`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({
          intent: sendOnWhatsApp ? "confirm" : "reserve",
          customerName: cleanName,
          customerPhone: cleanPhone,
          addressLine1: cleanAddress,
          city: city.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          country: country?.trim() || undefined,
          deliverySlot: deliverySlot.trim() || undefined,
          items: cartLines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Checkout failed (${res.status})`);
        return;
      }

      const orderId = String(data?.id || "");

      try {
        if (orderId) localStorage.setItem(lastOrderStorageKey(tenant), orderId);
      } catch {
        // ignore
      }

      if (sendOnWhatsApp) {
        clearCart();
        const href = whatsappHref(orderId);
        if (href) {
          try {
            window.open(href, "_blank", "noopener,noreferrer");
          } catch {
            // ignore
          }
        }
        router.push(`/s/${encodeURIComponent(tenant)}/order/${encodeURIComponent(orderId)}`);
        return;
      }

      // Stock is now reserved; only clear cart after payment confirm.
      router.push(`/s/${encodeURIComponent(tenant)}/pay/${encodeURIComponent(orderId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPlacing(false);
      setPlacingWhatsApp(false);
    }
  }

  const directWhatsAppHref = whatsappHref();

  return (
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xs font-bold tracking-tight shadow-sm"
                style={{ backgroundColor: accent }}
              >
                <span className="text-white">{logoText}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">{storeName}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-white/60">
                  {user ? (
                    <span className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                      ✅ Welcome, {user.name || user.email}!
                    </span>
                  ) : (
                    <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                      🛒 Shopping Cart
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/30 border border-white/20">
              <span>✨</span>
              <span>{cartItemCount}</span>
              <span className="text-white/90">{cartItemCount === 1 ? "item" : "items"}</span>
            </span>
            <button
              type="button"
              onClick={() => router.push(`/s/${encodeURIComponent(tenant)}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Checkout</p>
              <h2 className="text-2xl font-semibold tracking-tight">Your trolley</h2>
              <p className="mt-1 text-sm text-foreground/70">Review items, then add delivery details.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/50 bg-red-50/50 p-4 text-sm text-red-700">
                <b>Error:</b> {error}
              </div>
            )}

            {loadingCart ? (
              <p className="mt-6 text-sm text-foreground/80">Loading…</p>
            ) : cartLines.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                <div className="text-sm font-semibold">Your cart is empty</div>
                <p className="mt-1 text-sm text-foreground/70">Go back and add a few products.</p>
                <Link
                  href={`/s/${encodeURIComponent(tenant)}`}
                  className="mt-3 inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-medium hover:bg-foreground/5"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-2">
                  {cartLines.map((l) => (
                    <div
                      key={l.product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-background p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-20 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5">
                          {l.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={l.product.imageUrl}
                              alt={l.product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{l.product.name}</div>
                          {typeof l.product.regularPrice === "number" && l.product.regularPrice !== l.product.price ? (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="text-sm font-semibold text-green-600">{formatPrice(l.product.price, getCurrencyForCountry(country || "AU"))}</div>
                              {typeof l.product.discountPercent === "number" && l.product.discountPercent > 0 ? (
                                <span className="text-xs font-semibold text-red-600">{l.product.discountPercent.toFixed(0)}% OFF</span>
                              ) : null}
                              <span className="text-xs text-foreground/60 line-through">{formatPrice(l.product.regularPrice, getCurrencyForCountry(country || "AU"))}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-foreground/70">
                              {formatPrice(l.product.price, getCurrencyForCountry(country || "AU"))} each
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeOne(l.product.id)}
                          className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                          style={accent ? { borderColor: accent, color: accent } : undefined}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{l.quantity}</span>
                        <button
                          type="button"
                          onClick={() => addOne(l.product.id)}
                          className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm font-semibold hover:bg-foreground/5"
                          style={accent ? { borderColor: accent, color: accent } : undefined}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-foreground/10 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">Delivery details</h3>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
                    >
                      Clear trolley
                    </button>
                  </div>

                  {!authLoading ? (
                    user ? (
                      <div className="mt-3 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm">
                        ✅ You’re logged in as <span className="font-semibold">{user.name || user.email}</span>. We’ll use your details to speed up checkout.
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm">
                        <div className="font-semibold">Check out faster</div>
                        <div className="mt-1 text-foreground/70">Log in to save your details and track orders (optional).</div>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setShowAuthModal(true)}
                            className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold hover:bg-foreground/5"
                            style={accent ? { borderColor: accent, color: accent } : undefined}
                          >
                            Log in / Sign up
                          </button>
                        </div>
                      </div>
                    )
                  ) : null}

                  <div className="mt-3 grid max-w-xl gap-2">
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                    />
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                    />
                    <input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Address"
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      />
                      <input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Postal code (required)"
                        required
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={country || ""}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      >
                        <option value="">Select country</option>
                        <option value="AU">🇦🇺 Australia</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="GB">🇬🇧 United Kingdom</option>
                      </select>
                      <input
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        placeholder="Delivery slot"
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      />
                    </div>
                    {checkoutIssues.length > 0 ? (
                      <p className="text-xs text-foreground/60">
                        To continue: {checkoutIssues.join(" • ")}
                      </p>
                    ) : (
                      <p className="text-xs text-foreground/60">We’ll reserve stock, then take you to payment.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/40 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Order summary</div>
                  <div className="mt-1 text-xs text-foreground/60">
                    {cartItemCount} item{cartItemCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatPrice(cartTotal, getCurrencyForCountry(country || "AU"))}</div>
              </div>

              {cartLines.length > 1 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                    Items
                  </div>
                  <div className="mt-2 grid gap-2">
                    {cartLines.slice(0, 6).map((l) => (
                      <div key={l.product.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{l.product.name}</div>
                          <div className="text-xs text-foreground/60">Qty {l.quantity}</div>
                        </div>
                        <div className="shrink-0 text-sm font-semibold">{formatPrice(l.product.price * l.quantity, getCurrencyForCountry(country || "AU"))}</div>
                      </div>
                    ))}
                    {cartLines.length > 6 ? (
                      <div className="text-xs text-foreground/60">
                        +{cartLines.length - 6} more item{cartLines.length - 6 === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => placeOrder(false)}
                  disabled={!canProceedToPay}
                  className="inline-flex items-center justify-center rounded-xl border border-foreground/15 px-4 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                  style={accent ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {placing ? "Reserving..." : "Proceed to pay"}
                </button>

                <button
                  type="button"
                  onClick={() => placeOrder(true)}
                  disabled={placing || placingWhatsApp || !directWhatsAppHref}
                  className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5 disabled:opacity-60"
                  style={accent ? { borderColor: accent, color: accent } : undefined}
                >
                  {placingWhatsApp ? "Placing & opening WhatsApp..." : "Place order & WhatsApp"}
                </button>

                {directWhatsAppHref ? (
                  <a
                    href={directWhatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium underline underline-offset-4 hover:text-foreground/80"
                  >
                    Or just send this trolley on WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-foreground/60">WhatsApp is unavailable (store phone not set).</p>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">Summary</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground/70">Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(cartLines.reduce((sum, l) => {
                        const regularPrice = typeof l.product.regularPrice === "number" ? l.product.regularPrice : l.product.price;
                        return sum + (regularPrice * l.quantity);
                      }, 0), getCurrencyForCountry(country || "AU"))}
                    </span>
                  </div>
                  {(() => {
                    const totalSavings = cartLines.reduce((sum, l) => {
                      const regularPrice = typeof l.product.regularPrice === "number" ? l.product.regularPrice : l.product.price;
                      return sum + ((regularPrice - l.product.price) * l.quantity);
                    }, 0);
                    return totalSavings > 0 ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-foreground/70">Discount</span>
                        <span className="font-semibold text-green-600">-{formatPrice(totalSavings, getCurrencyForCountry(country || "AU"))}</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground/70">Estimated delivery</span>
                    <span className="font-semibold">{formatPrice(0, getCurrencyForCountry(country || "AU"))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-base font-semibold">{formatPrice(cartTotal, getCurrencyForCountry(country || "AU"))}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-foreground/60">
                  Taxes included. Delivery slot subject to availability.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        tenant={tenant}
        initialMode="signin"
      />
    </motion.main>
  );
}
