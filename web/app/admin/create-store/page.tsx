"use client";

import { useMemo, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

type CreateStorePayload = {
  name: string;
  slug: string;
  phone: string;
  themeColor?: string;
};

type CreateStoreResult = {
  slug?: string;
} & Record<string, unknown>;

export default function CreateStorePage() {
  const [name, setName] = useState("New Store");
  const [slug, setSlug] = useState("new-store");
  const [phone, setPhone] = useState("61400111222");
  const [themeColor, setThemeColor] = useState("#0A7C2F");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateStoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate a slug from name (optional convenience)
  const suggestedSlug = useMemo(() => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "new-store";
  }, [name]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: CreateStorePayload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      phone: phone.trim(),
      themeColor: themeColor.trim(),
    };

    try {
      const res = await fetch("http://localhost:3001/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const storePath = result?.slug
    ? `/s/${encodeURIComponent(String(result.slug))}`
    : null;

  const localSubdomainUrl = result?.slug
    ? `http://${result.slug}.localhost:3000`
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Create Store"
        description="Onboard a new tenant store to the platform"
        icon="✨"
        breadcrumbs={[{ label: "Create Store" }]}
      />

      <div className="mx-auto w-full max-w-2xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-foreground/70">Store name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Keep slug in sync until user edits it
              setSlug(suggestedSlug);
            }}
            className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground/70">Slug (used as subdomain)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. green-mart"
            className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
          />
          <span className="text-xs text-foreground/60">
            Example URL: <code>http://{slug || "your-slug"}.localhost:3000</code>
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground/70">WhatsApp phone (international format)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 61400111222 or 919999999999"
            className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
          />
          <span className="text-xs text-foreground/60">
            No + sign. Used for <code>wa.me</code> links.
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-foreground/70">Theme color</span>
          <input
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            placeholder="#0A7C2F"
            className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-60"
        >
          {loading ? "Creating..." : "✨ Create store"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-300/50 bg-red-500/10 p-4 text-sm text-red-600">
          <b>Error:</b> {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-green-300/50 bg-green-500/10 p-4 text-sm text-green-600">
          <b>✅ Store created:</b>
          <pre className="mt-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>

          <p className="mt-4 text-sm">
            View all stores: <a href="/admin/stores" className="font-semibold text-blue-600 hover:text-blue-700">/admin/stores</a>
          </p>

          {storePath && (
            <p className="mt-3 text-sm">
              Open store site: <a href={storePath} className="font-semibold text-blue-600 hover:text-blue-700">{storePath}</a>
            </p>
          )}

          {localSubdomainUrl && (
            <p className="mt-3 text-sm">
              Local subdomain (optional):{" "}
              <a href={localSubdomainUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
                {localSubdomainUrl}
              </a>
            </p>
          )}

          <p className="mt-3 text-xs text-foreground/60">
            Note: For local subdomains, ensure <code>/etc/hosts</code> maps{" "}
            <code>{result.slug}.localhost</code> → 127.0.0.1.
          </p>
        </div>
      )}
        </div>
      </div>
    </main>
  );
}
