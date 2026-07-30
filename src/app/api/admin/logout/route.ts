import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieFromHeader, readAdminSession } from "@/lib/admin-auth";
import { clientIp, recordAdminAction } from "@/lib/admin-audit";

// Sign out: clear the cookie and record who left. The session is read BEFORE
// the cookie is cleared — that is what makes the audit line attributable to a
// person rather than to nobody.
export async function POST(req: Request) {
  const email = await readAdminSession(adminCookieFromHeader(req.headers.get("cookie")));
  if (email) {
    await recordAdminAction({ email, action: "signed_out", detail: `ip=${clientIp(req)}` });
  }
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
