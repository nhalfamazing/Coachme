import { z } from "zod";
import { NextResponse } from "next/server";
import { guarded, parseBody } from "../../../_lib/api";
import { isAllowedAdmin, normalizeEmail } from "@/lib/admin-allowlist";
import { checkLinkRateLimit, createMagicLink } from "@/lib/admin-link";
import { sendAdminMagicLink } from "@/lib/admin-mail";
import { clientIp, recordAdminAction } from "@/lib/admin-audit";

/* Request a magic link.
 *
 * THE CENTRAL RULE OF THIS ROUTE: every path returns the SAME response.
 * Allowlisted or not, rate limited or not, mail sent or not — 200 with the
 * same body, and no timing branch worth measuring. An attacker must not be
 * able to use this endpoint to discover which addresses can open a console
 * full of data about children.
 *
 * That means the caller cannot be told when something went wrong, so
 * everything that happens here is written to admin_audit_log instead. If an
 * admin says "I never got the link", the log says what actually happened.
 *
 * The token itself is never returned, never logged, and never stored — only
 * its hash. It exists in the email and nowhere else. */

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  email: z.string().trim().min(3).max(254),
});

const NEUTRAL_MESSAGE = "If that address has access, the link is on its way.";

/** The one response this route ever gives.
 *
 *  It varies with how the request was made — a browser form post is sent
 *  back to the login page, an API caller gets JSON — and with NOTHING else.
 *  No branch here depends on the outcome. */
function neutral(req: Request, wantsJson: boolean) {
  if (wantsJson) return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE }, { status: 200 });
  return NextResponse.redirect(new URL("/admin/login?status=sent", req.url), 303);
}

export async function POST(req: Request) {
  return guarded(async () => {
    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent") ?? "";

    // Accept both JSON and a plain HTML form post, so the login page works
    // with and without JavaScript.
    const contentType = req.headers.get("content-type") ?? "";
    const wantsJson = contentType.includes("application/json");
    const done = () => neutral(req, wantsJson);

    let raw: unknown;
    if (wantsJson) {
      const parsed = await parseBody(req, RequestSchema);
      // Even a malformed body gets the neutral answer.
      if ("response" in parsed) return done();
      raw = parsed.data;
    } else {
      try {
        const form = await req.formData();
        raw = { email: String(form.get("email") ?? "") };
      } catch { return done(); }
    }

    const parsedEmail = RequestSchema.safeParse(raw);
    if (!parsedEmail.success) return done();
    const email = normalizeEmail(parsedEmail.data.email);

    // Reject anything that is not shaped like an address BEFORE writing an
    // audit row, so the log cannot be stuffed with arbitrary junk strings.
    if (!z.email().safeParse(email).success) return done();

    const verdict = await checkLinkRateLimit(email, ip);
    if (verdict.limited) {
      await recordAdminAction({
        email,
        action: "link_request_rate_limited",
        detail: `ip=${ip}; scope=${verdict.scope}`,
      });
      return done();
    }

    if (!isAllowedAdmin(email)) {
      // Recorded so the IP limit still counts this attempt, and so a burst
      // of guesses is visible in the log.
      await recordAdminAction({
        email,
        action: "link_request_ignored",
        detail: `ip=${ip}; not on allowlist, no mail sent`,
      });
      return done();
    }

    const link = await createMagicLink(email, ip, userAgent);
    if ("error" in link) {
      await recordAdminAction({ email, action: "link_request_failed", detail: `ip=${ip}; ${link.error}` });
      return done();
    }

    const sent = await sendAdminMagicLink(email, link.token);
    if (!sent.ok) {
      await recordAdminAction({ email, action: "link_request_failed", detail: `ip=${ip}; ${sent.reason}` });
      return done();
    }

    await recordAdminAction({ email, action: "link_requested", detail: `ip=${ip}; sent` });
    return done();
  });
}
