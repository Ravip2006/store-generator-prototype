"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { canUseSupabaseStorage, uploadProductImage } from "@/lib/supabaseStorage";

type Category = { id: string; name: string };

export default function AddProductPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
  const imageBucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [slug, setSlug] = useState("green-mart");
  const [loadingStores, setLoadingStores] = useState(false);
  const [name, setName] = useState("New Product");
  const [price, setPrice] = useState("10.0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!tenant) {
          if (!cancelled) setCategories([]);
          return;
        }
        const res = await fetch(`${apiBase}/categories`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        });
        const data = await res.json().catch(() => []);
        if (cancelled) return;
        setCategories(res.ok && Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, tenant]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      name: name.trim(),
      price: Number(price),
      categoryId: categoryId.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (!slug.trim() || !payload.name || Number.isNaN(payload.price)) {
      setLoading(false);
      setError("Please enter a valid slug, name and numeric price.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenant,
        },
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

  async function onUploadImage() {
    setUploadError(null);

    if (!tenant) {
      setUploadError("Enter a store slug first.");
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

  const previewUrl = `http://localhost:3000/s/${tenant}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Add Product"
        description="Create a new product in your store"
        icon="➕"
        breadcrumbs={[{ label: "Add Product" }]}
      />

      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
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
              <span className="text-xs text-foreground/60">
                Preview:{" "}
                <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-700">
                  {previewUrl}
                </a>
              </span>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Product name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Price</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Product image (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
              <div className="flex gap-2 items-center flex-wrap text-xs">
                <button
                  type="button"
                  onClick={onUploadImage}
                  disabled={uploadingImage || !imageFile}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 font-medium disabled:opacity-60 transition-all"
                >
                  {uploadingImage ? "Uploading..." : "Upload"}
                </button>
                <span className="text-foreground/60">
                  Bucket: <b>{imageBucket}</b>
                </span>
              </div>

              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (auto-filled after upload)"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
              {uploadError ? (
                <span className="text-sm text-red-600">{uploadError}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Category (optional)</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 ? (
                <span className="text-xs text-foreground/60">
                  No categories found for this store. Create one in the Categories admin page.
                </span>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 transition-all"
            >
              {loading ? "Adding..." : "Add product"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <b>Error:</b> {error}
            </div>
          )}

          {result !== null && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <b className="text-green-700">✅ Product added:</b>
              <pre className="mt-2 overflow-auto text-xs bg-white p-3 rounded-lg border border-green-200">{JSON.stringify(result, null, 2)}</pre>
              <p className="mt-3 text-sm">
                View store:{" "}
                <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-700">
                  {previewUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
