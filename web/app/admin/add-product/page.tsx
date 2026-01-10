"use client";

import { useEffect, useMemo, useState } from "react";
import { canUseSupabaseStorage, uploadProductImage } from "@/lib/supabaseStorage";

type Category = { id: string; name: string };

export default function AddProductPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
  const imageBucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const [slug, setSlug] = useState("green-mart");
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
    <div style={{ maxWidth: 640, margin: "24px auto", padding: 16, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 6 }}>Add Product</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Adds a product to the store (tenant) by slug.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Store slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. green-mart"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Preview:{" "}
            <a href={previewUrl} target="_blank" rel="noreferrer">
              {previewUrl}
            </a>
          </span>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Product name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 12.5"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Product image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onUploadImage}
              disabled={uploadingImage || !imageFile}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #111",
                background: uploadingImage ? "#eee" : "#fff",
                color: "#111",
                cursor: uploadingImage || !imageFile ? "not-allowed" : "pointer",
              }}
            >
              {uploadingImage ? "Uploading..." : "Upload image"}
            </button>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Bucket: <b>{imageBucket}</b>
            </span>
          </div>

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (auto-filled after upload)"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          {uploadError ? (
            <span style={{ fontSize: 12, color: "#a00" }}>{uploadError}</span>
          ) : null}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Category (optional)
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 ? (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              No categories found for this store. Create one in the Products admin page.
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #111",
            background: loading ? "#eee" : "#111",
            color: loading ? "#111" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Adding..." : "Add product"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 8 }}>
          <b>Error:</b> {error}
        </div>
      )}

      {result !== null && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #9f9", borderRadius: 8 }}>
          <b>✅ Product added:</b>
          <pre style={{ overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>
          <p style={{ marginTop: 8 }}>
            View store:{" "}
            <a href={previewUrl} target="_blank" rel="noreferrer">
              {previewUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
