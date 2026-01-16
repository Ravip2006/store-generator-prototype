"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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
  customerName?: string;
  customerPhone?: string;
  city?: string;
  deliverySlot?: string | null;
  items: OrderItem[];
};

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

export default function MyOrdersPageClient({ slug }: { slug: string }) {
  const tenant = slug.trim().toLowerCase();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/s/${encodeURIComponent(tenant)}`);
    }
  }, [authLoading, isAuthenticated, tenant, router]);

  // Load orders
  useEffect(() => {
    if (!user?.email || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/backend/customers/by-email/${encodeURIComponent(user.email)}/orders`,
          {
            headers: { "x-tenant-id": tenant },
            cache: "no-store",
          }
        );

        if (!cancelled) {
          const data = (await res.json().catch(() => null)) as Order[] | null;
          if (res.ok && Array.isArray(data)) {
            setOrders(data);
          } else {
            setError("Failed to load orders");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "An error occurred");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.email, isAuthenticated, tenant]);

  // Buy Again: Add all items from an order to the cart
  const buyAgain = (order: Order) => {
    const cartKey = `storegen:cart:${tenant}`;
    try {
      // Get current cart
      const currentCartJson = localStorage.getItem(cartKey);
      let cart: Record<string, any> = {};

      if (currentCartJson) {
        try {
          const parsed = JSON.parse(currentCartJson);
          if (parsed && typeof parsed === "object") {
            cart = parsed;
          }
        } catch {
          // Invalid JSON, start fresh
        }
      }

      // Add items from order to cart
      for (const item of order.items) {
        if (cart[item.productId]) {
          cart[item.productId].quantity += item.quantity;
        } else {
          cart[item.productId] = {
            product: {
              id: item.productId,
              name: item.product?.name || `Product ${item.productId.slice(0, 8)}`,
              price: item.unitPrice,
            },
            quantity: item.quantity,
          };
        }
      }

      // Save updated cart
      localStorage.setItem(cartKey, JSON.stringify(cart));

      // Redirect to cart
      router.push(`/s/${encodeURIComponent(tenant)}/cart`);
    } catch (e) {
      console.error("Failed to add items to cart:", e);
      setError("Failed to add items to cart. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <main
        style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
      >
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="mt-2 text-white/60">
              Welcome back, <span className="font-semibold">{user?.name || user?.email}</span>
            </p>
          </div>
          <Link
            href={`/s/${encodeURIComponent(tenant)}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            Back to store
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center">
            <p className="text-white/70">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center">
            <div className="mb-4 text-4xl">📦</div>
            <h3 className="text-lg font-semibold text-white">No orders yet</h3>
            <p className="mt-1 text-white/60">Start shopping to see your orders here.</p>
            <Link
              href={`/s/${encodeURIComponent(tenant)}`}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-6 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30"
            >
              Shop now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg shadow-black/40"
              >
                {/* Order header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Order #{order.id.slice(0, 8)}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                      <span
                        className="text-xs font-semibold text-white/80"
                        style={{
                          color:
                            order.status === "CONFIRMED"
                              ? "#059669"
                              : order.status === "DELIVERED"
                              ? "#0369a1"
                              : "#7c3aed",
                        }}
                      >
                        {order.status === "CONFIRMED"
                          ? "✓ Confirmed"
                          : order.status === "DELIVERED"
                          ? "✓ Delivered"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="mb-4 space-y-2 border-t border-white/10 pt-4">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-white/60">No items in this order</p>
                  ) : (
                    order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {item.product?.name || `Product ${item.productId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-white/60">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          ₹{(item.unitPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                  {order.items.length > 3 && (
                    <p className="text-xs text-white/60 pt-2">+{order.items.length - 3} more items</p>
                  )}
                </div>

                {/* Order details */}
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-xs font-semibold text-white/60 uppercase">Total</p>
                    <p className="mt-1 text-lg font-bold text-white">₹{order.total.toFixed(2)}</p>
                  </div>
                  {order.city && (
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase">Location</p>
                      <p className="mt-1 text-sm font-medium text-white">{order.city}</p>
                    </div>
                  )}
                  {order.deliverySlot && (
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase">Delivery Slot</p>
                      <p className="mt-1 text-sm font-medium text-white">{order.deliverySlot}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Link
                    href={`/s/${encodeURIComponent(tenant)}/order/${encodeURIComponent(order.id)}`}
                    className="flex-1 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    className="flex-1 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    onClick={() => buyAgain(order)}
                  >
                    🔄 Buy Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.main>
  );
}
