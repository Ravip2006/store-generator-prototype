type Store = {
  id: string;
  slug: string;
  name: string;
  phone: string;
  themeColor: string;
  createdAt: string;
};

export default async function StoresPage() {
  const apiBase =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";

  let stores: Store[] = [];
  let apiOk = true;

  try {
    const res = await fetch(`${apiBase}/stores`, { cache: "no-store" });
    apiOk = res.ok;
    stores = res.ok ? await res.json() : [];
  } catch {
    apiOk = false;
    stores = [];
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
            <p className="text-sm text-foreground/70">
              Admin view of all onboarded stores (from Supabase Postgres via Prisma).
            </p>
          </div>

          {!apiOk && (
            <div className="mt-6 rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm">
              Failed to load stores from API at <span className="font-mono">{apiBase}</span>.
            </div>
          )}

          {stores.length === 0 ? (
            <p className="mt-6 text-sm text-foreground/80">No stores yet.</p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id} className="border-t border-foreground/10">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-foreground/5 px-2 py-1 font-mono text-xs">
                          {s.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3">{s.phone}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/s/${encodeURIComponent(s.slug)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline underline-offset-4 hover:text-foreground/80"
                        >
                          Open store
                        </a>
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
