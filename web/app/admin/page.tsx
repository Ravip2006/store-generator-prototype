"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

interface DashboardStats {
  stores: number;
  products: number;
  orders: number;
  customers: number;
}

export default function AdminDashboard() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

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
        const response = await fetch(`${apiBase}/admin/stats`);
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
  }, [apiBase]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-foreground/5">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-foreground/10 bg-white/80 dark:bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
              A
            </div>
            <span className="text-lg font-bold text-foreground">AdminPanel</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/admin/stores" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                Stores
              </Link>
              <Link href="/admin/products" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                Products
              </Link>
              <Link href="/admin/orders" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                Orders
              </Link>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Admin Header */}
        <AdminHeader
          title="Dashboard"
          description="Monitor your store operations and performance"
          icon="📊"
          action={{ label: "✨ Create Store", href: "/admin/create-store" }}
        />

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-gradient-to-br ${card.color} backdrop-blur-sm p-6 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-foreground/20`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/60">{card.title}</p>
                    <div className={`mt-2 text-4xl font-bold ${card.textColor}`}>
                      {loading ? "—" : card.value}
                    </div>
                  </div>
                  <div className="text-2xl">{card.icon}</div>
                </div>
                <p className="mt-4 text-xs text-foreground/50">{card.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Full Height */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Management Section */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-white dark:bg-background/50 backdrop-blur-sm p-8 shadow-sm">
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">⚡ Quick Management</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {menuItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-foreground/10 bg-gradient-to-br from-slate-50 to-white dark:from-foreground/5 dark:to-background p-4 transition-all hover:border-slate-300 dark:hover:border-foreground/20 hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-xs text-foreground/60 mt-1">{item.description}</p>
                      </div>
                      <div className="text-foreground/30 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Platform Features */}
              <div className="rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-white dark:bg-background/50 backdrop-blur-sm p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  <span>⚡</span> Features
                </h3>
                <ul className="space-y-2 text-xs text-foreground/70">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Multi-store management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Product discounts & pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Order tracking & analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Customer insights & data</span>
                  </li>
                </ul>
              </div>

              {/* API Integration */}
              <div className="rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-white dark:bg-background/50 backdrop-blur-sm p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  <span>🔌</span> API
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Header</p>
                    <code className="rounded bg-foreground/10 px-2 py-1 block font-mono text-xs">
                      x-tenant-id: store-slug
                    </code>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Endpoints</p>
                    <code className="rounded bg-foreground/10 px-2 py-0.5 block font-mono text-xs mb-1">
                      GET /api/products
                    </code>
                    <code className="rounded bg-foreground/10 px-2 py-0.5 block font-mono text-xs">
                      PATCH /api/products/:id
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sticky top-24 self-start space-y-6">
            {/* Quick Links */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-white dark:bg-background/50 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">🧭 Navigation</h3>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-slate-100 dark:hover:bg-foreground/10 hover:text-foreground"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-bold text-foreground hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent transition-all">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-foreground/10 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-600/20 dark:to-emerald-600/5 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                <span className="text-lg font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">✅ System Status</span>
              </div>
              <p className="text-xs text-foreground/70">All systems operational</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
