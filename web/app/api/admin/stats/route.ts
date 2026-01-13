import { NextResponse } from "next/server";

function getApiBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3001"
  );
}

export async function GET() {
  const apiBase = getApiBase();

  try {
    const res = await fetch(`${apiBase}/admin/stats`, {
      cache: "no-store",
      // Server-side proxy; no credentials forwarded.
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { error: "Invalid response" }, {
      status: res.status,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to reach API",
        details: e instanceof Error ? e.message : String(e),
        stores: 0,
        products: 0,
        orders: 0,
        customers: 0,
      },
      { status: 502 }
    );
  }
}
