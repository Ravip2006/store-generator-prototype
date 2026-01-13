"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [slug, setSlug] = useState("green-mart");
  const [name, setName] = useState("Test Customer");
  const [phone, setPhone] = useState("9999999999");
  const [email, setEmail] = useState("test@example.com");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tenant = useMemo(() => slug.trim().toLowerCase(), [slug]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/backend/customers`, {
        headers: { "x-tenant-id": tenant },
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setCustomers([]);
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      const customersList = Array.isArray(data) ? data : [];
      setCustomers(customersList);
      setFilteredCustomers(customersList);
    } catch (e) {
      setCustomers([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const cleanName = name.trim();
    if (!tenant || !cleanName) {
      setCreating(false);
      setError("Please enter a valid store slug and customer name.");
      return;
    }

    const payload = {
      name: cleanName,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };

    try {
      const res = await fetch(`/api/backend/customers`, {
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
      setPhone("");
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/20 dark:to-purple-950/20">
      <AdminHeader
        title="Customers"
        description="Create and manage customer profiles"
        icon="👥"
        breadcrumbs={[{ label: "Customers" }]}
        onSearch={handleSearch}
        showSearch={true}
      />

      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-blue-200/30 dark:border-blue-500/20 bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 p-6">

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

            <label className="grid gap-2">
              <span className="text-sm text-foreground/70">Customer name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi"
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Phone (optional)</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9999999999"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-foreground/70">Email (optional)</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. test@example.com"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create customer"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              <b>Error:</b> {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">List</h2>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {customers.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No customers yet.</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/80">No customers match your search.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-t border-foreground/10">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-foreground/70">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-foreground/70">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {new Date(c.createdAt).toLocaleString()}
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
