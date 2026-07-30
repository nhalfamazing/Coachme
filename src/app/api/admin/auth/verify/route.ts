import { NextResponse } from "next/server";
import { guarded } from "../../../_lib/api";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, signAdminCookie } from "@/lib/admin-auth";
import { redeemMagicLink } from "@/lib/admin-link";
import { clientIp, recordAdminAction } from "@/lib/admin-audit";

/* Redeem a magic link and start a session.
 *
 * The token arrives in the query string, which is the one unavoidable
 * exposure in this design: it is in the URL bar for the moment of the
 * redirect and may land in browser history. Three things bound the damage —
 * the token is single use, it expires in 15 minutes, and this route redirects
 * (303) to a clean /admin URL immediately, so the token is not the address
 * the browser keeps for the console.
 *
 * Failures never say why. "Expired", "already used", and "never existed" are
 * one message to the visitor; the audit log holds the real reason. */

export const dynamic = "force-dynamic";

function toLogin(req: Request, status: "invalid" | "sent" | null) {
  const url = new URL(status ? `/admin/login?status=${status}` : "/admin/login", req.url);
  return NextResponse.redirect(url, 303);
}

export async function GET(req: Request) {
  return guarded(async () => {
    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent") ?? "";
    const token = new URL(req.url).searchParams.get("token") ?? "";

    // Shape check before touching the database: the token is always 32 bytes
    // hex, so anything else is not worth a query.
    if (!/^[0-9a-f]{64}$/.test(token)) {
      await recordAdminAction({ action: "link_redemption_failed", detail: `ip=${ip}; malformed token` });
      return toLogin(req, "invalid");
    }

    const result = await redeemMagicLink(token, ip, userAgent);
    if (!result.ok) {
      await recordAdminAction({
        email: result.email,
        action: "link_redemption_failed",
        detail: `ip=${ip}; ${result.reason}`,
      });
      return toLogin(req, "invalid");
    }

    // The allowlist is re-checked inside signAdminCookie: a link minted for
    // an address that has since been removed from ADMIN_EMAILS is dead even
    // though it redeemed cleanly.
    const cookie = await signAdminCookie(result.email);
    if (!cookie) {
      await recordAdminAction({
        email: result.email,
        action: "link_redemption_failed",
        detail: `ip=${ip}; no session issued (address off allowlist, or signing key missing)`,
      });
      return toLogin(req, "invalid");
    }

    await recordAdminAction({ email: result.email, action: "link_redeemed", detail: `ip=${ip}` });

    const res = NextResponse.redirect(new URL("/admin", req.url), 303);
    res.cookies.set(ADMIN_COOKIE, cookie, ADMIN_COOKIE_OPTIONS);
    return res;
  });
}
