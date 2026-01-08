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

  return NextResponse.next({
    request: { headers },
  });
}
