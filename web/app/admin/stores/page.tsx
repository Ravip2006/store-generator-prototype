"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

type Store = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  themeColor: string | null;
  createdAt: string;
};

type EditingStore = {
  id: string;
  name: string;
  phone: string;
  themeColor: string;
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditingStore | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadStores() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load stores (${res.status})`);
      const data = await res.json();
      const storesList = Array.isArray(data) ? data : [];
      setStores(storesList);
      setFilteredStores(storesList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
      setStores([]);
      setFilteredStores([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = stores.filter((store) =>
      store.name.toLowerCase().includes(query.toLowerCase()) ||
      store.slug.toLowerCase().includes(query.toLowerCase()) ||
      (store.phone || "").toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStores(filtered);
  };

  useEffect(() => {
    void loadStores();
  }, []);

  function startEdit(store: Store) {
    setEditingId(store.id);
    setEditData({
      id: store.id,
      name: String(store.name || ""),
      phone: String(store.phone || ""),
      themeColor: String(store.themeColor || "#000000"),
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
      const store = stores.find((s) => s.id === editData.id);
      if (!store) throw new Error("Store not found");

      const payload = {
        name: editData.name.trim(),
        phone: editData.phone.trim(),
        themeColor: editData.themeColor.trim(),
      };

      let res = await fetch(`/api/stores/${encodeURIComponent(editData.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Backwards-compat: if the API server isn't running the new PATCH route yet,
      // fall back to the existing POST /stores upsert-by-slug.
      if (res.status === 404 || res.status === 405) {
        res = await fetch(`/api/stores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: store.slug,
            ...payload,
          }),
        });
      }

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

      setFilteredStores((prev) =>
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

  async function deleteStore(store: Store) {
    if (saving) return;

    const ok = window.confirm(
      `Delete store "${store.name}"?\n\nThis may remove store-related data (orders, categories, overrides, customers). This cannot be undone.`
    );
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(store.id)}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Delete failed (${res.status})`);
        return;
      }

      setStores((prev) => prev.filter((s) => s.id !== store.id));
      setFilteredStores((prev) => prev.filter((s) => s.id !== store.id));

      if (editingId === store.id) {
        setEditingId(null);
        setEditData(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete store");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Stores"
        description="View and edit all onboarded stores"
        icon="🏬"
        breadcrumbs={[{ label: "Stores" }]}
        action={{ label: "✨ Create Store", href: "/admin/create-store" }}
        onSearch={handleSearch}
        showSearch={true}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20">

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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-bold text-white hover:from-blue-600 hover:to-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none border border-white/20 backdrop-blur-sm"
            >
              <span className={`inline-block text-lg ${loading ? "animate-spin" : ""}`}>
                {loading ? "↻" : "↻"}
              </span>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {stores.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">
              {loading ? "Loading stores..." : "No stores yet."}
            </p>
          ) : filteredStores.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">
              No stores match your search.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-foreground/10">
              <table className="min-w-[720px] w-full border-collapse text-left text-sm">
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
                  {filteredStores.map((store) =>
                    editingId === store.id && editData ? (
                      <tr key={store.id} className="border-t border-foreground/10 bg-foreground/5">
                        <td className="px-4 py-3">
                          <input
                            autoFocus
                            value={editData.name ?? ""}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev ? { ...prev, name: e.target.value } : prev
                              )
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
                            value={editData.phone ?? ""}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev ? { ...prev, phone: e.target.value } : prev
                              )
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="color"
                            value={editData.themeColor ?? "#000000"}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev ? { ...prev, themeColor: e.target.value } : prev
                              )
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
                            style={{ backgroundColor: store.themeColor || "#000000" }}
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
                            <button
                              onClick={() => void deleteStore(store)}
                              disabled={editingId !== null || saving}
                              className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-600/20 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-600/30 disabled:opacity-60"
                            >
                              Delete
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
