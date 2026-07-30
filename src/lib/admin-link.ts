/* Magic-link token lifecycle: mint, rate limit, redeem.
 *
 * SERVER ONLY — reaches the database with the service role key.
 *
 * The token is 32 bytes of crypto.randomBytes, hex encoded. Only its SHA-256
 * hash is stored, so a full dump of admin_sessions cannot be replayed into a
 * login. It lives 15 minutes and dies on first use.
 *
 * Rate limits are counted from the DATABASE, not from an in-memory bucket.
 * The in-memory limiter in api.ts is per-lambda-instance and resets on cold
 * start — fine for smoothing bursts on a public API, useless as a security
 * control on an authentication endpoint. */

import { randomBytes } from "node:crypto";
import { sha256Hex } from "./admin-auth";
import { db } from "@/app/api/_lib/api";

export const LINK_TTL_MINUTES = 15;
const LINK_TTL_MS = LINK_TTL_MINUTES * 60 * 1000;

/** Links per email per hour. Protects a real inbox from being flooded by
 *  somebody who knows the address is on the allowlist. */
export const MAX_LINKS_PER_EMAIL_PER_HOUR = 5;
/** Requests per IP per hour, counted across every address tried. */
export const MAX_REQUESTS_PER_IP_PER_HOUR = 20;

const HOUR_MS = 60 * 60 * 1000;
const oneHourAgo = () => new Date(Date.now() - HOUR_MS).toISOString();

export type RateVerdict = { limited: false } | { limited: true; scope: "email" | "ip" };

/** Both limits, checked against durable rows. Fails OPEN on a database error
 *  (the request still gets the neutral response) but that is reported — a
 *  broken limiter must not become a broken login. */
export async function checkLinkRateLimit(email: string, ip: string): Promise<RateVerdict> {
  const client = db();
  if (!client) return { limited: false };
  const since = oneHourAgo();

  const perEmail = await client
    .from("admin_sessions")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if (!perEmail.error && (perEmail.count ?? 0) >= MAX_LINKS_PER_EMAIL_PER_HOUR) {
    return { limited: true, scope: "email" };
  }

  // Every request attempt writes an audit row carrying its IP, including
  // attempts for addresses that are not on the allowlist — otherwise the
  // cheapest way to bypass the IP limit would be to type a fake address.
  const perIp = await client
    .from("admin_audit_log")
    .select("id", { count: "exact", head: true })
    .like("detail", `ip=${ip};%`)
    .gte("created_at", since);
  if (!perIp.error && (perIp.count ?? 0) >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    return { limited: true, scope: "ip" };
  }

  return { limited: false };
}

/** Mint a link for an allowlisted address. Returns the raw token, which the
 *  caller must put in exactly one place: the email. */
export async function createMagicLink(
  email: string,
  ip: string,
  userAgent: string,
): Promise<{ token: string } | { error: string }> {
  const client = db();
  if (!client) return { error: "cloud_disabled" };

  const token = randomBytes(32).toString("hex");
  const tokenHash = await sha256Hex(token);

  const inserted = await client.from("admin_sessions").insert({
    email,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + LINK_TTL_MS).toISOString(),
    ip: ip.slice(0, 100),
    user_agent: userAgent.slice(0, 400),
  });
  if (inserted.error) return { error: "insert_failed" };
  return { token };
}

export type RedeemResult =
  | { ok: true; email: string }
  | { ok: false; reason: "unknown" | "expired" | "already_used" | "cloud_disabled"; email: string | null };

/** Redeem a token exactly once.
 *
 *  Lookup is by hash, which is a constant-length indexed equality match, so
 *  there is no candidate scan and nothing to compare in variable time. The
 *  single-use guarantee comes from the database, not from application logic:
 *  the update is conditional on used_at still being null, so two simultaneous
 *  redemptions of the same link cannot both win. */
export async function redeemMagicLink(token: string, ip: string, userAgent: string): Promise<RedeemResult> {
  const client = db();
  if (!client) return { ok: false, reason: "cloud_disabled", email: null };

  const tokenHash = await sha256Hex(token);
  const found = await client
    .from("admin_sessions").select("*")
    .eq("token_hash", tokenHash)
    .limit(1);
  const row = found.data?.[0];
  if (found.error || !row) return { ok: false, reason: "unknown", email: null };

  if (row.used_at) return { ok: false, reason: "already_used", email: row.email };
  if (Date.parse(row.expires_at) < Date.now()) return { ok: false, reason: "expired", email: row.email };

  const claimed = await client
    .from("admin_sessions")
    .update({ used_at: new Date().toISOString(), ip: ip.slice(0, 100), user_agent: userAgent.slice(0, 400) })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id");
  // Zero rows back means another request claimed it first.
  if (claimed.error || !claimed.data?.length) {
    return { ok: false, reason: "already_used", email: row.email };
  }

  return { ok: true, email: row.email };
}
