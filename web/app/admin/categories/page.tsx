"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export default function AdminCategoriesPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [slug, setSlug] = useState("green-mart");
  const [loadingStores, setLoadingStores] = useState(false);
  const [name, setName] = useState("Snacks");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  // Fetch available stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const res = await fetch(`${apiBase}/debug/stores`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStores(Array.isArray(data.stores) ? data.stores : []);
        }
      } catch (e) {
        console.error("Failed to fetch stores:", e);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, [apiBase]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/categories`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setCategories([]);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      setCategories([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const cleanName = name.trim();
    if (!tenant || !cleanName) {
      setCreating(false);
      setError("Please enter a valid store slug and category name.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/categories`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ name: cleanName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Categories"
        description="Manage store categories and organize products"
        icon="🏷️"
        breadcrumbs={[{ label: "Categories" }]}
      />

      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">

          <form onSubmit={onCreate} className="mt-6 grid gap-3">
            <div className="grid gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-200/30">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🏬 Select Store</span>
                <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/20 text-blue-600">
                  {slug ? "Active" : "Required"}
                </span>
              </div>
              {loadingStores ? (
                <div className="text-sm text-foreground/60">⏳ Loading stores...</div>
              ) : stores.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                  📦 No stores found. <a href="/admin/create-store" className="underline font-semibold">Create one here</a>.
                </div>
              ) : (
                <select
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300/50 hover:border-blue-300/70 transition-all"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.slug}>
                      {store.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Category name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Snacks"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 transition-all"
            >
              {creating ? "Creating..." : "Create category"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              <b>Error:</b> {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">List</h2>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No categories yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-t border-foreground/10">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
