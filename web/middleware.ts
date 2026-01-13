import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const hostname = host.split(":")[0];

  let tenant = "green-mart";

  if (hostname.endsWith(".localhost")) {
    tenant = hostname.split(".")[0] || tenant;
  } else if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname.includes(".")) {
    tenant = hostname.split(".")[0] || tenant;
  }

  const headers = new Headers(req.headers);
  headers.set("x-tenant-id", tenant);

  // If the user is visiting a tenant subdomain at '/', route them directly
  // to the storefront page for that tenant.
  const isPlainLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isTenantHost = !isPlainLocalhost && hostname.includes(".");
  if (isTenantHost && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/s/${encodeURIComponent(tenant)}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next({
    request: { headers },
  });
}
