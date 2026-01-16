"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { name: string };
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  deliverySlot?: string | null;
  country?: string | null;
  items: OrderItem[];
};

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

export default function PayPageClient({ slug, id }: { slug: string; id: string }) {
  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);
  const orderId = useMemo(() => String(id || "").trim(), [id]);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cartStorageKey(currentTenant: string) {
    return `storegen:cart:${currentTenant}`;
  }

  function lastOrderStorageKey(currentTenant: string) {
    return `storegen:lastOrderId:${currentTenant}`;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/backend/orders/${encodeURIComponent(orderId)}`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as Order | null;
        if (!cancelled) {
          setOrder(res.ok ? data : null);
          if (!res.ok) {
            const maybeError =
              data && typeof data === "object" && "error" in (data as Record<string, unknown>)
                ? (data as Record<string, unknown>).error
                : null;
            setError(typeof maybeError === "string" ? maybeError : `Failed to load order (${res.status})`);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant, orderId]);

  async function onConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/backend/orders/${encodeURIComponent(orderId)}/confirm`, {
        method: "POST",
        headers: { "x-tenant-id": tenant },
      });
      const data = (await res.json().catch(() => ({}))) as unknown;
      const dataRecord =
        data && typeof data === "object" ? (data as Record<string, unknown>) : ({} as Record<string, unknown>);
      if (!res.ok) {
        setError(
          (typeof dataRecord.error === "string" ? dataRecord.error : null) ||
            `Confirm failed (${res.status})`
        );
        return;
      }

      try {
        localStorage.removeItem(cartStorageKey(tenant));
      } catch {
        // ignore
      }

      try {
        if (orderId) localStorage.setItem(lastOrderStorageKey(tenant), orderId);
      } catch {
        // ignore
      }

      router.push(`/s/${encodeURIComponent(tenant)}/order/${encodeURIComponent(orderId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  }

  async function onCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/backend/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
        headers: { "x-tenant-id": tenant },
      });
      const data = (await res.json().catch(() => ({}))) as unknown;
      const dataRecord =
        data && typeof data === "object" ? (data as Record<string, unknown>) : ({} as Record<string, unknown>);
      if (!res.ok) {
        setError(
          (typeof dataRecord.error === "string" ? dataRecord.error : null) ||
            `Cancel failed (${res.status})`
        );
        return;
      }

      router.push(`/s/${encodeURIComponent(tenant)}/cart`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Order Confirmation</h1>
            <p className="mt-2 text-sm font-medium text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                Ready to complete your order?
              </span>
            </p>
            <p className="mt-2 text-xs text-white/60">
              Confirm to finalize | Cancel to save your items
            </p>
          </div>
          <Link
            href={`/s/${encodeURIComponent(tenant)}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Back to store
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            <b>Error:</b> {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-white/70">Loading order...</p>
        ) : !order ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 backdrop-blur-xl">
            <p className="text-sm text-white/70">Order not found.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <section className="lg:col-span-8 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-semibold text-white">Order {order.id}</div>
                    <div className="mt-1 text-xs text-white/60">Status: {order.status}</div>
                    {order.deliverySlot ? (
                      <div className="mt-1 text-xs text-white/60">Delivery: {order.deliverySlot}</div>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-white">{formatPrice(order.total, getCurrencyForCountry(order.country || "AU"))}</div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-white/10 text-white/80">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr
                        key={it.id}
                        className="border-t border-white/10 text-white/80 transition-colors hover:bg-white/5"
                      >
                        <td className="px-4 py-3">{it.product?.name || it.productId}</td>
                        <td className="px-4 py-3">{it.quantity}</td>
                        <td className="px-4 py-3">{formatPrice(it.unitPrice, getCurrencyForCountry(order.country || "AU"))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Order summary</div>
                    <div className="mt-1 text-xs text-white/60">
                      {order.items.reduce((s, it) => s + it.quantity, 0)} item
                      {order.items.reduce((s, it) => s + it.quantity, 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white">{formatPrice(order.total, getCurrencyForCountry(order.country || "AU"))}</div>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={confirming || cancelling || order.status !== "PENDING_PAYMENT"}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                  >
                    {confirming ? "Paying..." : `Pay ${formatPrice(order.total, getCurrencyForCountry(order.country || "AU"))}`}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={confirming || cancelling || order.status !== "PENDING_PAYMENT"}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5 disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">Total</div>
                  <div className="mt-1 text-lg font-semibold">₹{order.total}</div>
                  <div className="mt-1 text-xs text-foreground/60">This is a simulated payment step.</div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </motion.main>
  );
}
