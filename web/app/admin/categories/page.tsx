"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export default function AdminCategoriesPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  const [slug, setSlug] = useState("green-mart");
  const [name, setName] = useState("Snacks");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="text-sm text-foreground/70">
              List store categories (seeded from master taxonomy) and create custom ones.
            </p>
          </div>

          <form onSubmit={onCreate} className="mt-6 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Store slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. green-mart"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

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
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
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
