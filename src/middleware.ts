import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/admin-auth";

// Gate everything under /admin and /api/admin behind the signed session
// cookie. Two paths must stay open or nobody could ever sign in:
//   /admin/login            renders the form
//   /api/admin/auth/*       requests and redeems the magic link
// Everything else requires a live session belonging to an address that is
// STILL on the code allowlist (readAdminSession re-checks it), so removing
// someone and deploying locks them out on their next request rather than
// whenever their cookie happens to expire.
//
// Unlike the gate this replaces, /admin itself is NOT open — it used to
// render the login form, and now there is a dedicated page for that.
//
// Every admin API route ALSO re-verifies the cookie itself (belt and
// braces; a mistake in the matcher below must not silently expose the
// moderation APIs).
const OPEN_PATHS = ["/admin/login", "/api/admin/auth/request", "/api/admin/auth/verify"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();

  const email = await readAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
  if (email) return NextResponse.next();

  // Signing out is the one action that is safe unauthenticated: it only
  // clears a cookie. Bouncing it to the login page would leave a stale
  // cookie sitting in the browser.
  if (pathname === "/api/admin/logout") return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
