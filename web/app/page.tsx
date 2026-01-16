"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

export default function HomePage() {
  const [slug, setSlug] = useState("green-mart");

  const previewHref = useMemo(() => {
    const clean = slug.trim().toLowerCase();
    return clean ? `/s/${encodeURIComponent(clean)}` : "/";
  }, [slug]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, duration: 0.6 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_42%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_45%),linear-gradient(180deg,_#05070b_0%,_#090b12_30%,_#0b0e15_100%)] text-slate-100"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,_rgba(255,255,255,0.08)_0%,_rgba(255,255,255,0)_35%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.18),_transparent_40%)]" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-lg font-semibold">
              SG
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">Store Generator</p>
              <p className="text-xs text-white/50">Premium SaaS Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={previewHref}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20"
            >
              View Storefront
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-white text-black px-5 py-2 text-xs font-semibold shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/50"
            >
              Open Admin
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-xl">
              2026 SaaS-grade store platform
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
                Build premium multi-store experiences with an elite operating system.
              </h1>
              <p className="text-base text-white/70 max-w-xl">
                Launch, scale, and operate high-performance storefronts with real-time inventory,
                dynamic pricing, and unified analytics across every brand.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/admin"
                className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/60"
              >
                Start building
              </Link>
              <Link
                href={previewHref}
                className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/20"
              >
                Explore demo store
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-white/60">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-lg font-semibold text-white">99.99%</p>
                <p>Uptime SLAs</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-lg font-semibold text-white">∞</p>
                <p>Stores supported</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-lg font-semibold text-white">24/7</p>
                <p>Realtime telemetry</p>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ y: -8 }}
            transition={spring}
            className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src="/dashboardpage.png"
                alt="Admin dashboard"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-semibold">Unified command center</p>
                <p className="text-xs text-white/70">Inventory, pricing, ops, analytics.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-6">
          {[
            {
              title: "Realtime analytics",
              desc: "Live KPIs, cohort tracking, and GMV alerts.",
              span: "lg:col-span-3",
            },
            {
              title: "Smart catalog",
              desc: "GS1-grade product enrichment and auto-sync.",
              span: "lg:col-span-3",
            },
            {
              title: "Operations hub",
              desc: "Store-level controls with role-based approvals.",
              span: "lg:col-span-2",
            },
            {
              title: "AI pricing",
              desc: "Dynamic discounting powered by demand signals.",
              span: "lg:col-span-2",
            },
            {
              title: "Fulfillment",
              desc: "Slot management, delivery routing, and SLAs.",
              span: "lg:col-span-2",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={spring}
              className={`${item.span} rounded-[26px] border border-white/15 bg-white/10 p-6 shadow-lg shadow-black/30 backdrop-blur-xl`}
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-white/80">{item.title}</p>
                  <p className="mt-2 text-sm text-white/60">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Updated now</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">
                    Live
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="rounded-[28px] border border-white/15 bg-white/10 p-8 backdrop-blur-xl"
          >
            <h2 className="text-2xl font-semibold">Launch any store in seconds</h2>
            <p className="mt-3 text-sm text-white/70">
              Spin up curated experiences for every brand, region, and customer segment with instant previews.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-xs text-white/60">Store slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. green-mart"
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = previewHref;
                    }
                  }}
                />
              </div>
              <Link
                href={previewHref}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30"
              >
                Preview store
              </Link>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            transition={spring}
            className="rounded-[28px] border border-white/15 bg-white/10 p-8 backdrop-blur-xl"
          >
            <p className="text-sm font-semibold text-white/80">Highlights</p>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              <li>✓ Multi-tenant identity and access controls</li>
              <li>✓ Automated GS1 compliance and enrichment</li>
              <li>✓ Revenue dashboards with margin tracking</li>
              <li>✓ Localization for currency and tax rules</li>
            </ul>
          </motion.div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-white/60 backdrop-blur-xl">
          <p className="text-white/80">Store Generator Platform</p>
          <p className="mt-2">Premium multi-tenant commerce infrastructure © 2026</p>
        </div>
      </footer>
    </motion.main>
  );
}
