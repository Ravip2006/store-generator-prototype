"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { name: string };
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  const [slug, setSlug] = useState("green-mart");

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("IN");

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/orders`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setOrders([]);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      const ordersList = Array.isArray(data) ? data : [];
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = orders.filter((order) =>
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(query.toLowerCase()) ||
      order.customerPhone?.toLowerCase().includes(query.toLowerCase()) ||
      order.city?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const cleanProductId = productId.trim();
    const qty = Number(quantity);

    if (!tenant || !cleanProductId || !Number.isInteger(qty) || qty <= 0) {
      setCreating(false);
      setError("Enter store slug, productId, and a positive integer quantity.");
      return;
    }

    const payload = {
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      addressLine1: addressLine1.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country: country.trim() || undefined,
      items: [{ productId: cleanProductId, quantity: qty }],
    };

    try {
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setProductId("");
      setQuantity("1");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Orders"
        description="Create and manage customer orders"
        icon="📋"
        breadcrumbs={[{ label: "Orders" }]}
        onSearch={handleSearch}
        showSearch={true}
      />

      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">

          <form onSubmit={onCreate} className="mt-6 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Store slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. green-mart"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Product ID</span>
                <input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Paste a productId from /products"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-mono outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Quantity</span>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                  inputMode="numeric"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Customer name (optional)</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Customer phone (optional)</span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Address line 1 (optional)</span>
              <input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">City</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Postal code</span>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Country</span>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create order"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              <b>Error:</b> {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">📋 Order list</h2>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No orders yet.</p>
          ) : filteredOrders.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No orders match your search.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="border-t border-foreground/10 align-top">
                      <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{o.customerName || "—"}</div>
                        <div className="text-xs text-foreground/70">{o.customerPhone || ""}</div>
                      </td>
                      <td className="px-4 py-3">₹{o.total}</td>
                      <td className="px-4 py-3">{o.status}</td>
                      <td className="px-4 py-3">
                        <div className="grid gap-1">
                          {o.items?.map((it) => (
                            <div key={it.id} className="text-xs">
                              {it.product?.name || it.productId} × {it.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground/70">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
