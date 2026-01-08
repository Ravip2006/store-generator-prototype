import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  const headers = new Headers(req.headers);
  headers.set("x-tenant-id", subdomain);

  return NextResponse.next({
    request: { headers },
  });
}
