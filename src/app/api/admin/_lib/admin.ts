// Shared plumbing for /api/admin/* routes: cookie re-verification
// (middleware is the first gate, this is the second) and the
// redirect-back helper for plain HTML form posts from the console.

import { NextResponse } from "next/server";
import { adminCookieFromHeader, readAdminSession } from "@/lib/admin-auth";

/** The signed-in admin, or a 401 to return. Callers need the ADDRESS, not
 *  just permission: every destructive action is logged against a person, so
 *  a route that only learned "yes, allowed" could not write a useful audit
 *  line. */
export async function requireAdmin(
  req: Request,
): Promise<{ email: string } | { response: Response }> {
  const email = await readAdminSession(adminCookieFromHeader(req.headers.get("cookie")));
  if (!email) return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { email };
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
