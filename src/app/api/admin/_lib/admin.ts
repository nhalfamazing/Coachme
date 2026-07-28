// Shared plumbing for /api/admin/* routes: cookie re-verification
// (middleware is the first gate, this is the second) and the
// redirect-back helper for plain HTML form posts from the console.

import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth";

export async function requireAdmin(req: Request): Promise<Response | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  const ok = await verifyAdminCookie(match?.[1]);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

/** Admin console forms post here and go back where they came from. */
export function backToConsole(req: Request, fallback: string): Response {
  const referer = req.headers.get("referer");
  let target = fallback;
  if (referer) {
    try {
      const u = new URL(referer);
      if (u.pathname.startsWith("/admin")) target = u.pathname + u.search;
    } catch { /* fall back */ }
  }
  return NextResponse.redirect(new URL(target, req.url), 303);
}
