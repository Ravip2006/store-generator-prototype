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
  regularPrice?: number;
  discountPercent?: number | null;
  discountPrice?: number | null;
  stock?: number | null;
  description?: string | null;
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
  const [discountPercentDraftById, setDiscountPercentDraftById] = useState<Record<string, string>>({});
  const [discountPriceDraftById, setDiscountPriceDraftById] = useState<Record<string, string>>({});
  const [descriptionDraftById, setDescriptionDraftById] = useState<Record<string, string>>({});

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [savingStockProductId, setSavingStockProductId] = useState<string | null>(null);
  const [savingPriceProductId, setSavingPriceProductId] = useState<string | null>(null);
  const [savingDiscountProductId, setSavingDiscountProductId] = useState<string | null>(null);
  const [savingDescriptionProductId, setSavingDescriptionProductId] = useState<string | null>(null);
  const [generatingAiDescriptionProductId, setGeneratingAiDescriptionProductId] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  // Helper: Calculate sale price from discount percentage
  function calculateSalePrice(regularPrice: number, discountPercent: number | string): number | null {
    const percent = Number(discountPercent);
    if (isNaN(percent) || percent < 0 || percent > 100 || regularPrice <= 0) return null;
    return Math.round(regularPrice * (1 - percent / 100) * 100) / 100;
  }

  // Helper: Calculate discount percent from sale price
  function calculateDiscountPercent(regularPrice: number, salePrice: number | string): number | null {
    const sale = Number(salePrice);
    if (isNaN(sale) || sale < 0 || regularPrice <= 0) return null;
    const percent = ((regularPrice - sale) / regularPrice) * 100;
    return Math.round(percent * 100) / 100;
  }

  async function load() {
    setLoading(true);
    setError(null);
    setNotice(null);

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
              const regular = p.regularPrice ?? p.price;
              next[p.id] = regular == null ? "" : String(regular);
            }
          }
          return next;
        });

        setDiscountPercentDraftById((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const p of nextProducts) {
            if (typeof next[p.id] !== "string") {
              next[p.id] = p.discountPercent == null ? "" : String(p.discountPercent);
            }
          }
          return next;
        });

        setDiscountPriceDraftById((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const p of nextProducts) {
            if (typeof next[p.id] !== "string") {
              next[p.id] = p.discountPrice == null ? "" : String(p.discountPrice);
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

  async function onSaveDiscount(productId: string) {
    setSavingDiscountProductId(productId);
    setError(null);
    setNotice(null);

    try {
      const rawPct = (discountPercentDraftById[productId] ?? "").trim();
      const rawSale = (discountPriceDraftById[productId] ?? "").trim();

      const pct = rawPct === "" ? null : Number(rawPct);
      const sale = rawSale === "" ? null : Number(rawSale);

      if (pct !== null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) {
        setError("Discount % must be between 0 and 100.");
        return;
      }

      if (sale !== null && (!Number.isFinite(sale) || sale < 0)) {
        setError("Sale price must be a non-negative number.");
        return;
      }

      const payload: Record<string, number | null> = {};
      if (pct === null && sale === null) {
        payload.discountPercent = null;
        payload.discountPrice = null;
      } else if (sale !== null) {
        payload.discountPrice = sale;
      } else {
        payload.discountPercent = pct;
      }

      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}` , {
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

      setProducts((prev) => prev.map((p) => (p.id === productId ? (data as Product) : p)));
      setNotice("Saved discount.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingDiscountProductId(null);
    }
  }

  async function onSaveDescription(productId: string) {
    setSavingDescriptionProductId(productId);
    setError(null);

    try {
      const description = (descriptionDraftById[productId] ?? "").trim();

      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ description: description || null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setProducts((prev) => prev.map((p) => (p.id === productId ? (data as Product) : p)));
      setNotice("Description saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingDescriptionProductId(null);
    }
  }

  async function onGenerateAiDescription(productId: string) {
    setGeneratingAiDescriptionProductId(productId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}/ai-description`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ force: true }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      const generatedDescription = typeof data?.description === "string" ? data.description : "";
      if (generatedDescription) {
        setDescriptionDraftById((prev) => ({ ...prev, [productId]: generatedDescription }));
        setNotice("AI description generated. Click 'Save Description' to apply.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGeneratingAiDescriptionProductId(null);
    }
  }

  async function onImportDescriptionsFromCsv(file: File) {
    setImportingCsv(true);
    setError(null);
    setNotice(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

      if (lines.length === 0) {
        setError("CSV file is empty");
        return;
      }

      // Parse CSV: expect headers "productId,description" or similar
      const headerLine = lines[0].toLowerCase();
      const hasProductIdColumn = headerLine.includes("productid") || headerLine.includes("id");
      const hasDescriptionColumn = headerLine.includes("description");

      if (!hasProductIdColumn || !hasDescriptionColumn) {
        setError('CSV must have columns named "productId" (or "id") and "description"');
        return;
      }

      // Simple CSV parser (handles quoted values with commas)
      const parseRow = (row: string) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ""));
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ""));
        return result;
      };

      const headerRow = parseRow(lines[0]);
      const productIdIndex = headerRow.findIndex(
        (h) => h.toLowerCase() === "productid" || h.toLowerCase() === "id"
      );
      const descriptionIndex = headerRow.findIndex((h) => h.toLowerCase() === "description");

      let successCount = 0;
      let skipCount = 0;

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const row = parseRow(lines[i]);
        const productId = row[productIdIndex]?.trim();
        const description = row[descriptionIndex]?.trim();

        if (!productId || !description) {
          skipCount++;
          continue;
        }

        // Check if product exists
        const product = products.find((p) => p.id === productId);
        if (!product) {
          skipCount++;
          continue;
        }

        // Save the description
        try {
          const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-tenant-id": tenant,
            },
            body: JSON.stringify({ description: description || null }),
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            setProducts((prev) => prev.map((p) => (p.id === productId ? (data as Product) : p)));
            successCount++;
          } else {
            skipCount++;
          }
        } catch {
          skipCount++;
        }
      }

      setNotice(`✓ Imported ${successCount} descriptions (${skipCount} skipped)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImportingCsv(false);
    }
  }

  async function onOnboardCatalog() {
    setOnboarding(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`${apiBase}/catalog/onboard`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({ defaultStock: 0, activate: true }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      const onboarded = typeof data?.onboarded === "number" ? data.onboarded : 0;
      setNotice(`Onboarded ${onboarded} products (new overrides).`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOnboarding(false);
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

          {notice && !error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              {notice}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Product list</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 cursor-pointer disabled:opacity-60">
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onImportDescriptionsFromCsv(file);
                      }
                      e.target.value = "";
                    }}
                    disabled={importingCsv}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-foreground/50">(descriptions)</span>
              </div>

              <button
                type="button"
                onClick={onOnboardCatalog}
                disabled={onboarding || loading}
                className="inline-flex items-center justify-center rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-60"
              >
                {onboarding ? "Onboarding..." : "Onboard catalog"}
              </button>

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No products yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="rounded-xl border border-foreground/10 bg-white dark:bg-background/50 p-5 shadow-sm hover:shadow-md transition-shadow">
                  {/* Product Name & ID */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-foreground/50 font-mono mt-1">{p.id}</p>
                  </div>

                  {/* Price Section */}
                  <div className="mb-4 space-y-2 rounded-lg bg-foreground/5 p-3">
                    <label className="block text-xs font-semibold text-foreground/70">Price</label>
                    <div className="flex gap-2">
                      <input
                        value={priceDraftById[p.id] ?? String((p.regularPrice ?? p.price) ?? "")}
                        onChange={(e) =>
                          setPriceDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        disabled={savingPriceProductId === p.id}
                        inputMode="decimal"
                        className="flex-1 rounded-lg border border-foreground/15 bg-background px-2 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => onSavePrice(p.id)}
                        disabled={savingPriceProductId === p.id}
                        className="px-3 py-2 rounded-lg border border-foreground/15 bg-background text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                      >
                        {savingPriceProductId === p.id ? "..." : "Save"}
                      </button>
                    </div>
                    {typeof p.regularPrice === "number" && typeof p.price === "number" && p.price < p.regularPrice ? (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ {p.price.toFixed(2)} (was {p.regularPrice.toFixed(2)})
                      </div>
                    ) : null}
                  </div>

                  {/* Discount Section */}
                  <div className="mb-4 space-y-2 rounded-lg bg-foreground/5 p-3">
                    <label className="block text-xs font-semibold text-foreground/70">Discount (for {slug})</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            value={discountPercentDraftById[p.id] ?? (p.discountPercent == null ? "" : String(p.discountPercent))}
                            onChange={(e) =>
                              setDiscountPercentDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            disabled={savingDiscountProductId === p.id}
                            inputMode="decimal"
                            placeholder="0"
                            className="w-full rounded-lg border border-foreground/15 bg-background px-2 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                          />
                          <p className="mt-1 text-xs text-foreground/50">Discount %</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSaveDiscount(p.id)}
                          disabled={savingDiscountProductId === p.id}
                          className="px-3 py-2 rounded-lg border border-foreground/15 bg-background text-xs font-medium hover:bg-foreground/5 disabled:opacity-60 self-start mt-0"
                        >
                          {savingDiscountProductId === p.id ? "..." : "Save"}
                        </button>
                      </div>

                      {/* Auto-calculated sale price preview */}
                      {(() => {
                        const regularPrice = p.regularPrice ?? p.price;
                        const discountPercent = discountPercentDraftById[p.id] ?? (p.discountPercent == null ? "" : String(p.discountPercent));
                        const calculatedSalePrice = discountPercent ? calculateSalePrice(regularPrice, discountPercent) : null;
                        
                        return calculatedSalePrice !== null ? (
                          <div className="rounded-lg bg-green-50 dark:bg-green-600/20 border border-green-200 dark:border-green-600/50 p-2">
                            <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                              💰 Customer will pay: ₹{calculatedSalePrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                              Saves ₹{(regularPrice - calculatedSalePrice).toFixed(2)}
                            </p>
                          </div>
                        ) : null;
                      })()}

                      <p className="text-xs text-foreground/50">Leave blank to remove discount</p>
                    </div>
                  </div>

                  {/* Stock Section */}
                  <div className="mb-4 space-y-2 rounded-lg bg-foreground/5 p-3">
                    <label className="block text-xs font-semibold text-foreground/70">Stock</label>
                    <div className="flex gap-2">
                      <input
                        value={stockDraftById[p.id] ?? (p.stock == null ? "" : String(p.stock))}
                        onChange={(e) =>
                          setStockDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        disabled={savingStockProductId === p.id}
                        inputMode="numeric"
                        placeholder="0"
                        className="flex-1 rounded-lg border border-foreground/15 bg-background px-2 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveStock(p.id)}
                        disabled={savingStockProductId === p.id}
                        className="px-3 py-2 rounded-lg border border-foreground/15 bg-background text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                      >
                        {savingStockProductId === p.id ? "..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Category Section */}
                  <div className="mb-4 space-y-2">
                    <label className="block text-xs font-semibold text-foreground/70">Category</label>
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
                  </div>

                  {/* Description Section */}
                  <div className="mb-4 space-y-2 rounded-lg bg-foreground/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-foreground/70">Description</label>
                      <button
                        type="button"
                        onClick={() => onGenerateAiDescription(p.id)}
                        disabled={generatingAiDescriptionProductId === p.id}
                        className="px-2 py-1 rounded-lg border border-foreground/15 bg-background text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                      >
                        {generatingAiDescriptionProductId === p.id ? "Generating..." : "✨ AI"}
                      </button>
                    </div>
                    <textarea
                      value={descriptionDraftById[p.id] ?? (p.description || "")}
                      onChange={(e) =>
                        setDescriptionDraftById((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      disabled={savingDescriptionProductId === p.id}
                      placeholder="Enter product description..."
                      className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 disabled:opacity-60 font-mono text-xs resize-none"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={() => onSaveDescription(p.id)}
                      disabled={savingDescriptionProductId === p.id}
                      className="w-full px-3 py-2 rounded-lg border border-foreground/15 bg-background text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                    >
                      {savingDescriptionProductId === p.id ? "Saving..." : "Save Description"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onMakeGlobal(p.id)}
                      disabled={savingProductId === p.id}
                      className="rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/30 disabled:opacity-60"
                    >
                      Make Global
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetActive(p.id, true)}
                      disabled={savingProductId === p.id}
                      className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-600/20 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-600/30 disabled:opacity-60"
                    >
                      Enable
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetActive(p.id, false)}
                      disabled={savingProductId === p.id}
                      className="col-span-2 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-600/20 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-600/30 disabled:opacity-60"
                    >
                      Disable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
