import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkAdminSecret, signAdminCookie } from "@/lib/admin-auth";
import { rateLimited } from "../../_lib/api";

// Login: an HTML form posts the secret; success sets the signed
// httpOnly cookie and bounces to the console, failure bounces back to
// the form with a flag. Tightly rate-limited: this endpoint is the
// only brute-force surface the admin gate has.
export async function POST(req: Request) {
  const limited = rateLimited(req, "admin/login");
  if (limited) return limited;

  let secretValue = "";
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try { secretValue = String((await req.json())?.secret ?? ""); } catch { /* empty */ }
  } else {
    try { secretValue = String((await req.formData()).get("secret") ?? ""); } catch { /* empty */ }
  }

  if (!secretValue || !checkAdminSecret(secretValue)) {
    return NextResponse.redirect(new URL("/admin?error=1", req.url), 303);
  }

  const cookie = await signAdminCookie();
  if (!cookie) {
    return NextResponse.redirect(new URL("/admin?error=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set(ADMIN_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return res;
}
