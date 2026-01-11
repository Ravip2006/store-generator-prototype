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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-blue-200/30 dark:border-blue-600/30 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-lg shadow-blue-500/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg hover:scale-110 transition-transform">
              S
            </div>
            <div>
              <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Store Generator</span>
              <p className="text-xs text-foreground/50 font-semibold">Multi-Tenant Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={previewHref} className="text-sm text-foreground/60 hover:text-foreground transition-colors font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30">
              Storefront
            </Link>
            <Link href="/admin" className="text-sm font-bold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105 transform">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-32 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-5 animate-pulse" style={{animationDelay: '2s'}}></div>

        <div className="relative grid gap-16 lg:grid-cols-2 lg:items-center z-10">
          {/* Left: Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-600/30 dark:to-purple-600/30 border border-blue-300/50 dark:border-blue-500/50 px-5 py-2.5 hover:shadow-lg transition-shadow">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">⭐ Build with Confidence</span>
            </div>

            {/* Main Heading with Gradient */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
                  Launch Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                  Multi-Store Platform
                </span>
              </h1>
              <p className="text-lg text-foreground/70 leading-relaxed max-w-xl font-medium">
                Power your ecommerce business with a modern, scalable multi-tenant platform. Manage unlimited stores, inventory, pricing, orders, and customers all from one intelligent dashboard. Launch instantly, scale effortlessly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-6">
              <Link href="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white px-8 py-4 font-bold hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-105 transform border border-white/20 backdrop-blur-sm">
                <span>🚀 Launch Admin Now</span>
              </Link>
              <Link href={previewHref} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-background/50 px-8 py-4 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-background/80 transition-all hover:shadow-lg">
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
          <div className="space-y-6">
            {/* Dashboard Image */}
            <div className="rounded-3xl border-2 border-blue-300/50 dark:border-blue-500/40 overflow-hidden shadow-3xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:-translate-y-2">
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-background dark:to-background/80 p-2">
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
            <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-600/20 dark:to-purple-600/20 p-8 border-2 border-blue-200 dark:border-blue-500/30 backdrop-blur-sm">
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
            <div key={i} className="group rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-600/20 dark:to-blue-600/5 p-6 border border-blue-200 dark:border-blue-600/30 hover:shadow-lg hover:-translate-y-1 transition-all">
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
          <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Powerful Features Built In</h2>
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
            <div key={i} className="group rounded-xl bg-gradient-to-br from-white to-slate-50/50 dark:from-background/50 dark:to-background/30 p-7 border border-blue-200/30 dark:border-blue-600/20 hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-all">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Store Preview Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border-2 border-gradient bg-gradient-to-br from-white/80 via-blue-50/40 to-purple-50/30 dark:from-background/80 dark:via-blue-950/30 dark:to-purple-950/20 p-12 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Explore Live Stores</h2>
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
                    className="w-full rounded-xl border-2 border-blue-300/50 dark:border-blue-600/40 bg-white dark:bg-background/50 px-5 py-3.5 text-sm font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3.5 font-bold hover:shadow-2xl hover:shadow-green-500/40 transition-all hover:scale-105 transform border border-white/20"
              >
                🚀 Open Store
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-600/20 dark:to-purple-600/20 border-2 border-blue-300/50 dark:border-blue-500/40">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                <span className="block mb-2">📌 Demo Stores Available:</span>
                <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">Try "green-mart" • "sydney-spice" • or create your own</span>
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
            <div key={i} className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-600/10 dark:to-purple-600/10 border border-blue-200/30 dark:border-blue-600/30">
              <p className="text-5xl font-black mb-3">{stat.number}</p>
              <p className="font-bold text-foreground mb-2">{stat.label}</p>
              <p className="text-sm text-foreground/60">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-blue-200/30 dark:border-blue-600/30">
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
        <div className="text-center border-t border-blue-200/30 dark:border-blue-600/30 pt-8">
          <p className="font-bold text-foreground mb-2">Store Generator Platform</p>
          <p className="text-sm text-foreground/70">Multi-tenant ecommerce platform © 2026</p>
          <p className="text-xs text-foreground/50 mt-4">Built with Next.js, Prisma, PostgreSQL & Tailwind CSS</p>
        </div>
      </section>
    </main>
  );
}
