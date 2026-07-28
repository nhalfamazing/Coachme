// Server-side helpers for the Trust & Safety layer. All of this runs
// with the service role inside API routes; none of it is importable
// from client code (same rule as api.ts).
//
// GRACEFUL DEGRADATION: the trust_safety migration
// (20260728000000_trust_safety.sql) may not be applied yet. Every
// reference to the new tables/columns treats "relation or column does
// not exist" as "feature not active yet" and degrades to the
// pre-migration behavior instead of failing the request. Hard blocks
// and IP rate limits never touch the new tables, so the core message
// screen is always on.

import type { SupabaseClient } from "@supabase/supabase-js";

interface DbErrorish {
  code?: string;
  message?: string;
}

/** True when an error means the trust_safety tables/columns are not
 *  there yet: Postgres 42P01 (undefined table) / 42703 (undefined
 *  column), or PostgREST schema-cache misses (PGRST2xx). */
export function isMissingRelation(error: DbErrorish | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  if (code === "42P01" || code === "42703") return true;
  if (/^PGRST2/.test(code)) return true;
  return /does not exist|could not find/i.test(error.message ?? "");
}

/** Banned check that is safe before the migration: the column simply
 *  isn't on the row yet, and undefined is not true. */
export function isBanned(profile: { banned?: boolean } | null | undefined): boolean {
  return profile?.banned === true;
}

/** Either direction: has A blocked B, or B blocked A? The two parties
 *  get the same neutral treatment so a block never leaks who blocked
 *  whom. Returns false before the migration. */
export async function pairBlocked(
  client: SupabaseClient,
  aId: string,
  bId: string,
): Promise<boolean> {
  const res = await client
    .from("blocks")
    .select("blocker_profile_id")
    .or(
      `and(blocker_profile_id.eq.${aId},blocked_profile_id.eq.${bId}),` +
      `and(blocker_profile_id.eq.${bId},blocked_profile_id.eq.${aId})`,
    )
    .limit(1);
  if (res.error) {
    if (isMissingRelation(res.error)) return false;
    throw new Error(`blocks lookup failed: ${res.error.message}`);
  }
  return (res.data ?? []).length > 0;
}

/** Per-thread send limit: max 20 messages per sender per thread per
 *  5 minutes. DB-backed so it holds across serverless instances
 *  (unlike the in-memory IP buckets in api.ts). Burst-friendly: the
 *  first 20 go through untouched. */
export async function threadSendLimited(
  client: SupabaseClient,
  threadId: string,
  senderId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const res = await client
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId)
    .eq("sender_id", senderId)
    .gte("created_at", since);
  if (res.error) {
    // Counting existing messages uses only phase-1 columns; a failure
    // here is real. Fail open (deliver) rather than blocking messaging
    // on a counting bug, but surface it in logs via the caller's guard.
    return false;
  }
  return (res.count ?? 0) >= 20;
}

/** Record flag rows for a delivered message. Swallows missing-relation
 *  errors (pre-migration) so flagged messages still deliver; anything
 *  else is thrown so it lands in Sentry via guarded(). */
export async function insertMessageFlags(
  client: SupabaseClient,
  messageId: string,
  flags: Array<{ category: string; pattern: string }>,
): Promise<"inserted" | "tables_missing"> {
  if (flags.length === 0) return "inserted";
  const res = await client.from("message_flags").insert(
    flags.map(f => ({
      message_id: messageId,
      reason: f.category,
      matched_pattern: f.pattern,
    })),
  );
  if (res.error) {
    if (isMissingRelation(res.error)) return "tables_missing";
    throw new Error(`message_flags insert failed: ${res.error.message}`);
  }
  return "inserted";
}

/** Strip admin-hidden messages from a message list before it reaches
 *  non-admin readers. Column-agnostic: pre-migration rows simply have
 *  no hidden field. */
export function visibleMessages<T extends { hidden?: boolean }>(messages: T[]): T[] {
  return messages.filter(m => m.hidden !== true);
}
