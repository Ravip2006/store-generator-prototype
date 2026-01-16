"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AdminHeader from "@/components/AdminHeader";

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

interface DashboardStats {
  stores: number;
  products: number;
  orders: number;
  customers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    stores: 0,
    products: 0,
    orders: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.orders,
      icon: "📋",
      color: "from-blue-600/20 to-blue-600/5",
      textColor: "text-blue-600",
      trend: "+12% from last month",
    },
    {
      title: "Total Products",
      value: stats.products,
      icon: "📦",
      color: "from-purple-600/20 to-purple-600/5",
      textColor: "text-purple-600",
      trend: "+8% from last month",
    },
    {
      title: "Total Customers",
      value: stats.customers,
      icon: "👥",
      color: "from-green-600/20 to-green-600/5",
      textColor: "text-green-600",
      trend: "+5% from last month",
    },
    {
      title: "Active Stores",
      value: stats.stores,
      icon: "🏬",
      color: "from-orange-600/20 to-orange-600/5",
      textColor: "text-orange-600",
      trend: "+2 new stores",
    },
  ];

  const menuItems = [
    {
      title: "Stores",
      href: "/admin/stores",
      icon: "🏬",
      description: "Manage all stores",
    },
    {
      title: "Create Store",
      href: "/admin/create-store",
      icon: "✨",
      description: "New store",
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: "📦",
      description: "Manage inventory",
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: "📋",
      description: "View orders",
    },
    {
      title: "Customers",
      href: "/admin/customers",
      icon: "👥",
      description: "Customer data",
    },
    {
      title: "Categories",
      href: "/admin/categories",
      icon: "🏷️",
      description: "Manage categories",
    },
    {
      title: "Add Product",
      href: "/admin/add-product",
      icon: "➕",
      description: "Create new",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)]"
    >
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/30 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 text-white text-sm font-semibold">
              SG
            </div>
            <span className="text-sm font-semibold tracking-tight text-white/80">Admin Console</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              {[
                { href: "/", label: "Home" },
                { href: "/admin/stores", label: "Stores" },
                { href: "/admin/products", label: "Products" },
                { href: "/admin/orders", label: "Orders" },
              ].map((item) => (
                <motion.div key={item.href} whileHover={{ y: -2 }} transition={spring}>
                  <Link
                    href={item.href}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white text-xs font-semibold">
              A
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Admin Header */}
        <AdminHeader
          title="Dashboard"
          description="Monitor your store operations and performance"
          icon="📊"
          action={{ label: "✨ Create Store", href: "/admin/create-store" }}
        />

        {/* Bento Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-7 lg:row-span-2 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-8 shadow-2xl shadow-blue-500/10"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/60">Midnight Ops</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Electric Control Plane</h2>
                <p className="mt-2 text-sm text-white/60 max-w-xl">
                  Monitor live store health, GMV, and fulfillment from a unified bento dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                Live
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {statCards.map((card) => (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -4 }}
                  transition={spring}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white/60">{card.title}</p>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {loading ? "—" : card.value}
                      </div>
                      <p className="mt-2 text-[11px] text-white/40">{card.trend}</p>
                    </div>
                    <div className="text-xl group-hover:scale-110 transition-transform">{card.icon}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-5 rounded-[28px] border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl p-6 shadow-xl shadow-purple-500/10"
          >
            <h3 className="text-lg font-semibold text-white">⚡ Quick Actions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {menuItems.slice(0, 4).map((item) => (
                <motion.div key={item.href} whileHover={{ y: -4 }} transition={spring}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-semibold text-white">{item.title}</span>
                    </span>
                    <span className="text-white/40 group-hover:text-emerald-200 transition-colors">→</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-4 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-xl shadow-cyan-500/10"
          >
            <h3 className="text-lg font-semibold text-white">🚀 Platform Features</h3>
            <ul className="mt-4 space-y-2 text-xs text-white/70">
              <li className="flex items-start gap-2"><span className="text-cyan-300">✓</span>Multi-store management</li>
              <li className="flex items-start gap-2"><span className="text-cyan-300">✓</span>Dynamic pricing rules</li>
              <li className="flex items-start gap-2"><span className="text-cyan-300">✓</span>Order telemetry</li>
              <li className="flex items-start gap-2"><span className="text-cyan-300">✓</span>Customer intelligence</li>
            </ul>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-4 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-xl shadow-indigo-500/10"
          >
            <h3 className="text-lg font-semibold text-white">🔌 API Status</h3>
            <div className="mt-4 space-y-2 text-xs text-white/70">
              <div>
                <p className="font-semibold text-white mb-1">Header</p>
                <code className="rounded bg-white/10 px-2 py-1 block font-mono text-xs">
                  x-tenant-id: store-slug
                </code>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Endpoints</p>
                <code className="rounded bg-white/10 px-2 py-0.5 block font-mono text-xs mb-1">
                  GET /api/products
                </code>
                <code className="rounded bg-white/10 px-2 py-0.5 block font-mono text-xs">
                  PATCH /api/products/:id
                </code>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-4 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-xl shadow-emerald-500/10"
          >
            <h3 className="text-lg font-semibold text-white">🧭 Navigation</h3>
            <div className="mt-4 space-y-2">
              {menuItems.map((item) => (
                <motion.div key={item.href} whileHover={{ x: 6 }} transition={spring}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="font-semibold text-white/80 group-hover:text-white transition-all">{item.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="lg:col-span-12 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-xl shadow-black/30"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-sm font-semibold text-white">System Status</span>
            </div>
            <p className="mt-2 text-xs text-white/60">All systems operational • 99.99% uptime • Edge latency 24ms</p>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
