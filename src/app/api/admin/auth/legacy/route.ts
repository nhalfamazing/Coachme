import { NextResponse } from "next/server";
import { guarded, rateLimited } from "../../../_lib/api";
import { isAllowedAdmin, normalizeEmail } from "@/lib/admin-allowlist";
import {
  ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, legacySecretEnabled, safeEqual, signAdminCookie,
} from "@/lib/admin-auth";
import { clientIp, recordAdminAction } from "@/lib/admin-audit";

/* TEMPORARY — DELETE THIS ROUTE WHEN ADMIN_SECRET IS REMOVED IN VERCEL.
 *
 * Shared-secret sign-in, kept alive only so the deploy that ships magic-link
 * auth does not lock everyone out of the moderation console before
 * ADMIN_SESSION_SECRET and RESEND_API_KEY exist in production. Shipped by
 * explicit decision, against this work's own rule that no route may fall back
 * to the old secret.
 *
 * Three things keep it honest while it lives:
 *   - it self-disables the moment ADMIN_SECRET is unset, with no deploy,
 *   - it still requires an allowlisted address, so actions stay attributable
 *     to a person rather than to "whoever had the secret",
 *   - and every use is audited under its own action name, so a glance at the
 *     log says whether anyone is still relying on it.
 *
 * Unlike the link-request route, this one DOES report failure: it is a
 * password form, the address must already be known to whoever is typing, and
 * there is nothing to enumerate that the allowlist does not already fix. */

export const dynamic = "force-dynamic";

function back(req: Request, status: string) {
  return NextResponse.redirect(new URL(`/admin/login?status=${status}`, req.url), 303);
}

export async function POST(req: Request) {
  return guarded(async () => {
    if (!legacySecretEnabled()) return back(req, "invalid");

    // The only brute-forceable surface left in the admin gate.
    const limited = rateLimited(req, "admin/legacy");
    if (limited) return limited;

    const ip = clientIp(req);
    let email = "";
    let secretValue = "";
    try {
      const form = await req.formData();
      email = normalizeEmail(String(form.get("email") ?? ""));
      secretValue = String(form.get("secret") ?? "");
    } catch { return back(req, "legacy_failed"); }

    const expected = process.env.ADMIN_SECRET ?? "";
    if (!secretValue || !expected || !safeEqual(secretValue, expected) || !isAllowedAdmin(email)) {
      await recordAdminAction({
        email: email || null,
        action: "legacy_secret_failed",
        detail: `ip=${ip}`,
      });
      return back(req, "legacy_failed");
    }

    const cookie = await signAdminCookie(email);
    if (!cookie) return back(req, "legacy_failed");

    await recordAdminAction({
      email,
      action: "legacy_secret_signin",
      detail: `ip=${ip}; TEMPORARY shared-secret sign-in — delete ADMIN_SECRET to disable`,
    });

    const res = NextResponse.redirect(new URL("/admin", req.url), 303);
    res.cookies.set(ADMIN_COOKIE, cookie, ADMIN_COOKIE_OPTIONS);
    return res;
  });
}
