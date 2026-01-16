import Link from "next/link";
import { PostPurchaseAuthPrompt } from "@/components/PostPurchaseAuthPrompt";

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

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { name: string };
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  deliverySlot: string | null;
  items: OrderItem[];
};

type Store = {
  name: string;
  phone: string;
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = slug.trim().toLowerCase();
  const apiBase =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  let order: Order | null = null;
  let store: Store | null = null;
  let error: string | null = null;

  try {
    const [orderRes, storeRes] = await Promise.all([
      fetch(`${apiBase}/orders/${encodeURIComponent(id)}`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      }),
      fetch(`${apiBase}/store`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      }),
    ]);

    order = orderRes.ok ? await orderRes.json() : null;
    store = storeRes.ok ? await storeRes.json() : null;

    if (!order) {
      error = "Order not found";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-3xl p-6">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Confirmation</h1>
            <p className="mt-2 text-sm text-foreground/70">{error}</p>
            <Link
              href={`/s/${encodeURIComponent(tenant)}`}
              className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Back to store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const messageLines = [
    `New order ${order!.id}`,
    "",
    ...(order!.items || []).map(
      (it) => `${it.product?.name || it.productId} x ${it.quantity} (${formatPrice(it.unitPrice, getCurrencyForCountry(order!.country || "AU"))})`
    ),
    "",
    `Total: ${formatPrice(order!.total, getCurrencyForCountry(order!.country || "AU"))}`,
    order!.deliverySlot ? `Delivery slot: ${order!.deliverySlot}` : "",
    order!.customerName ? `Name: ${order!.customerName}` : "",
    order!.customerPhone ? `Phone: ${order!.customerPhone}` : "",
    order!.addressLine1 ? `Address: ${order!.addressLine1}` : "",
    [order!.city, order!.postalCode, order!.country].filter(Boolean).join(", "),
  ].filter(Boolean);

  const whatsappHref = store?.phone
    ? `https://wa.me/${store.phone}?text=${encodeURIComponent(messageLines.join("\n"))}`
    : null;

  return (
    <main
      style={{ "--foreground": "#E5E7EB", "--background": "#05070b" } as Record<string, string>}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(180deg,_#05070b_0%,_#0a0d14_45%,_#0c0f16_100%)] text-slate-100"
    >
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Order confirmed</h1>
          <p className="mt-1 text-sm text-white/70">
            Order <span className="font-mono">{order!.id}</span>
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Total</span>
              <span className="text-sm font-semibold">{formatPrice(order!.total, getCurrencyForCountry(order!.country || "AU"))}</span>
            </div>
            {order!.deliverySlot && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-white/70">Delivery slot</span>
                <span className="text-sm">{order!.deliverySlot}</span>
              </div>
            )}
          </div>

          <h2 className="mt-6 text-base font-semibold text-white">Items</h2>
          <div className="mt-3 grid gap-2">
            {order!.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl"
              >
                <div className="text-sm font-medium">
                  {it.product?.name || it.productId}
                </div>
                <div className="text-sm text-white/70">
                  × {it.quantity} ({formatPrice(it.unitPrice, getCurrencyForCountry(order!.country || "AU"))})
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/s/${encodeURIComponent(tenant)}`}
              className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white"
            >
              Continue shopping
            </Link>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white"
              >
                Send order to store on WhatsApp
              </a>
            )}
          </div>

          <PostPurchaseAuthPrompt tenant={tenant} />
        </div>
      </div>
    </main>
  );
}
