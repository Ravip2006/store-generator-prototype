"use client";

import { useState } from "react";

export default function AddProductPage() {
  const [slug, setSlug] = useState("green-mart");
  const [name, setName] = useState("New Product");
  const [price, setPrice] = useState("10.0");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      name: name.trim(),
      price: Number(price),
    };

    if (!slug.trim() || !payload.name || Number.isNaN(payload.price)) {
      setLoading(false);
      setError("Please enter a valid slug, name and numeric price.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": slug.trim().toLowerCase(),
        },
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

  const previewUrl = `http://localhost:3000/s/${slug.trim().toLowerCase()}`;

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

      {result && (
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
