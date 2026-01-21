"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import AdminHeader from "@/components/AdminHeader";

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

type Store = {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  themeColor?: string | null;
};

export default function StoreManagerPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    categories: 0,
  });

  const tenantHeader = useMemo(() => ({ "x-tenant-id": slug }), [slug]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [storeRes, productsRes, ordersRes, customersRes, categoriesRes] = await Promise.all([
          fetch("/api/backend/store", { headers: tenantHeader, cache: "no-store" }),
          fetch("/api/backend/products", { headers: tenantHeader, cache: "no-store" }),
          fetch("/api/backend/orders", { headers: tenantHeader, cache: "no-store" }),
          fetch("/api/backend/customers", { headers: tenantHeader, cache: "no-store" }),
          fetch("/api/backend/categories", { headers: tenantHeader, cache: "no-store" }),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json().catch(() => null);
          setStore(storeData || null);
        }

        const products = productsRes.ok ? await productsRes.json().catch(() => []) : [];
        const orders = ordersRes.ok ? await ordersRes.json().catch(() => []) : [];
        const customers = customersRes.ok ? await customersRes.json().catch(() => []) : [];
        const categories = categoriesRes.ok ? await categoriesRes.json().catch(() => []) : [];

        setCounts({
          products: Array.isArray(products) ? products.length : 0,
          orders: Array.isArray(orders) ? orders.length : 0,
          customers: Array.isArray(customers) ? customers.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load store data");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug, tenantHeader]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)]"
    >
      <AdminHeader
        title={store?.name ? `${store.name} Manager` : "Store Manager"}
        description="Manage a single store’s catalog, orders, and customers"
        icon="🏬"
        breadcrumbs={[{ label: "Stores", href: "/admin/stores" }, { label: slug || "Store" }]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-black/40 text-white">
          {error ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              <b>Error:</b> {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="label-metadata text-white/60">Store details</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {store?.name || (loading ? "Loading..." : "Store")}
                  </h2>
                  <p className="mt-1 text-sm text-white/60">Slug: {slug || "—"}</p>
                  {store?.phone ? (
                    <p className="mt-1 text-sm text-white/60">Phone: {store.phone}</p>
                  ) : null}
                </div>
                <Link
                  href={`/s/${encodeURIComponent(slug)}`}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  View Storefront
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="label-metadata text-white/60">Quick actions</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Products", href: "/admin/products", icon: "📦" },
                  { label: "Add Product", href: "/admin/add-product", icon: "➕" },
                  { label: "Orders", href: "/admin/orders", icon: "📋" },
                  { label: "Customers", href: "/admin/customers", icon: "👥" },
                  { label: "Categories", href: "/admin/categories", icon: "🏷️" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-white/50">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="label-metadata text-white/60">Store metrics</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Products", value: counts.products },
                  { label: "Orders", value: counts.orders },
                  { label: "Customers", value: counts.customers },
                  { label: "Categories", value: counts.categories },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{loading ? "—" : item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
