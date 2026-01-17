"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowHoverCard } from "@/components/GlowHoverCard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { AuthModal } from "@/components/AuthModal";

type Store = {
  name: string;
  phone: string;
  themeColor: string;
  currency?: string;
  country?: string;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type CartLine = {
  product: Product;
  quantity: number;
};

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};


function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    Number.isFinite(v.price)
  );
}

function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("") || "S";
}

function hexWithAlpha(hex: string, alphaHex: string) {
  const value = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return null;
  return `${value}${alphaHex}`;
}

function readableTextOnAccent(hex?: string) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5 ? "#ffffff" : "#0b0f18";
}

function TrolleyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L22 8H6" />
    </svg>
  );
}

// Currency formatter based on country code
function formatPrice(price: number, currency: string = "AUD"): string {
  const currencySymbols: Record<string, string> = {
    AUD: "$",
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€",
  };
  const symbol = currencySymbols[currency] || "$";
  return `${symbol}${price.toFixed(2)}`;
}

function getCurrencyForCountry(country: string): string {
  const countryToCurrency: Record<string, string> = {
    AU: "AUD",
    IN: "INR",
    US: "USD",
    GB: "GBP",
    EU: "EUR",
  };
  return countryToCurrency[country?.toUpperCase() || "AU"] || "AUD";
}

