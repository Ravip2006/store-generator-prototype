"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { canUseSupabaseStorage, uploadProductImage } from "@/lib/supabaseStorage";

type Category = { id: string; name: string };

type LookupProduct = {
  id?: string;
  gtin: string;
  name: string;
  imageUrl?: string | null;
  brand?: string | null;
  source: "master" | "local_csv" | "openfoodfacts" | "manual";
};

let barcodeCsvCache:
  | {
      loadedAtMs: number;
      map: Map<string, { name: string; imageUrl?: string; brand?: string; price?: string }>;
    }
  | null = null;

async function loadLocalBarcodeCatalogCsv(): Promise<
  Map<string, { name: string; imageUrl?: string; brand?: string; price?: string }>
> {
  const now = Date.now();
  if (barcodeCsvCache && now - barcodeCsvCache.loadedAtMs < 5 * 60 * 1000) {
    return barcodeCsvCache.map;
  }

  const res = await fetch("/barcode_catalog.csv", { cache: "no-store" });
  if (!res.ok) {
    barcodeCsvCache = { loadedAtMs: now, map: new Map() };
    return barcodeCsvCache.map;
  }

  const text = await res.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Expected header: gtin,name,imageUrl,brand,price
  const map = new Map<string, { name: string; imageUrl?: string; brand?: string; price?: string }>();
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const parts = line.split(",");
    const gtin = String(parts[0] || "").trim().replace(/\D/g, "");
    const name = String(parts[1] || "").trim();
    const imageUrl = String(parts[2] || "").trim();
    const brand = String(parts[3] || "").trim();
    const price = String(parts[4] || "").trim();

    if (!gtin || !name) continue;
    map.set(gtin, {
      name,
      ...(imageUrl ? { imageUrl } : {}),
      ...(brand ? { brand } : {}),
      ...(price ? { price } : {}),
    });
  }

  barcodeCsvCache = { loadedAtMs: now, map };
  return map;
}

