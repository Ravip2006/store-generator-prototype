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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
              S
            </div>
            <span className="text-lg font-bold text-foreground">Store Generator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={previewHref} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Storefront
            </Link>
            <Link href="/admin" className="text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 hover:shadow-lg transition-shadow">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                Multi-Tenant Store Platform
              </h1>
              <p className="text-xl text-foreground/70">
                Build, manage, and scale multiple online grocery stores with a unified admin panel. Beautiful storefronts, powerful inventory management, and seamless order processing.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/admin" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-shadow">
                Go to Admin Panel
              </Link>
              <Link href={previewHref} className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-6 py-3 font-semibold hover:bg-foreground/5 transition-colors">
                View Storefront
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-6">
              <div className="rounded-lg bg-white dark:bg-background/50 p-4 border border-foreground/10">
                <div className="text-2xl mb-2">🏬</div>
                <h3 className="font-semibold text-sm">Multi-Tenant</h3>
                <p className="text-xs text-foreground/60 mt-1">Manage multiple stores with separate inventories</p>
              </div>
              <div className="rounded-lg bg-white dark:bg-background/50 p-4 border border-foreground/10">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="font-semibold text-sm">Inventory</h3>
                <p className="text-xs text-foreground/60 mt-1">Real-time stock management and discounts</p>
              </div>
              <div className="rounded-lg bg-white dark:bg-background/50 p-4 border border-foreground/10">
                <div className="text-2xl mb-2">🛒</div>
                <h3 className="font-semibold text-sm">Checkout</h3>
                <p className="text-xs text-foreground/60 mt-1">Cart management and order processing</p>
              </div>
              <div className="rounded-lg bg-white dark:bg-background/50 p-4 border border-foreground/10">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-sm">Analytics</h3>
                <p className="text-xs text-foreground/60 mt-1">Store metrics and business insights</p>
              </div>
            </div>
          </div>

          {/* Right: Image + Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-foreground/10 overflow-hidden shadow-lg">
              <img src="/dashboardpage.png" alt="Admin Dashboard" className="w-full h-auto" />
            </div>
            <div className="rounded-lg bg-white dark:bg-background/50 p-4 border border-foreground/10 backdrop-blur">
              <p className="text-sm text-foreground/70">
                <span className="font-semibold text-foreground">Powerful Admin Dashboard</span> - Manage stores, products, orders, customers, and categories all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Store Preview Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border border-foreground/10 bg-white dark:bg-background/50 p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Try a Store</h2>
              <p className="text-foreground/70 mt-2">Enter any store slug to preview the storefront experience</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground/70">Store Slug</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. green-mart"
                    className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
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
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-shadow"
              >
                Open Store →
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-600/30">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <span className="font-semibold">Example stores:</span> Try "green-mart", "sydney-spice", or create your own in the admin panel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="border-t border-foreground/10 pt-8 text-center text-sm text-foreground/60">
          <p>Store Generator Prototype © 2026 • Built with Next.js & Prisma</p>
        </div>
      </section>
    </main>
  );
}
