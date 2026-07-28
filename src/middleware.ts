import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth";

// Gate everything under /admin and /api/admin behind the signed admin
// cookie. The /admin root itself is allowed through: it renders the
// login form when unauthenticated. /api/admin/login must stay open or
// nobody could log in. Every admin API route ALSO re-verifies the
// cookie itself (belt and suspenders; middleware config mistakes must
// not silently expose moderation APIs).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const authed = await verifyAdminCookie(cookie);
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (pathname === "/admin") {
    // Renders the login form itself.
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
