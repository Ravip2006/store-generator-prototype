import { NextResponse } from "next/server";

function getApiBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3001"
  );
}

function buildHeaders(req: Request) {
  const headers = new Headers();

  // Forward content type for JSON payloads, and accept JSON by default.
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const accept = req.headers.get("accept") || "application/json";
  headers.set("accept", accept);

  // Forward tenant context (used by API/RLS).
  const tenant = req.headers.get("x-tenant-id");
  if (tenant) headers.set("x-tenant-id", tenant);

  return headers;
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const apiBase = getApiBase();
  const { path = [] } = await ctx.params;

  const url = new URL(req.url);
  const upstreamUrl = `${apiBase}/${path.map(encodeURIComponent).join("/")}${url.search}`;

  const method = req.method.toUpperCase();
  const headers = buildHeaders(req);

  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  try {
    const res = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const buf = await res.arrayBuffer();

    return new NextResponse(buf, {
      status: res.status,
      headers: {
        "content-type": contentType,
      },
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

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function PUT(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
