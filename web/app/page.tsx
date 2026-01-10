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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Store Generator Prototype
            </h1>
            <p className="max-w-prose text-sm text-foreground/70 sm:text-base">
              A lightweight storefront preview. Enter a store slug to browse products,
              add to cart, and place a test order.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-foreground/10 p-4">
              <div className="text-sm font-semibold">Browse</div>
              <p className="mt-1 text-sm text-foreground/70">
                View categories and products for a tenant.
              </p>
            </div>
            <div className="rounded-2xl border border-foreground/10 p-4">
              <div className="text-sm font-semibold">Cart</div>
              <p className="mt-1 text-sm text-foreground/70">
                Cart is stored locally per store slug.
              </p>
            </div>
            <div className="rounded-2xl border border-foreground/10 p-4">
              <div className="text-sm font-semibold">Checkout</div>
              <p className="mt-1 text-sm text-foreground/70">
                Place an order and view confirmation.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-foreground/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Open a storefront</h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Example URL: <span className="font-mono">/s/green-mart</span>
                </p>
              </div>
              <Link
                href={previewHref}
                className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-sm font-medium hover:bg-foreground/10"
              >
                Open preview
              </Link>
            </div>

            <label className="mt-4 block">
              <span className="text-sm text-foreground/70">Store slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. green-mart"
                className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                inputMode="text"
              />
              <p className="mt-2 text-xs text-foreground/60">
                Tip: if you’re using local subdomains, you can also try{' '}
                <span className="font-mono">http://&lt;slug&gt;.localhost:3000</span>.
              </p>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
