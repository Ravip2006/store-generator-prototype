"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
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

export default function CartPageClient({ slug }: { slug: string }) {
  const tenant = slug.trim().toLowerCase();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
  const router = useRouter();

  type Store = { name?: string | null; phone?: string | null; themeColor?: string | null };

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
  const [country, setCountry] = useState("IN");
  const [deliverySlot, setDeliverySlot] = useState("Today 6-8pm");

  const [placing, setPlacing] = useState(false);
  const [placingWhatsApp, setPlacingWhatsApp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);

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
    return issues;
  }, [cartLines.length, customerName, customerPhone, addressLine1]);

  const canProceedToPay = checkoutIssues.length === 0 && !placing && !placingWhatsApp;

  function whatsappPhone(): string | null {
    const raw = store?.phone || "";
    const digits = raw.replace(/[^0-9]/g, "");
    return digits ? digits : null;
  }

  function buildWhatsAppText(id?: string) {
    const lines: string[] = [];
    lines.push(`New order${id ? ` ${id}` : ""}`);
    lines.push("");

    for (const l of cartLines) {
      lines.push(`${l.product.name} x ${l.quantity} (₹${l.product.price})`);
    }

    lines.push("");
    lines.push(`Total: ₹${cartTotal}`);
    if (deliverySlot.trim()) lines.push(`Delivery slot: ${deliverySlot.trim()}`);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = addressLine1.trim();
    if (cleanName) lines.push(`Name: ${cleanName}`);
    if (cleanPhone) lines.push(`Phone: ${cleanPhone}`);
    if (cleanAddress) lines.push(`Address: ${cleanAddress}`);
    const tail = [city.trim(), postalCode.trim(), country.trim()].filter(Boolean).join(", ");
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
    } finally {
      setLoadingCart(false);
    }
  }, [tenant]);

  // Load store details (for WhatsApp phone)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/store`, {
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
  }, [apiBase, tenant]);

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
      const res = await fetch(`${apiBase}/orders`, {
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
          country: country.trim() || undefined,
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
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 text-xs font-bold tracking-tight shadow-sm"
                style={{ backgroundColor: accent }}
              >
                <span className="text-background">{logoText}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold tracking-tight sm:text-xl">{storeName}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/60">
                  <TrolleyIcon className="h-3.5 w-3.5" />
                  <span>Cart</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs text-foreground/70">
              Items <span className="font-semibold">{cartItemCount}</span>
            </span>
            <Link
              href={`/s/${encodeURIComponent(tenant)}`}
              className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              Back
            </Link>
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
              <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
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
                          <div className="text-xs text-foreground/70">
                            ₹{l.product.price} each
                          </div>
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
                        placeholder="Postal code"
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30"
                      />
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
            <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Order summary</div>
                  <div className="mt-1 text-xs text-foreground/60">
                    {cartItemCount} item{cartItemCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-sm font-semibold">₹{cartTotal}</div>
              </div>

              {cartLines.length > 1 ? (
                <div className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
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
                        <div className="shrink-0 text-sm font-semibold">₹{l.product.price * l.quantity}</div>
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

              <div className="mt-5 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">Summary</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground/70">Subtotal</span>
                    <span className="font-semibold">₹{cartTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground/70">Estimated delivery</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-base font-semibold">₹{cartTotal}</span>
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
    </main>
  );
}
