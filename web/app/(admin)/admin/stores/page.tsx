"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AdminHeader from "@/components/AdminHeader";

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

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
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)]"
    >
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
            <h2 className="text-2xl font-black bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">🏬 Store list</h2>
            <button
              onClick={loadStores}
              disabled={loading}
              className="group/cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none border border-white/20 backdrop-blur-sm"
            >
              <span className={`relative z-10 inline-block text-lg ${loading ? "animate-spin" : ""}`}>
                {loading ? "↻" : "↻"}
              </span>
              <span className="relative z-10">{loading ? "Refreshing..." : "Refresh"}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[1px] transition-transform duration-700 ease-out -translate-x-[140%] group-hover/cta:translate-x-[240%]"
              />
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
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Slug</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Theme</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Created</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="border-t border-foreground/10">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {editingId === store.id ? (
                          <input
                            value={editData?.name ?? ""}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      name: e.target.value,
                                    }
                                  : null
                              )
                            }
                            className="w-full rounded-lg border border-foreground/20 bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-foreground/40"
                          />
                        ) : (
                          store.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/70">{store.slug}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {editingId === store.id ? (
                          <input
                            value={editData?.phone ?? ""}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      phone: e.target.value,
                                    }
                                  : null
                              )
                            }
                            className="w-full rounded-lg border border-foreground/20 bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/40"
                          />
                        ) : (
                          store.phone || "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === store.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editData?.themeColor ?? "#000000"}
                              onChange={(e) =>
                                setEditData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        themeColor: e.target.value,
                                      }
                                    : null
                                )
                              }
                              className="h-8 w-10 cursor-pointer rounded-md border border-foreground/20 bg-background"
                            />
                            <input
                              value={editData?.themeColor ?? ""}
                              onChange={(e) =>
                                setEditData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        themeColor: e.target.value,
                                      }
                                    : null
                                )
                              }
                              className="w-24 rounded-lg border border-foreground/20 bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/40"
                            />
                          </div>
                        ) : store.themeColor ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-foreground/20"
                              style={{ backgroundColor: store.themeColor }}
                            />
                            <span className="text-xs text-foreground/70">{store.themeColor}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/70">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === store.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-semibold hover:bg-foreground/10"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-semibold hover:bg-foreground/10"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(store)}
                              className="rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-semibold hover:bg-foreground/10"
                            >
                              Edit
                            </button>
                            <Link
                              href={`/admin/stores/${encodeURIComponent(store.slug)}`}
                              className="rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-semibold hover:bg-foreground/10"
                            >
                              Manage
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteStore(store)}
                              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
