/* Append-only admin audit log.
 *
 * SERVER ONLY — this reaches the database with the service role key. Never
 * import it from client code.
 *
 * Every entry answers "who did what, when". Writes are best-effort and never
 * throw: an audit failure must not be able to block a moderator from banning
 * an account or resolving a report. Losing a log line is bad; being unable to
 * act on a safety report is worse.
 *
 * Nothing secret is ever written here. Not tokens, not token hashes, not
 * cookies — only addresses, action names, and short human-readable detail. */

import * as Sentry from "@sentry/nextjs";
import { db } from "@/app/api/_lib/api";

export type AdminAction =
  | "link_requested"
  | "link_request_ignored"
  | "link_request_rate_limited"
  | "link_request_failed"
  | "link_redeemed"
  | "link_redemption_failed"
  | "signed_out"
  // TEMPORARY, removed with the shared-secret fallback.
  | "legacy_secret_signin"
  | "legacy_secret_failed"
  | "coach_verified"
  | "coach_rejected"
  | "flag_dismissed"
  | "flag_removed"
  | "flag_banned"
  | "report_resolved"
  | "report_banned";

export interface AuditEntry {
  /** The admin who acted. Null for anonymous attempts (a failed redemption
   *  of a token we cannot resolve to anybody). */
  email?: string | null;
  action: AdminAction;
  /** Short human-readable context. Never a token, never a secret. */
  detail?: string | null;
}

export async function recordAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const client = db();
    if (!client) return; // cloud disabled: nothing to write to
    await client.from("admin_audit_log").insert({
      email: entry.email ? entry.email.slice(0, 200) : null,
      action: entry.action,
      detail: entry.detail ? entry.detail.slice(0, 500) : null,
    });
  } catch (err) {
    // Report it, but never surface it: see the header note.
    Sentry.captureException(err);
  }
}

/** Client IP as best we can determine it behind Vercel's proxy. Used for
 *  rate limiting and for the "was this link redeemed by someone it was not
 *  sent to?" question. */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim() || "unknown";
}
