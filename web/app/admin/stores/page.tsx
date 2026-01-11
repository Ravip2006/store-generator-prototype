"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

type Store = {
  id: string;
  slug: string;
  name: string;
  phone: string;
  themeColor: string;
  createdAt: string;
};

type EditingStore = {
  id: string;
  name: string;
  phone: string;
  themeColor: string;
};

export default function StoresPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditingStore | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadStores() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/stores`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load stores (${res.status})`);
      const data = await res.json();
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStores();
  }, []);

  function startEdit(store: Store) {
    setEditingId(store.id);
    setEditData({
      id: store.id,
      name: store.name,
      phone: store.phone,
      themeColor: store.themeColor,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }

  async function saveEdit() {
    if (!editData) return;

    setSaving(true);
    setError(null);

    try {
      // Find the store's slug
      const store = stores.find((s) => s.id === editData.id);
      if (!store) throw new Error("Store not found");

      const res = await fetch(`${apiBase}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: store.slug,
          name: editData.name.trim(),
          phone: editData.phone.trim(),
          themeColor: editData.themeColor.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Update failed (${res.status})`);
        return;
      }

      // Update local state
      setStores((prev) =>
        prev.map((s) =>
          s.id === editData.id
            ? {
                ...s,
                name: editData.name,
                phone: editData.phone,
                themeColor: editData.themeColor,
              }
            : s
        )
      );

      setEditingId(null);
      setEditData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save store");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AdminHeader
        title="Stores"
        description="View and edit all onboarded stores"
        icon="🏬"
        breadcrumbs={[{ label: "Stores" }]}
        action={{ label: "✨ Create Store", href: "/admin/create-store" }}
      />

      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-2xl border border-foreground/10 bg-background shadow-sm">

          {error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              <b>Error:</b> {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🏬 Store list</h2>
            <button
              onClick={loadStores}
              disabled={loading}
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {stores.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">
              {loading ? "Loading stores..." : "No stores yet."}
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Theme</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) =>
                    editingId === store.id && editData ? (
                      <tr key={store.id} className="border-t border-foreground/10 bg-foreground/5">
                        <td className="px-4 py-3">
                          <input
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-foreground/60">
                          {store.slug}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editData.phone}
                            onChange={(e) =>
                              setEditData({ ...editData, phone: e.target.value })
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="color"
                            value={editData.themeColor}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                themeColor: e.target.value,
                              })
                            }
                            disabled={saving}
                            className="h-10 w-16 cursor-pointer rounded-lg border border-foreground/15 disabled:opacity-60"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={store.id} className="border-t border-foreground/10">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{store.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-foreground/10 px-2 py-1 text-xs font-mono">
                            {store.slug}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{store.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="h-6 w-12 rounded-lg border border-foreground/20"
                            style={{ backgroundColor: store.themeColor }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={`/s/${store.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-600/20 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-600/30"
                            >
                              Open
                            </Link>
                            <button
                              onClick={() => startEdit(store)}
                              disabled={editingId !== null}
                              className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
