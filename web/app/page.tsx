"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const [slug, setSlug] = useState("green-mart");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  const previewHref = useMemo(() => {
    const clean = slug.trim().toLowerCase();
    return clean ? `/s/${encodeURIComponent(clean)}` : "/";
  }, [slug]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/40 to-emerald-50/30 dark:from-background dark:via-green-950/20 dark:to-emerald-950/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50">
        <div className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-green-100/70 via-emerald-50/60 to-white shadow-md shadow-emerald-500/10 dark:border-foreground/10 dark:from-green-950/30 dark:via-emerald-950/10 dark:to-background">
          <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-green-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white font-black text-lg shadow-lg hover:scale-110 transition-transform">
                S
              </div>
              <div className="min-w-0">
                <span className="block truncate text-lg font-black bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                  Store Generator
                </span>
                <p className="truncate text-xs text-foreground/60 font-semibold">Multi-Tenant Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={previewHref}
                className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-white/70 px-4 py-2 text-sm font-bold text-foreground/70 hover:bg-white transition-all dark:bg-foreground/5 dark:hover:bg-foreground/10"
              >
                Storefront
              </Link>

              <Link
                href="/admin"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 text-sm font-black text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/25 border border-white/20"
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                <span className="relative z-10">Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-32 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-teal-400 to-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-5 animate-pulse" style={{animationDelay: '2s'}}></div>

        <div
          className={`relative grid gap-16 lg:grid-cols-2 lg:items-center z-10 transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {/* Left: Content */}
          <div
            className={`space-y-8 transition-all duration-700 ease-out delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-600/20 dark:to-emerald-600/20 border border-emerald-300/40 dark:border-emerald-500/30 px-5 py-2.5 hover:shadow-lg transition-shadow">
              <span className="text-sm font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">⭐ Build with Confidence</span>
            </div>

            {/* Main Heading with Gradient */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
                  Launch Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
                  Multi-Store Platform
                </span>
              </h1>
              <p className="text-lg text-foreground/70 leading-relaxed max-w-xl font-medium">
                Power your ecommerce business with a modern, scalable multi-tenant platform. Manage unlimited stores, inventory, pricing, orders, and customers all from one intelligent dashboard. Launch instantly, scale effortlessly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-6">
              <Link href="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white px-8 py-4 font-bold hover:shadow-2xl hover:shadow-emerald-500/25 transition-all hover:scale-105 transform border border-white/20 backdrop-blur-sm">
                <span>🚀 Launch Admin Now</span>
              </Link>
              <Link href={previewHref} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 dark:border-emerald-400 bg-white dark:bg-background/50 px-8 py-4 font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-background/80 transition-all hover:shadow-lg">
                <span>👁️ See Demo Store</span>
              </Link>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Instant Deploy</p>
                  <p className="text-xs text-foreground/60">Minutes to production</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Enterprise Grade</p>
                  <p className="text-xs text-foreground/60">Secure & scalable</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Real-Time Insights</p>
                  <p className="text-xs text-foreground/60">Live analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Global Ready</p>
                  <p className="text-xs text-foreground/60">Multi-currency, multi-language</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature Cards */}
          <div
            className={`space-y-6 transition-all duration-700 ease-out delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            {/* Dashboard Image */}
            <div className="rounded-3xl border-2 border-emerald-300/40 dark:border-emerald-500/30 overflow-hidden shadow-3xl shadow-emerald-500/15 hover:shadow-emerald-500/30 transition-all hover:-translate-y-2">
              <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-background dark:to-background/80 p-2">
                <img 
                  src="/dashboardpage.png" 
                  alt="Admin Dashboard" 
                  className="w-full h-auto rounded-2xl object-cover"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-start p-6">
                  <p className="text-white text-lg font-bold drop-shadow-lg">✨ Professional Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-600/15 dark:to-green-600/10 p-8 border-2 border-emerald-200/60 dark:border-emerald-500/20 backdrop-blur-sm">
              <div className="flex gap-4">
                <span className="text-4xl flex-shrink-0">🎯</span>
                <div>
                  <p className="font-bold text-lg text-foreground mb-2">All-in-One Control Center</p>
                  <p className="text-sm text-foreground/70">Manage all stores, products, orders, and customers from one powerful dashboard. Real-time analytics, inventory tracking, dynamic pricing, and customer insights all in one place.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🏬', title: 'Multi-Tenant', desc: 'Multiple stores, one dashboard' },
            { icon: '📦', title: 'Smart Inventory', desc: 'Real-time stock tracking' },
            { icon: '🛒', title: 'Easy Checkout', desc: 'Smooth cart experience' },
            { icon: '📊', title: 'Live Analytics', desc: 'Track sales & metrics' },
          ].map((feature, i) => (
            <div key={i} className="group rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-600/15 dark:to-emerald-600/5 p-6 border border-emerald-200/60 dark:border-emerald-600/15 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="text-4xl mb-3 group-hover:scale-125 transition-transform">{feature.icon}</div>
              <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">Powerful Features Built In</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Everything you need to run a successful multi-store ecommerce business</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📊', title: 'Live Dashboard', desc: 'Real-time analytics, sales metrics, and customer insights' },
            { icon: '👥', title: 'Customer Management', desc: 'Track customers, orders, preferences, and loyalty' },
            { icon: '💰', title: 'Dynamic Pricing', desc: 'Discount management, bulk pricing, and seasonal offers' },
            { icon: '🎨', title: 'Brand Control', desc: 'Customize colors, logos, and store branding' },
            { icon: '🔄', title: 'Auto-Sync', desc: 'Automatic product syncing and inventory updates' },
            { icon: '🚀', title: 'Scale Ready', desc: 'Built for millions of products and transactions' },
          ].map((feature, i) => (
            <div key={i} className="group rounded-xl bg-gradient-to-br from-white to-slate-50/50 dark:from-background/50 dark:to-background/30 p-7 border border-emerald-200/40 dark:border-emerald-600/15 hover:shadow-xl hover:border-emerald-400/50 dark:hover:border-emerald-500/30 transition-all">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Store Preview Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border-2 border-emerald-200/40 bg-gradient-to-br from-white/80 via-green-50/40 to-emerald-50/30 dark:from-background/80 dark:via-green-950/20 dark:to-emerald-950/10 p-12 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-4">Explore Live Stores</h2>
              <p className="text-lg text-foreground/70 max-w-2xl">Enter any store slug below to see a fully functional storefront demo</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-bold text-foreground/70 mb-3 block">Store Slug</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. green-mart or sydney-spice"
                    className="w-full rounded-xl border-2 border-emerald-300/50 dark:border-emerald-600/30 bg-white dark:bg-background/50 px-5 py-3.5 text-sm font-medium outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-500/20 transition-all"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3.5 font-bold hover:shadow-2xl hover:shadow-emerald-500/25 transition-all hover:scale-105 transform border border-white/20"
              >
                🚀 Open Store
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-600/15 dark:to-emerald-600/10 border-2 border-emerald-300/40 dark:border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <span className="block mb-2">📌 Demo Stores Available:</span>
                <span className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">Try "green-mart" • "sydney-spice" • or create your own</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { number: '∞', label: 'Stores Supported', desc: 'Scale to any size' },
            { number: '⚡', label: 'Instant Setup', desc: 'Minutes to launch' },
            { number: '🔒', label: 'Enterprise Secure', desc: 'Bank-level security' },
            { number: '🌍', label: 'Global Ready', desc: 'Multi-currency support' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-emerald-600/10 dark:to-green-600/10 border border-emerald-200/30 dark:border-emerald-600/15">
              <p className="text-5xl font-black mb-3">{stat.number}</p>
              <p className="font-bold text-foreground mb-2">{stat.label}</p>
              <p className="text-sm text-foreground/60">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-emerald-200/30 dark:border-emerald-600/20">
        <div className="grid grid-cols-3 gap-8 mb-12 text-center">
          <div className="group">
            <p className="text-5xl font-black mb-3 group-hover:scale-110 transition-transform">🚀</p>
            <p className="font-bold text-foreground mb-1">Fast Deploy</p>
            <p className="text-sm text-foreground/60">Go live in minutes</p>
          </div>
          <div className="group">
            <p className="text-5xl font-black mb-3 group-hover:scale-110 transition-transform">🔐</p>
            <p className="font-bold text-foreground mb-1">Secure & Reliable</p>
            <p className="text-sm text-foreground/60">Enterprise-grade infrastructure</p>
          </div>
          <div className="group">
            <p className="text-5xl font-black mb-3 group-hover:scale-110 transition-transform">📈</p>
            <p className="font-bold text-foreground mb-1">Scalable</p>
            <p className="text-sm text-foreground/60">Grow without limits</p>
          </div>
        </div>
        <div className="text-center border-t border-emerald-200/30 dark:border-emerald-600/20 pt-8">
          <p className="font-bold text-foreground mb-2">Store Generator Platform</p>
          <p className="text-sm text-foreground/70">Multi-tenant ecommerce platform © 2026</p>
          <p className="text-xs text-foreground/50 mt-4">Built with Next.js, Prisma, PostgreSQL & Tailwind CSS</p>
        </div>
      </section>
    </main>
  );
}
