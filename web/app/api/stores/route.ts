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
    const res = await fetch(`${apiBase}/stores`, {
      cache: "no-store",
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
      },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  const apiBase = getApiBase();

  try {
    const body = await req.text();

    const res = await fetch(`${apiBase}/stores`, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
        Accept: "application/json",
      },
      body,
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
      },
      { status: 502 }
    );
  }
}