export default function StoreFront({ slug }: { slug: string }) {
  const tenant = slug.trim().toLowerCase();
  const router = useRouter();

  function cartStorageKey(currentTenant: string) {
    return `storegen:cart:${currentTenant}`;
  }

  function lastOrderStorageKey(currentTenant: string) {
    return `storegen:lastOrderId:${currentTenant}`;
  }

  function legacyCartStorageKey(currentTenant: string) {
    return `cart:${currentTenant}`;
  }

  function coerceCartRecord(value: unknown): Record<string, CartLine> {
    if (!value || typeof value !== "object") return {};

    // Accept either the current schema: { [productId]: { product, quantity } }
    // or legacy schema: { items: [{ product, qty|quantity }] }
    const maybeRecord = value as Record<string, unknown>;
    const maybeItems = maybeRecord.items;
    if (Array.isArray(maybeItems)) {
      const next: Record<string, CartLine> = {};
      for (const item of maybeItems) {
        if (!item || typeof item !== "object") continue;
        const it = item as Record<string, unknown>;
        const product = it.product;
        const qty = Number(it.quantity ?? it.qty);
        if (!isProduct(product)) continue;
        if (!Number.isFinite(qty) || qty <= 0) continue;
        next[product.id] = { product, quantity: Math.floor(qty) };
      }
      return next;
    }

    const next: Record<string, CartLine> = {};
    for (const [productId, line] of Object.entries(maybeRecord)) {
      if (!line || typeof line !== "object") continue;
      const l = line as Record<string, unknown>;
      const product = l.product;
      const qty = Number(l.quantity);
      if (!isProduct(product)) continue;
      if (productId !== product.id) continue;
      if (!Number.isFinite(qty) || qty <= 0) continue;
      next[productId] = { product, quantity: Math.floor(qty) };
    }
    return next;
  }

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const [cart, setCart] = useState<Record<string, CartLine>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [cartPanelView, setCartPanelView] = useState<"cart" | "checkout">("cart");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [productsToShow, setProductsToShow] = useState(12);
  const [selectedCountry, setSelectedCountry] = useState<string>("AU");
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();

  const previousTenantRef = useRef<string>(tenant);
  const cartPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (cartPulseTimerRef.current) clearTimeout(cartPulseTimerRef.current);
      if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current);
    };
  }, []);

  // Clear user when switching stores
  useEffect(() => {
    if (previousTenantRef.current !== tenant) {
      // Always sign out when switching stores, regardless of auth state
      void signOut();
    }
    previousTenantRef.current = tenant;
  }, [tenant, signOut]);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [cartLines]
  );

  const cartItemCount = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.quantity, 0),
    [cartLines]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      // Show product if: no category selected, OR product's categoryId matches selected, OR product has no category (null)
      const matchesCategory = !categoryId || p.categoryId === categoryId || p.categoryId === null;
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, categoryId]);


  function persist(nextCart: Record<string, CartLine>) {
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(nextCart));
    } catch {
      // ignore
    }
  }

  function triggerAddAnimations(productId: string) {
    setJustAddedProductId(productId);
    if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current);
    justAddedTimerRef.current = setTimeout(() => setJustAddedProductId(null), 900);

    setCartPulse(true);
    if (cartPulseTimerRef.current) clearTimeout(cartPulseTimerRef.current);
    cartPulseTimerRef.current = setTimeout(() => setCartPulse(false), 450);
  }

  function addToCart(product: Product) {
    triggerAddAnimations(product.id);
    setCart((prev) => {
      const existing = prev[product.id];
      const nextQty = (existing?.quantity || 0) + 1;
      const next = {
        ...prev,
        [product.id]: { product, quantity: nextQty },
      };
      persist(next);
      return next;
    });
  }

  function quantityInCart(productId: string) {
    return cart[productId]?.quantity || 0;
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      let next: Record<string, CartLine>;
      if (nextQty <= 0) {
        next = { ...prev };
        delete next[productId];
      } else {
        next = { ...prev, [productId]: { ...existing, quantity: nextQty } };
      }
      persist(next);
      return next;
    });
  }

  function clearCart() {
    setCart({});
    try {
      localStorage.removeItem(cartStorageKey(tenant));
    } catch {
      // ignore
    }
  }

  // Load cart from localStorage per tenant
  useEffect(() => {
    try {
      const primaryKey = cartStorageKey(tenant);
      const legacyKey = legacyCartStorageKey(tenant);

      const primaryRaw = localStorage.getItem(primaryKey);
      const legacyRaw = primaryRaw ? null : localStorage.getItem(legacyKey);

      const raw = primaryRaw ?? legacyRaw;
      if (!raw) {
        setCart({});
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = coerceCartRecord(parsed);
      setCart(normalized);

      // If we loaded legacy data, migrate it to the canonical key.
      if (!primaryRaw && legacyRaw) {
        try {
          localStorage.setItem(primaryKey, JSON.stringify(normalized));
          localStorage.removeItem(legacyKey);
        } catch {
          // ignore
        }
      }
    } catch {
      setCart({});
    }
  }, [tenant]);

  // Close account menu when cart opens
  useEffect(() => {
    if (cartPanelOpen) {
      setAccountMenuOpen(false);
    }
  }, [cartPanelOpen]);

  // Close account menu when clicking outside
  useEffect(() => {
    if (!accountMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-account-menu]")) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  // Persist cart to localStorage per tenant
  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey(tenant), JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [tenant, cart]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [storeRes, categoriesRes, productsRes] = await Promise.all([
        fetch(`/api/backend/store`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
        fetch(`/api/backend/categories`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
        fetch(`/api/backend/products`, {
          headers: { "x-tenant-id": tenant },
          cache: "no-store",
        }),
      ]);

      const storeData = await storeRes.json().catch(() => null);
      const categoriesData = await categoriesRes.json().catch(() => []);
      const productsData = await productsRes.json().catch(() => []);

      if (!storeRes.ok) throw new Error(storeData?.error || "Store not found");
      setStore(storeData);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (e) {
      setStore(null);
      setCategories([]);
      setProducts([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  function whatsappPhone(): string | null {
    const raw = store?.phone || "";
    const digits = raw.replace(/[^0-9]/g, "");
    return digits ? digits : null;
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cartItemCount === 0) setCartPanelOpen(false);
  }, [cartItemCount]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lastOrderStorageKey(tenant));
      const clean = String(raw || "").trim();
      setLastOrderId(clean || null);
    } catch {
      setLastOrderId(null);
    }
  }, [tenant]);

  if (loading) {
    return (
      <main
        style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
      >
        <div className="mx-auto w-full max-w-5xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <div className="h-7 w-48 rounded-lg bg-foreground/10" />
            <div className="mt-3 h-4 w-72 rounded-lg bg-foreground/10" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
              <div className="h-24 rounded-2xl border border-foreground/10 bg-foreground/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !store) {
    return (
      <main
        style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
      >
        <div className="mx-auto w-full max-w-5xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Store unavailable</h1>
            <p className="mt-2 text-sm text-foreground/70">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const storeName = store?.name || "Store";
  const accent = store?.themeColor || undefined;
  const accentText = readableTextOnAccent(accent);
  const logoText = initialsFromName(storeName);
  const currentYear = new Date().getFullYear();
  const whatsappStoreHref = (() => {
    const phone = whatsappPhone();
    return phone ? `https://wa.me/${phone}` : null;
  })();

  return (
    <motion.main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <header
        className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl"
        style={
          accent
            ? {
                backgroundColor: accent,
                backgroundImage: `linear-gradient(135deg, ${accent}, ${hexWithAlpha(accent, "CC") ?? accent})`,
              }
            : undefined
        }
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-xs font-black tracking-tight"
              >
                <span className="text-white">{logoText}</span>
              </div>
              <h1 className="truncate text-lg font-black tracking-tight text-white sm:text-2xl">
                {storeName}
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {/* Country Selector */}
            <div className="relative" data-country-menu>
              <button
                type="button"
                onClick={() => setShowCountryMenu(!showCountryMenu)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2 py-2 text-xs font-bold text-white hover:bg-white/15 transition-colors sm:px-3 sm:py-2 sm:text-sm"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{selectedCountry}</span>
              </button>

              {showCountryMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/15 bg-black/80 shadow-lg shadow-black/40 z-50 overflow-hidden backdrop-blur-xl">
                  {[
                    { code: "AU", name: "Australia (AUD)" },
                    { code: "IN", name: "India (INR)" },
                    { code: "US", name: "United States (USD)" },
                    { code: "GB", name: "United Kingdom (GBP)" },
                  ].map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country.code);
                        setShowCountryMenu(false);
                        try {
                          localStorage.setItem(`storegen:country:${tenant}`, country.code);
                        } catch {
                          // ignore
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0 ${
                        selectedCountry === country.code ? "bg-white/10" : ""
                      }`}
                      style={
                        selectedCountry === country.code && accent
                          ? { color: accent, backgroundColor: `${accent}15` }
                          : undefined
                      }
                    >
                      <span className="text-lg mr-2">
                        {country.code === "AU" && "🇦🇺"}
                        {country.code === "IN" && "🇮🇳"}
                        {country.code === "US" && "🇺🇸"}
                        {country.code === "GB" && "🇬🇧"}
                      </span>
                      {country.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {whatsappStoreHref && (
              <a
                href={whatsappStoreHref}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15 sm:inline-flex"
              >
                WhatsApp
              </a>
            )}

            {/* Account menu */}
            {isAuthenticated && (
              <div className="relative" data-account-menu>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15 transition-colors"
                >
                  <span className="hidden sm:inline">👤</span>
                  <span className="hidden sm:inline">{user?.name || user?.email?.split("@")[0] || "Account"}</span>
                  <span className="sm:hidden">👤</span>
                </button>

                {/* Account dropdown */}
                {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/15 bg-black/80 shadow-xl shadow-black/50 z-50 backdrop-blur-xl" data-account-menu>
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{user?.name || "Account"}</p>
                      <p className="text-xs text-white/60 mt-0.5">{user?.email}</p>
                    </div>

                    <Link
                      href={`/s/${encodeURIComponent(tenant)}/orders`}
                      className="block px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 border-b border-white/10 transition-colors"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      📋 My Orders
                    </Link>

                    <button
                      type="button"
                      onClick={async () => {
                        await signOut();
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-300 hover:bg-white/10 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15 transition-colors sm:px-4 sm:py-2 sm:text-sm"
                title="Sign In"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setCartPanelOpen((v) => {
                  const next = !v;
                  if (next) setCartPanelView("cart");
                  return next;
                })
              }
              className={`relative ml-auto inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.99] ${
                cartPulse ? "ring-2 ring-white/30 shadow-lg shadow-black/10 scale-[1.02]" : ""
              }`}
              aria-label="Open cart"
            >
              <TrolleyIcon className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="hidden sm:inline">Cart</span>
                <span className="hidden text-xs font-medium sm:inline">
                  {formatPrice(cartTotal, getCurrencyForCountry(selectedCountry))}
                </span>
              </div>
              {cartItemCount > 0 && (
                <span
                  className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ${
                    cartPulse ? "animate-pulse" : ""
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-black/10 to-transparent" />

          <div className="relative p-6 md:p-8">
            <div
              className="absolute inset-0 -m-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 opacity-40"
              style={
                accent
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${hexWithAlpha(accent, "1A")}, ${hexWithAlpha(accent, "0A")})`,
                    }
                  : undefined
              }
            />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Welcome to {storeName}
                </h2>
                <p className="mt-3 text-base text-white/70 sm:text-lg">
                  Your one-stop shop for fresh picks and fast checkouts. Browse our products and start your order.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 shadow-sm backdrop-blur-sm">
                  <TrolleyIcon className="h-4 w-4" />
                  <span>
                    <span className="font-bold">{cartItemCount}</span> items in cart
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                <b>Error:</b> {error}
              </div>
            )}

            <div className="mt-8 grid gap-4 lg:grid-cols-[240px_1fr]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold">Categories</div>
                  <div className="mt-3 grid gap-1">
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      style={
                        !categoryId && store?.themeColor
                          ? {
                              borderLeftColor: store.themeColor,
                              color: accentText,
                              backgroundColor:
                                hexWithAlpha(store.themeColor, "14") ?? undefined,
                            }
                          : undefined
                      }
                      className={
                        categoryId
                          ? "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/10"
                          : "w-full rounded-xl border border-white/15 border-l-4 bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white"
                      }
                    >
                      All products
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        style={
                          categoryId === c.id && store?.themeColor
                            ? {
                                borderLeftColor: store.themeColor,
                                color: accentText,
                                backgroundColor:
                                  hexWithAlpha(store.themeColor, "14") ?? undefined,
                              }
                            : undefined
                        }
                        className={
                          categoryId === c.id
                            ? "w-full rounded-xl border border-white/15 border-l-4 bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white"
                            : "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/10"
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-white">Products</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products"
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20"
                    />
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 sm:max-w-60 lg:hidden"
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      style={
                        !categoryId && store?.themeColor
                          ? {
                              borderColor: store.themeColor,
                              color: accentText,
                              backgroundColor:
                                hexWithAlpha(store.themeColor, "14") ?? undefined,
                            }
                          : undefined
                      }
                      className={
                        categoryId
                          ? "whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/10"
                          : "whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                      }
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        style={
                          categoryId === c.id && store?.themeColor
                            ? {
                                borderColor: store.themeColor,
                                color: accentText,
                                backgroundColor:
                                  hexWithAlpha(store.themeColor, "14") ?? undefined,
                              }
                            : undefined
                        }
                        className={
                          categoryId === c.id
                            ? "whitespace-nowrap rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold"
                            : "whitespace-nowrap rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-medium hover:bg-foreground/5"
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                    <div className="text-sm font-semibold">No products found</div>
                    <p className="mt-1 text-sm text-foreground/70">
                      Try clearing the search or switching categories.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-2 border-b border-foreground/10 pb-4">
                      <p className="text-sm font-semibold text-foreground">
                        Showing <span className="font-bold">{Math.min(productsToShow, filteredProducts.length)}</span> of <span className="font-bold">{filteredProducts.length}</span> products
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.slice(0, productsToShow).map((p) => {
                        const isJustAdded = justAddedProductId === p.id;
                        return (
                          <GlowHoverCard
                            key={p.id}
                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/40"
                            hoverScale={1.02}
                            glowSize={260}
                          >
                          <Link
                            href={`/s/${encodeURIComponent(tenant)}/product/${encodeURIComponent(String(p.id))}`}
                            className="block"
                          >
                            <div className="aspect-square w-full overflow-hidden bg-white/10 sm:aspect-[4/3] flex items-center justify-center border-b border-white/5">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="block h-full w-full object-contain sm:object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                                  No image
                                </div>
                              )}
                            </div>
                          </Link>

                            <div className="flex flex-1 flex-col p-5">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-white">
                                <Link
                                  href={`/s/${encodeURIComponent(tenant)}/product/${encodeURIComponent(String(p.id))}`}
                                  className="hover:underline"
                                >
                                  {p.name}
                                </Link>
                              </h3>
                              {p.category?.name && (
                                <p className="mt-1 text-xs font-medium text-white/60">{p.category.name}</p>
                              )}
                            </div>

                            <Link
                              href={`/s/${encodeURIComponent(tenant)}/product/${encodeURIComponent(String(p.id))}`}
                              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 sm:hidden"
                            >
                              Quick View
                            </Link>

                            <p className="mt-4 text-lg font-bold text-white" style={accent ? { color: accent } : {}}>
                              {formatPrice(p.price, getCurrencyForCountry(selectedCountry))}
                            </p>
                          </div>

                          <div className="border-t border-white/10 p-5">
                            {quantityInCart(p.id) > 0 ? (
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(p.id)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-bold text-white transition-all duration-150 hover:bg-white/20 hover:shadow-sm active:scale-95"
                                  style={accent ? { color: accent, borderColor: `${accent}40` } : {}}
                                >
                                  −
                                </button>
                                <span className="flex-1 text-center text-base font-semibold text-white">
                                  {quantityInCart(p.id)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(p)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-bold text-white transition-all duration-150 hover:bg-white/20 hover:shadow-sm active:scale-95"
                                  style={accent ? { color: accent, borderColor: `${accent}40` } : {}}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                type="button"
                                onClick={() => addToCart(p)}
                                animate={
                                  isJustAdded
                                    ? {
                                        scale: [1, 1.06, 1],
                                        boxShadow: accent
                                          ? `0 0 0 1px ${hexWithAlpha(accent, "66")}, 0 12px 30px ${hexWithAlpha(accent, "66")}`
                                          : "0 0 0 1px rgba(52,211,153,0.6), 0 12px 30px rgba(16,185,129,0.45)",
                                      }
                                    : { scale: 1 }
                                }
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="group/button relative w-full overflow-hidden rounded-full px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                                style={
                                  accent
                                    ? {
                                        backgroundColor: accent,
                                        boxShadow: `0 4px 15px ${hexWithAlpha(accent, "4D")}`,
                                      }
                                    : { backgroundColor: "#000" }
                                }
                              >
                                <span className="relative z-10">{isJustAdded ? "Added ✓" : "Add to Cart"}</span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-[1px] transition-transform duration-700 ease-out ${
                                    isJustAdded
                                      ? "translate-x-[240%]"
                                      : "-translate-x-[140%] group-hover:translate-x-[240%]"
                                  }`}
                                />
                              </motion.button>
                            )}
                          </div>
                          </GlowHoverCard>
                        );
                      })}
                    </div>

                    {filteredProducts.length > 0 && productsToShow < filteredProducts.length && (
                      <div className="flex flex-col gap-3 border-t border-foreground/10 pt-6">
                        <div className="flex flex-col gap-2">
                          <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
                            <div 
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${(Math.min(productsToShow, filteredProducts.length) / filteredProducts.length) * 100}%`,
                                backgroundColor: accent || "#0A7C2F"
                              }}
                              aria-valuenow={Math.min(productsToShow, filteredProducts.length)}
                              aria-valuemin={0}
                              aria-valuemax={filteredProducts.length}
                              role="progressbar"
                            />
                          </div>
                          <p className="text-xs font-semibold text-foreground text-center">
                            {Math.round((Math.min(productsToShow, filteredProducts.length) / filteredProducts.length) * 100)}% loaded
                          </p>
                        </div>
                        
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => setProductsToShow((prev) => prev + 12)}
                            className="px-6 py-2.5 text-sm font-bold text-white rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                            style={{
                              background: 'linear-gradient(135deg, #000000, #333333)',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                            }}
                          >
                            <span className="relative z-10 flex items-center gap-2 justify-center">
                              <span>Load more</span>
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xs font-bold tracking-tight shadow-sm"
                  style={accent ? { backgroundColor: accent } : undefined}
                >
                  <span className="text-white">{logoText}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{storeName}</div>
                  <div className="truncate text-xs text-white/60">Fast delivery • Easy ordering</div>
                </div>
              </div>

              {store?.phone ? (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex text-sm font-medium underline underline-offset-4 text-white/80 hover:text-white"
                >
                  Call store
                </a>
              ) : (
                <div className="text-sm text-white/60">Store phone not available</div>
              )}
              {whatsappStoreHref ? (
                <a
                  href={whatsappStoreHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium underline underline-offset-4 text-white/80 hover:text-white"
                >
                  WhatsApp store
                </a>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Company</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#about-store" className="hover:text-white">About</a>
                <a href="#contact" className="hover:text-white">Contact</a>
                <a href="#top" className="hover:text-white">Back to top</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Help</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#delivery" className="hover:text-white">Delivery info</a>
                <a href="#cancellation-policy" className="hover:text-white">Cancellation policy</a>
                <a href="#support" className="hover:text-white">Support</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Legal</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <a href="#terms" className="hover:text-white">Terms</a>
                <a href="#privacy" className="hover:text-white">Privacy</a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div id="about-store" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">About</div>
              <p className="mt-2 text-sm text-white/70">
                {storeName} is a local store. Prices and availability may vary by location.
              </p>
            </div>

            <div id="contact" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Contact</div>
              <p className="mt-2 text-sm text-white/70">
                For order updates, you can call or WhatsApp the store.
              </p>
            </div>

            <div id="delivery" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Delivery info</div>
              <p className="mt-2 text-sm text-white/70">
                Delivery slots are subject to availability. Exact timings can vary based on demand and address.
              </p>
            </div>

            <div id="support" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Support</div>
              <p className="mt-2 text-sm text-white/70">
                If you received a damaged or incorrect item, contact the store as soon as possible.
              </p>
            </div>

            <div id="cancellation-policy" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Cancellation policy</div>
              <p className="mt-2 text-sm text-white/70">
                Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund may be provided, if applicable.
              </p>
            </div>

            <div id="terms" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Terms</div>
              <p className="mt-2 text-sm text-white/70">
                By placing an order, you agree to provide accurate contact and delivery details.
              </p>
            </div>

            <div id="privacy" className="scroll-mt-24">
              <div className="text-sm font-semibold text-white">Privacy</div>
              <p className="mt-2 text-sm text-white/70">
                Your information is used only to fulfill your order and contact you about delivery.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <div>© {currentYear} {storeName}. All rights reserved.</div>
            <div>Powered by Store Generator</div>
          </div>
        </div>
      </footer>

      {cartPanelOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 z-0 bg-black/40"
            onClick={() => {
              setCartPanelOpen(false);
              setCartPanelView("cart");
            }}
          />

          <div className="absolute right-0 top-0 z-10 h-full w-full max-w-md border-l border-white/10 bg-black/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10"
                      style={accent ? { backgroundColor: accent } : undefined}
                    >
                      <TrolleyIcon className="h-5 w-5 text-background" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white">My cart</div>
                      <div className="text-xs text-white/60">
                        {cartItemCount} item{cartItemCount === 1 ? "" : "s"} • {formatPrice(cartTotal, getCurrencyForCountry(selectedCountry))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/s/${encodeURIComponent(tenant)}/cart`}
                    onClick={() => {
                      setCartPanelOpen(false);
                      setCartPanelView("cart");
                    }}
                    className="text-xs font-semibold text-white underline underline-offset-4 hover:text-white"
                  >
                    Open checkout
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCartPanelOpen(false);
                      setCartPanelView("cart");
                    }}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="h-full overflow-y-auto p-4 sm:p-5">
              {cartItemCount === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-white">Your cart is empty</div>
                  <p className="mt-1 text-sm text-white/70">
                    Add a few products to start checkout.
                  </p>
                </div>
              ) : cartPanelView === "checkout" ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/40 backdrop-blur-xl">
                    <div className="text-sm font-semibold text-white">Checkout</div>

                    {authLoading ? (
                      <p className="mt-1 text-sm text-white/70">Checking login…</p>
                    ) : isAuthenticated ? (
                      <p className="mt-1 text-sm text-white/70">
                        ✅ You’re logged in as <span className="font-semibold">{user?.name || user?.email}</span>. We’ll speed up checkout.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-white/70">
                        Continue as guest (recommended) or log in to save details and track orders.
                      </p>
                    )}

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCartPanelOpen(false);
                          setCartPanelView("cart");
                          router.push(`/s/${encodeURIComponent(tenant)}/cart`);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                        style={accent ? { backgroundColor: accent, color: "white", borderColor: accent } : undefined}
                      >
                        Enter delivery details
                      </button>

                      {!authLoading && !isAuthenticated ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setAuthModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white border border-white/15 hover:bg-white/20 transition-colors"
                          >
                            Log in
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalOpen(true);
                              setIsSignUp(true);
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white border border-white/15 hover:bg-white/20 transition-colors"
                          >
                            Sign up
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-white">Quick links</div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <Link
                        href={`/s/${encodeURIComponent(tenant)}`}
                        onClick={() => {
                          setCartPanelOpen(false);
                          setCartPanelView("cart");
                        }}
                        className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-medium text-white hover:bg-white/20"
                      >
                        Buy again
                      </Link>

                      {lastOrderId ? (
                        <Link
                          href={`/s/${encodeURIComponent(tenant)}/order/${encodeURIComponent(lastOrderId)}`}
                          onClick={() => {
                            setCartPanelOpen(false);
                            setCartPanelView("cart");
                          }}
                          className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-medium text-white hover:bg-white/20"
                        >
                          My orders
                        </Link>
                      ) : (
                        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/60">
                          My orders (no recent orders yet)
                        </div>
                      )}

                      {whatsappStoreHref ? (
                        <a
                          href={whatsappStoreHref}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-medium text-white hover:bg-white/20"
                        >
                          Help & support (WhatsApp)
                        </a>
                      ) : (
                        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/60">
                          Help & support
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Keep a single CTA in this view (Continue to checkout above). */}
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {cartLines.map((l) => (
                      <div
                        key={l.product.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-background p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{l.product.name}</div>
                          <div className="text-xs text-foreground/70">
                            ₹{l.product.price} × {l.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(l.product.id)}
                            className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-sm font-semibold text-white hover:bg-white/20"
                            style={accent ? { borderColor: accent } : undefined}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(l.product)}
                            className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-sm font-semibold text-white hover:bg-white/20"
                            style={accent ? { borderColor: accent } : undefined}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-sm text-white/70">Subtotal</span>
                      <span className="text-sm font-semibold text-white">{formatPrice(cartTotal, getCurrencyForCountry(selectedCountry))}</span>
                    </div>

                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-left text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white"
                    >
                      Clear cart
                    </button>
                  </div>

                  <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-black/70 p-4 sm:p-5 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setCartPanelView("checkout")}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:brightness-110"
                      style={accent ? { backgroundColor: accent, borderColor: accent, color: "#ffffff" } : { backgroundColor: "#0f172a", color: "#ffffff" }}
                    >
                      Checkout
                    </button>
                    <p className="mt-2 text-center text-xs text-white/60">
                      You’ll enter delivery details on the next screen.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setIsSignUp(false);
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          setIsSignUp(false);
        }}
        tenant={tenant}
        initialMode={isSignUp ? "signup" : "signin"}
      />
    </motion.main>
  );
}
