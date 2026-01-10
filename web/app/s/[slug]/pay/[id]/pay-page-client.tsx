"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  items: OrderItem[];
};

export default function PayPageClient({ slug, id }: { slug: string; id: string }) {
  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);
  const orderId = useMemo(() => String(id || "").trim(), [id]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
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
        const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}`, {
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
  }, [apiBase, tenant, orderId]);

  async function onConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}/confirm`, {
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
      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}/cancel`, {
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Confirm to place the order, or cancel to restore stock.
            </p>
          </div>
          <Link
            href={`/s/${encodeURIComponent(tenant)}`}
            className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            Back to store
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
            <b>Error:</b> {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-foreground/70">Loading order...</p>
        ) : !order ? (
          <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <p className="text-sm text-foreground/70">Order not found.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
              <div className="rounded-xl border border-foreground/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-semibold">Order {order.id}</div>
                    <div className="mt-1 text-xs text-foreground/60">Status: {order.status}</div>
                    {order.deliverySlot ? (
                      <div className="mt-1 text-xs text-foreground/60">Delivery: {order.deliverySlot}</div>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold">₹{order.total}</div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-foreground/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id} className="border-t border-foreground/10">
                        <td className="px-4 py-3">{it.product?.name || it.productId}</td>
                        <td className="px-4 py-3">{it.quantity}</td>
                        <td className="px-4 py-3">₹{it.unitPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Order summary</div>
                    <div className="mt-1 text-xs text-foreground/60">
                      {order.items.reduce((s, it) => s + it.quantity, 0)} item
                      {order.items.reduce((s, it) => s + it.quantity, 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">₹{order.total}</div>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={confirming || cancelling || order.status !== "PENDING_PAYMENT"}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm font-semibold hover:bg-foreground/10 disabled:opacity-60"
                  >
                    {confirming ? "Paying..." : `Pay ₹${order.total}`}
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
    </main>
  );
}