function normalizeGtin(input: string) {
  return String(input || "").replace(/\D/g, "").trim();
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 4.5L8 6H6.5C5.4 6 4.5 6.9 4.5 8V18c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H16l-1-1.5H9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BarcodeScannerOverlay({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    (async () => {
      try {
        setError(null);
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500,
        });

        controls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, err) => {
          if (stopped) return;
          if (result) {
            const text = String(result.getText() || "").trim();
            if (text) {
              onDetected(text);
            }
          }
          // Ignore decode errors; scanner keeps running.
          void err;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start camera");
      }
    })();

    return () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {
        // ignore
      }
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-white/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <div className="text-sm font-semibold">Scan EAN-13 barcode</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <b>Error:</b> {error}
            </div>
          ) : (
            <div className="mb-3 rounded-xl border border-foreground/10 bg-foreground/5 p-3 text-xs text-foreground/70">
              Point your camera at the barcode. Scanning starts automatically.
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-foreground/10 bg-black">
            <video ref={videoRef} className="w-full h-[340px] object-cover" muted playsInline />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  const imageBucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [slug, setSlug] = useState("green-mart");
  const [loadingStores, setLoadingStores] = useState(false);
  const [name, setName] = useState("New Product");
  const [price, setPrice] = useState("10.0");
  const [quantity, setQuantity] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [gtin, setGtin] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupProduct | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  async function lookupByBarcode(raw: string) {
    const normalized = normalizeGtin(raw);
    setGtin(normalized);
    setLookupMessage(null);
    setLookupResult(null);

    if (!normalized) return;
    if (normalized.length !== 13) {
      setLookupMessage("Barcode must be 13 digits (EAN-13).");
      return;
    }

    setLookupLoading(true);
    try {
      // 1) Global master in our DB (CatalogProduct)
      const masterRes = await fetch(`/api/backend/catalog/by-gtin/${encodeURIComponent(normalized)}`, {
        cache: "no-store",
      });

      if (masterRes.ok) {
        const data = await masterRes.json().catch(() => null);
        const p = data?.product;
        const found: LookupProduct = {
          id: p?.id,
          gtin: normalized,
          name: String(p?.name || "").trim() || "Unknown product",
          imageUrl: p?.imageUrl ?? null,
          brand: p?.brand ?? null,
          source: "master",
        };
        setLookupResult(found);
        setLookupMessage("Product found in Global Master.");
        setName(found.name);
        if (found.imageUrl) setImageUrl(found.imageUrl);
        return;
      }

      // 2) Local CSV in web/public (optional)
      try {
        const csvMap = await loadLocalBarcodeCatalogCsv();
        const row = csvMap.get(normalized);
        if (row) {
          const found: LookupProduct = {
            gtin: normalized,
            name: row.name,
            imageUrl: row.imageUrl || null,
            brand: row.brand || null,
            source: "local_csv",
          };
          setLookupResult(found);
          setLookupMessage("Product found in local barcode catalog.");
          setName(found.name);
          if (row.price) setPrice(row.price);
          if (found.imageUrl) setImageUrl(found.imageUrl);
          return;
        }
      } catch {
        // ignore CSV errors
      }

      // 3) OpenFoodFacts
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${normalized}.json`, {
        cache: "no-store",
      });

      if (offRes.ok) {
        const off = await offRes.json().catch(() => null);
        if (off?.status === 1 && off?.product) {
          const prod = off.product;
          const offName = String(prod.product_name || prod.product_name_en || "").trim();
          const offBrand = String(prod.brands || "").trim();
          const offImage = String(prod.image_url || prod.image_front_url || "").trim();
          const found: LookupProduct = {
            gtin: normalized,
            name: offName || "Unknown product",
            imageUrl: offImage || null,
            brand: offBrand || null,
            source: "openfoodfacts",
          };
          setLookupResult(found);
          setLookupMessage("Product found via OpenFoodFacts.");
          if (offName) setName(offName);
          if (offImage) setImageUrl(offImage);
          return;
        }
      }

      // 4) Manual
      setLookupResult({ gtin: normalized, name: name.trim() || "", imageUrl: imageUrl.trim() || null, source: "manual" });
      setLookupMessage("Not found. Take a photo and type the product name to add to Global Master.");
    } catch (e) {
      setLookupMessage(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  }

  // Fetch available stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const res = await fetch("/api/debug/stores", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!tenant) {
          if (!cancelled) setCategories([]);
          return;
        }
        const res = await fetch(`/api/backend/categories`, {
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
  }, [tenant]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const normalizedGtin = normalizeGtin(gtin);
    const numericPrice = Number(price);
    const numericQty = Number(quantity);

    if (!slug.trim()) {
      setLoading(false);
      setError("Please select a store.");
      return;
    }

    if (Number.isNaN(numericPrice)) {
      setLoading(false);
      setError("Please enter a numeric sell price.");
      return;
    }

    if (!Number.isInteger(numericQty) || numericQty < 0) {
      setLoading(false);
      setError("Quantity must be a non-negative integer.");
      return;
    }

    const cleanName = name.trim();
    const cleanImageUrl = imageUrl.trim();

    // Barcode flow: create/update global master (CatalogProduct) and link to store via overrides.
    if (normalizedGtin && normalizedGtin.length === 13) {
      if (!cleanName) {
        setLoading(false);
        setError("Enter a product name (required to create Global Master)." );
        return;
      }

      try {
        // Ensure global master exists
        const upsertRes = await fetch(`/api/backend/catalog/by-gtin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gtin: normalizedGtin,
            name: cleanName,
            imageUrl: cleanImageUrl || undefined,
            brand: lookupResult?.brand || undefined,
          }),
        });
        const upsertData = await upsertRes.json().catch(() => ({}));
        if (!upsertRes.ok) {
          setError(upsertData?.error || `Failed to create Global Master (${upsertRes.status})`);
          return;
        }

        const productId = String(upsertData?.product?.id || "").trim();
        if (!productId) {
          setError("Global Master created, but product id missing in response.");
          return;
        }

        // Set store price/category/image override
        const linkRes = await fetch(`/api/backend/products/${encodeURIComponent(productId)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenant,
          },
          body: JSON.stringify({
            price: numericPrice,
            categoryId: categoryId.trim() || null,
            imageUrl: cleanImageUrl || null,
          }),
        });
        const linkData = await linkRes.json().catch(() => ({}));
        if (!linkRes.ok) {
          setError(linkData?.error || `Failed to set store price (${linkRes.status})`);
          return;
        }

        // Set store stock
        const stockRes = await fetch(`/api/backend/products/${encodeURIComponent(productId)}/stock`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenant,
          },
          body: JSON.stringify({ stock: numericQty, scope: "store" }),
        });
        const stockData = await stockRes.json().catch(() => ({}));
        if (!stockRes.ok) {
          setError(stockData?.error || `Failed to set quantity (${stockRes.status})`);
          return;
        }

        setResult({
          globalMaster: upsertData.product,
          storePricing: linkData,
          storeInventory: stockData,
        });
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      const res = await fetch(`/api/backend/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenant,
        },
        body: JSON.stringify({
          name: cleanName,
          price: numericPrice,
          categoryId: categoryId.trim() || undefined,
          imageUrl: cleanImageUrl || undefined,
        }),
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/40 to-emerald-50/30 dark:from-background dark:via-green-950/20 dark:to-emerald-950/10">
      <AdminHeader
        title="Add Product"
        description="Create a new product in your store"
        icon="➕"
        breadcrumbs={[{ label: "Add Product" }]}
      />

      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-200/40 dark:border-green-500/20">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">🏬 Select Store</span>
                <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-green-600/15 text-emerald-700 dark:bg-green-500/20 dark:text-emerald-300">
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
                  className="w-full rounded-xl border-2 border-green-200/60 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-300/70 transition-all"
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
                <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                  {previewUrl}
                </a>
              </span>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Product name / search</span>
              <div className="relative">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 pr-12 text-sm outline-none focus:border-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/15 bg-background text-foreground hover:bg-foreground/5"
                  aria-label="Scan barcode"
                  title="Scan barcode"
                >
                  <CameraIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground/70">EAN-13 barcode</span>
                  <button
                    type="button"
                    onClick={() => void lookupByBarcode(gtin)}
                    disabled={lookupLoading || !gtin}
                    className="rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
                  >
                    {lookupLoading ? "Looking up..." : "Lookup"}
                  </button>
                </div>
                <input
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                  placeholder="Scan or enter barcode"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
                {lookupMessage ? (
                  <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3 text-xs">
                    <div className="font-semibold">{lookupResult ? "Product Found" : "Barcode Lookup"}</div>
                    <div className="text-foreground/70">{lookupMessage}</div>
                    {lookupResult?.imageUrl ? (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={lookupResult.imageUrl}
                          alt={lookupResult.name}
                          className="h-14 w-14 rounded-lg border border-foreground/10 object-cover bg-white"
                        />
                        <div className="text-xs">
                          <div className="font-medium">{lookupResult.name}</div>
                          <div className="text-foreground/60">
                            Source: {lookupResult.source}
                            {lookupResult.brand ? ` • Brand: ${lookupResult.brand}` : ""}
                          </div>
                        </div>
                      </div>
                    ) : lookupResult ? (
                      <div className="mt-2 text-xs text-foreground/60">Source: {lookupResult.source}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
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
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
              <span className="text-xs text-foreground/60">Stored as store stock (inventory).</span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Product image (optional)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
              <div className="flex gap-2 items-center flex-wrap text-xs">
                <button
                  type="button"
                  onClick={onUploadImage}
                  disabled={uploadingImage || !imageFile}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 font-medium disabled:opacity-60 transition-all"
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
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 transition-all"
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
                <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                  {previewUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      <BarcodeScannerOverlay
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setScannerOpen(false);
          void lookupByBarcode(code);
        }}
      />
    </main>
  );
}
