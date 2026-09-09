import { NextResponse } from "next/server";

// Admin route protection is handled server-side in the App Router layouts and server actions.
// This legacy proxy is intentionally inert to avoid the old hardcoded password / JWT flow.
export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
