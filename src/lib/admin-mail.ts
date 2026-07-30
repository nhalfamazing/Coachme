/* Sending the admin magic link, via Resend.
 *
 * SERVER ONLY. Uses fetch against the Resend REST API rather than the SDK:
 * one endpoint, one request, and a console that guards data about children is
 * not a place to add a dependency we do not need.
 *
 * The email is deliberately plain. No tracking pixel, no click wrapper, no
 * marketing chrome — a link wrapper would put the token through a third
 * party, and a token that has been through somebody else's redirector is not
 * a token we control.
 *
 * The token appears in the link and nowhere else: not in our logs, not in the
 * database (only its SHA-256 hash), and not in any API response body. */

import * as Sentry from "@sentry/nextjs";
import { SITE_URL } from "./site";
import { LINK_TTL_MINUTES } from "./admin-link";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** From address. Must be on a domain verified in Resend or sends will fail. */
function fromAddress(): string {
  return process.env.ADMIN_MAIL_FROM || "KoachMe <noreply@koachme.ai>";
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type MailResult = { ok: true } | { ok: false; reason: string };

export async function sendAdminMagicLink(email: string, token: string): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "mail_not_configured" };

  const link = `${SITE_URL}/api/admin/auth/verify?token=${encodeURIComponent(token)}`;
  const text = [
    "Here is your sign-in link for the KoachMe admin console:",
    "",
    link,
    "",
    `This link expires in ${LINK_TTL_MINUTES} minutes and can only be used once.`,
    "If you did not request it, ignore this email — nothing happens until the link is opened.",
  ].join("\n");

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [email],
        subject: "Your KoachMe admin sign-in link",
        text,
      }),
    });
    if (!res.ok) {
      // Status and Resend's error name only. The body could echo the
      // payload back, and the payload contains the link.
      let name = "";
      try { name = String((await res.json())?.name ?? ""); } catch { /* non-JSON */ }
      return { ok: false, reason: `resend_${res.status}${name ? `_${name}` : ""}` };
    }
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, reason: "network_error" };
  }
}
