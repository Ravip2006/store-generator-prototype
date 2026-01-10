"use client";

import { useEffect, useMemo, useState } from "react";
import { canUseSupabaseStorage, uploadProductImage } from "@/lib/supabaseStorage";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
};

export default function AdminProductsPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
  const imageBucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const [slug, setSlug] = useState("green-mart");

  const [name, setName] = useState("New Product");
  const [price, setPrice] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createCategoryId, setCreateCategoryId] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockDraftById, setStockDraftById] = useState<Record<string, string>>({});
  const [priceDraftById, setPriceDraftById] = useState<Record<string, string>>({});

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [savingStockProductId, setSavingStockProductId] = useState<string | null>(null);
  const [savingPriceProductId, setSavingPriceProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [catsRes, prodRes] = await Promise.all([
        fetch(`${apiBase}/categories`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
        fetch(`${apiBase}/products`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
      ]);

      const catsData = await catsRes.json().catch(() => []);
      const prodData = await prodRes.json().catch(() => []);

      if (!catsRes.ok) {
        setCategories([]);
        setError(catsData?.error || `Categories request failed (${catsRes.status})`);
      } else {
        setCategories(Array.isArray(catsData) ? catsData : []);
      }

      if (!prodRes.ok) {
        setProducts([]);
        setError((prev) => prev || prodData?.error || `Products request failed (${prodRes.status})`);
      } else {
        const nextProducts = Array.isArray(prodData) ? (prodData as Product[]) : [];
        setProducts(nextProducts);
        setStockDraftById((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const p of nextProducts) {
            if (typeof next[p.id] !== "string") {
              next[p.id] = p.stock == null ? "" : String(p.stock);
            }
          }
          return next;
        });
        setPriceDraftById((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const p of nextProducts) {
            if (typeof next[p.id] !== "string") {
              next[p.id] = p.price == null ? "" : String(p.price);
            }
          }
          return next;
        });
      }
    } catch (e) {
      setCategories([]);
      setProducts([]);
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
    const numericPrice = Number(price);

    if (!tenant || !cleanName || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setCreating(false);
      setError("Enter store slug, product name, and a valid non-negative price.");
      return;
    }

    const payload: { name: string; price: number; categoryId?: string; imageUrl?: string } = {
      name: cleanName,
      price: numericPrice,
    };

    const cleanCategoryId = createCategoryId.trim();
    if (cleanCategoryId) payload.categoryId = cleanCategoryId;

    const cleanImageUrl = imageUrl.trim();
    if (cleanImageUrl) payload.imageUrl = cleanImageUrl;

    try {
      const res = await fetch(`${apiBase}/products`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setName("");
      setPrice("10");
      setCreateCategoryId("");
      setImageUrl("");
      setImageFile(null);
      setUploadError(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function onUploadImage() {
    setUploadError(null);

    if (!tenant) {
      setUploadError("Enter store slug first.");
      return;
    }

    if (!imageFile) {
      setUploadError("Choose an image file first.");
      return;
    }

    if (!canUseSupabaseStorage()) {
      setUploadError(
        "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setUploadingImage(true);
    try {
      const { publicUrl } = await uploadProductImage({
        bucket: imageBucket,
        tenant,
        file: imageFile,
      });
      setImageUrl(publicUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploadingImage(false);
    }
  }

  async function onCreateCategory(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    const cleanName = newCategoryName.trim();
    if (!tenant || !cleanName) {
      setError("Enter store slug and a category name.");
      return;
    }

    setCreatingCategory(true);
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

      setNewCategoryName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreatingCategory(false);
    }
  }

  async function onChangeCategory(productId: string, categoryId: string) {
    setSavingProductId(productId);
    setError(null);

    try {
      const payload = { categoryId: categoryId || null };
      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? (data as Product) : p))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingProductId(null);
    }
  }

  async function onMakeGlobal(productId: string) {
    setSavingProductId(productId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}/make-global`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenant,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingProductId(null);
    }
  }

  async function onSetActive(productId: string, isActive: boolean) {
    setSavingProductId(productId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}/set-active`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingProductId(null);
    }
  }

  async function onSaveStock(productId: string) {
    setSavingStockProductId(productId);
    setError(null);

    try {
      const raw = (stockDraftById[productId] ?? "").trim();
      const numeric = raw === "" ? NaN : Number(raw);

      if (!Number.isInteger(numeric) || numeric < 0) {
        setError("Stock must be a non-negative integer.");
        return;
      }

      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}/stock`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ scope: "store", stock: numeric }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingStockProductId(null);
    }
  }

  async function onSavePrice(productId: string) {
    setSavingPriceProductId(productId);
    setError(null);

    try {
      const raw = (priceDraftById[productId] ?? "").trim();
      const numeric = raw === "" ? NaN : Number(raw);

      if (!Number.isFinite(numeric) || numeric < 0) {
        setError("Price must be a non-negative number.");
        return;
      }

      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ price: numeric }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setProducts((prev) => prev.map((p) => (p.id === productId ? (data as Product) : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingPriceProductId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-foreground/70">
              Create products and assign them to categories for a tenant store.
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

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Product name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kurkure"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Price</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                  inputMode="decimal"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <span className="text-sm text-foreground/70">Product image (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onUploadImage}
                  disabled={uploadingImage || !imageFile}
                  className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5 disabled:opacity-60"
                >
                  {uploadingImage ? "Uploading..." : "Upload image"}
                </button>
                <span className="text-xs text-foreground/60">Bucket: {imageBucket}</span>
              </div>

              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (auto-filled after upload)"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
              {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
            </div>

            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Category (optional)</span>
              <select
                value={createCategoryId}
                onChange={(e) => setCreateCategoryId(e.target.value)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-foreground/60">
                  No categories yet. Create one below.
                </p>
              )}
            </label>

            <div className="grid gap-2 rounded-xl border border-foreground/10 bg-foreground/5 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Create category</div>
                  <p className="mt-1 text-xs text-foreground/60">
                    Categories are tenant-specific.
                  </p>
                </div>
                <div className="text-xs text-foreground/60">
                  {categories.length} total
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Snacks"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => onCreateCategory()}
                  disabled={creatingCategory}
                  className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                >
                  {creatingCategory ? "Adding..." : "Add"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create product"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              <b>Error:</b> {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Product list</h2>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {products.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No products yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-foreground/10">
                      <td className="px-4 py-3">
                        <div className="text-sm">{p.name}</div>
                        <div className="mt-1 text-xs text-foreground/60 font-mono">{p.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={priceDraftById[p.id] ?? String(p.price ?? "")}
                            onChange={(e) =>
                              setPriceDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            disabled={savingPriceProductId === p.id}
                            inputMode="decimal"
                            className="w-24 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                          />
                          <button
                            type="button"
                            onClick={() => onSavePrice(p.id)}
                            disabled={savingPriceProductId === p.id}
                            className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                          >
                            {savingPriceProductId === p.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={stockDraftById[p.id] ?? (p.stock == null ? "" : String(p.stock))}
                            onChange={(e) =>
                              setStockDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            disabled={savingStockProductId === p.id}
                            inputMode="numeric"
                            className="w-24 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => onSaveStock(p.id)}
                            disabled={savingStockProductId === p.id}
                            className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                          >
                            {savingStockProductId === p.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.categoryId || ""}
                          onChange={(e) => onChangeCategory(p.id, e.target.value)}
                          disabled={savingProductId === p.id}
                          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                        >
                          <option value="">No category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => onMakeGlobal(p.id)}
                            disabled={savingProductId === p.id}
                            className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
                          >
                            Make global
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onSetActive(p.id, true)}
                              disabled={savingProductId === p.id}
                              className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                            >
                              Enable
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetActive(p.id, false)}
                              disabled={savingProductId === p.id}
                              className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                            >
                              Disable
                            </button>
                          </div>
                          <div className="text-xs text-foreground/60">
                            Global products share the same image across stores.
                          </div>
                        </div>
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
