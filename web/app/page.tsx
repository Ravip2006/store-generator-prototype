"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function HomePage() {
  const [slug, setSlug] = useState("green-mart");

  const previewHref = useMemo(() => {
    const clean = slug.trim().toLowerCase();
    return clean ? `/s/${encodeURIComponent(clean)}` : "/";
  }, [slug]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-foreground/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-foreground/10 bg-white/80 dark:bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg">
              S
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">Store Generator</span>
              <p className="text-xs text-foreground/50">Multi-Tenant Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href={previewHref} className="text-sm text-foreground/60 hover:text-foreground transition-colors font-medium">
              Storefront
            </Link>
            <Link href="/admin" className="text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 hover:shadow-lg transition-shadow hover:scale-105 transform">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Gradient Background */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>

        <div className="relative grid gap-16 lg:grid-cols-2 lg:items-center z-10">
          {/* Left: Content */}
          <div className="space-y-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-600/50 px-4 py-2">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">🚀 New in 2026</span>
            </div>

            {/* Main Heading with Gradient */}
            <div className="space-y-6">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Build Amazing
                </span>
                <br />
                <span className="text-foreground">Multi-Store Platforms</span>
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed max-w-xl">
                Launch beautiful online grocery stores instantly. Manage inventory, pricing, orders, and customers across multiple storefronts with one powerful admin dashboard. No coding required.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 font-bold hover:shadow-2xl transition-all hover:scale-105 transform">
                <span>🚀 Launch Admin</span>
              </Link>
              <Link href={previewHref} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-background px-8 py-4 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-background/80 transition-all">
                <span>👁️ Preview Store</span>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <p className="text-3xl font-bold text-foreground">∞</p>
                <p className="text-sm text-foreground/60">Stores</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">⚡</p>
                <p className="text-sm text-foreground/60">Instant Setup</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">🎯</p>
                <p className="text-sm text-foreground/60">Full Control</p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-8">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-600/20 dark:to-blue-600/10 p-5 border border-blue-200 dark:border-blue-600/30 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🏬</div>
                <h3 className="font-bold text-sm text-foreground">Multi-Tenant</h3>
                <p className="text-xs text-foreground/60 mt-2">Run multiple stores with separate inventories and branding</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-600/20 dark:to-purple-600/10 p-5 border border-purple-200 dark:border-purple-600/30 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📦</div>
                <h3 className="font-bold text-sm text-foreground">Smart Inventory</h3>
                <p className="text-xs text-foreground/60 mt-2">Real-time stock tracking, pricing, and automatic discounts</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-50/50 dark:from-pink-600/20 dark:to-pink-600/10 p-5 border border-pink-200 dark:border-pink-600/30 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🛒</div>
                <h3 className="font-bold text-sm text-foreground">Easy Checkout</h3>
                <p className="text-xs text-foreground/60 mt-2">Smooth cart experience and instant order confirmation</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-600/20 dark:to-green-600/10 p-5 border border-green-200 dark:border-green-600/30 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold text-sm text-foreground">Live Analytics</h3>
                <p className="text-xs text-foreground/60 mt-2">Track sales, customers, and performance metrics</p>
              </div>
            </div>
          </div>

          {/* Right: Image + Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-600/50 overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow">
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-background dark:to-background/80 p-2">
                <img src="/dashboardpage.png" alt="Admin Dashboard" className="w-full h-auto rounded-xl" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-start p-4">
                  <p className="text-white text-sm font-semibold">🎯 Powerful admin dashboard included</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-600/20 dark:to-purple-600/20 p-5 border border-blue-200 dark:border-blue-600/30">
              <div className="flex gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Centralized Control</p>
                  <p className="text-xs text-foreground/70 mt-1">Manage all stores, products, orders, and customers from one intuitive dashboard. Set discounts, track inventory, and monitor sales in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Preview Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border-2 border-gradient bg-gradient-to-br from-white to-slate-50 dark:from-background dark:to-background/80 p-10 shadow-xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Try a Store</h2>
              <p className="text-lg text-foreground/70 mt-3">Enter any store slug below to see a live storefront demo</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-bold text-foreground/70 mb-2 block">Store Slug</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. green-mart"
                    className="w-full rounded-xl border-2 border-blue-200 dark:border-blue-600/30 bg-white dark:bg-background/50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:shadow-lg transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        window.location.href = previewHref;
                      }
                    }}
                  />
                </label>
              </div>
              <Link
                href={previewHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 font-bold hover:shadow-2xl transition-all hover:scale-105 transform"
              >
                🚀 Open Store
              </Link>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-600/20 dark:to-blue-600/10 border-2 border-blue-200 dark:border-blue-600/30">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <span className="font-bold">📌 Try these demos:</span> "green-mart", "sydney-spice" or create your own from admin
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="border-t border-foreground/10 pt-8">
          <div className="grid grid-cols-3 gap-8 mb-8 text-center">
            <div>
              <p className="text-2xl font-black text-foreground">🚀</p>
              <p className="text-xs text-foreground/60 mt-2">Deploy in minutes</p>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">🔒</p>
              <p className="text-xs text-foreground/60 mt-2">Enterprise security</p>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">🌍</p>
              <p className="text-xs text-foreground/60 mt-2">Global scale ready</p>
            </div>
          </div>
          <div className="text-center text-sm text-foreground/60">
            <p>Store Generator Platform © 2026 • Built with Next.js, Prisma & Tailwind CSS</p>
            <p className="mt-2 text-xs text-foreground/40">Multi-tenant ecommerce infrastructure for modern retailers</p>
          </div>
        </div>
      </section>
    </main>
  );
}
