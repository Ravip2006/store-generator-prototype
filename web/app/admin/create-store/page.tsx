"use client";

import { useMemo, useState } from "react";

type CreateStorePayload = {
  name: string;
  slug: string;
  phone: string;
  themeColor?: string;
};

export default function CreateStorePage() {
  const [name, setName] = useState("New Store");
  const [slug, setSlug] = useState("new-store");
  const [phone, setPhone] = useState("61400111222");
  const [themeColor, setThemeColor] = useState("#0A7C2F");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate a slug from name (optional convenience)
  const suggestedSlug = useMemo(() => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "new-store";
  }, [name]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: CreateStorePayload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      phone: phone.trim(),
      themeColor: themeColor.trim(),
    };

    try {
      const res = await fetch("http://localhost:3001/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const localStoreUrl = result?.slug
    ? `http://${result.slug}.localhost:3000`
    : null;

  return (
    <div style={{ maxWidth: 640, margin: "24px auto", padding: 16, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 6 }}>Create Store</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Prototype onboarding: creates a tenant store in the API (SQLite via Prisma).
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Store name
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Keep slug in sync until user edits it
              setSlug(suggestedSlug);
            }}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Slug (used as subdomain)
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. green-mart"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Example URL: <code>http://{slug || "your-slug"}.localhost:3000</code>
          </span>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          WhatsApp phone (international format)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 61400111222 or 919999999999"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            No + sign. Used for <code>wa.me</code> links.
          </span>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Theme color
          <input
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            placeholder="#0A7C2F"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
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
          {loading ? "Creating..." : "Create store"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 8 }}>
          <b>Error:</b> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #9f9", borderRadius: 8 }}>
          <b>✅ Store created:</b>
          <pre style={{ overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>

          {localStoreUrl && (
            <p style={{ marginTop: 8 }}>
              Open store site:{" "}
              <a href={localStoreUrl} target="_blank" rel="noreferrer">
                {localStoreUrl}
              </a>
            </p>
          )}

          <p style={{ marginTop: 0, fontSize: 12, opacity: 0.7 }}>
            Note: For local subdomains, ensure <code>/etc/hosts</code> maps{" "}
            <code>{result.slug}.localhost</code> → 127.0.0.1.
          </p>
        </div>
      )}
    </div>
  );
}
