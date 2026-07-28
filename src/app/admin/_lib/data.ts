// Server-side data access for the admin console pages. Every reader
// returns a tagged state so the pages render honest empty states:
//   no-cloud  -> Supabase env not configured (local dev)
//   no-tables -> trust_safety migration not applied yet
//   ok        -> rows
// Server components only: this imports the service-role client factory
// and must never be pulled into client bundles.
import { db } from "../../api/_lib/api";
import { isMissingRelation } from "../../api/_lib/safety";

export type AdminData<T> =
  | { state: "no-cloud" }
  | { state: "no-tables" }
  | { state: "ok"; rows: T[] };

function tag<T>(error: { code?: string; message?: string } | null, rows: T[] | null): AdminData<T> {
  if (error) {
    if (isMissingRelation(error)) return { state: "no-tables" };
    throw new Error(error.message);
  }
  return { state: "ok", rows: rows ?? [] };
}

export async function pendingFlags(): Promise<AdminData<any>> {
  const client = db();
  if (!client) return { state: "no-cloud" };
  const res = await client
    .from("message_flags").select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  return tag(res.error, res.data);
}

/** Everything the reviewer needs for one flag: the flagged message, ten
 *  messages around it, and both profiles. */
export async function flagContext(flag: any) {
  const client = db();
  if (!client) return null;
  const msg = await client.from("messages").select("*").eq("id", flag.message_id).limit(1);
  const message = msg.data?.[0];
  if (!message) return null;

  const thread = await client.from("threads").select("*").eq("id", message.thread_id).limit(1);
  const t = thread.data?.[0];
  if (!t) return { message, context: [message], athlete: null, coach: null };

  // Ten messages around the flagged one: five before, the message, and
  // enough after to total ~10, ordered oldest-first for reading.
  const before = await client.from("messages").select("*")
    .eq("thread_id", t.id).lt("created_at", message.created_at)
    .order("created_at", { ascending: false }).limit(5);
  const after = await client.from("messages").select("*")
    .eq("thread_id", t.id).gte("created_at", message.created_at)
    .order("created_at", { ascending: true }).limit(6);
  const context = [...(before.data ?? []).reverse(), ...(after.data ?? [])];

  const profiles = await client.from("profiles").select("*").in("id", [t.athlete_id, t.coach_id]);
  const byId = new Map((profiles.data ?? []).map(p => [p.id, p]));
  return {
    message,
    context,
    athlete: byId.get(t.athlete_id) ?? null,
    coach: byId.get(t.coach_id) ?? null,
  };
}

export async function openReports(): Promise<AdminData<any>> {
  const client = db();
  if (!client) return { state: "no-cloud" };
  const res = await client
    .from("reports").select("*")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(50);
  return tag(res.error, res.data);
}

export async function reportContext(report: any) {
  const client = db();
  if (!client) return null;
  const profiles = await client.from("profiles").select("*")
    .in("id", [report.reporter_profile_id, report.subject_profile_id]);
  const byId = new Map((profiles.data ?? []).map(p => [p.id, p]));
  const reporter = byId.get(report.reporter_profile_id) ?? null;
  const subject = byId.get(report.subject_profile_id) ?? null;

  // The auto-captured context flags reference this report id.
  const flags = await client.from("message_flags").select("*")
    .eq("matched_pattern", `report:${report.id}`)
    .limit(20);
  const ids = (flags.data ?? []).map(f => f.message_id);
  let messages: any[] = [];
  if (ids.length) {
    const msgs = await client.from("messages").select("*").in("id", ids)
      .order("created_at", { ascending: true });
    messages = msgs.data ?? [];
  }
  return { reporter, subject, messages };
}

export async function pendingCoaches(): Promise<AdminData<any>> {
  const client = db();
  if (!client) return { state: "no-cloud" };
  const res = await client
    .from("profiles").select("*")
    .eq("role", "coach")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  // profiles always exists; no-tables cannot happen here.
  if (res.error) throw new Error(res.error.message);
  return { state: "ok", rows: res.data ?? [] };
}

export interface OverviewCounts {
  state: "no-cloud" | "ok";
  pendingFlags: number | null;   // null = tables missing
  openReports: number | null;
  pendingCoaches: number;
  athletes: number;
  coaches: number;
}

export async function overviewCounts(): Promise<OverviewCounts> {
  const client = db();
  if (!client) {
    return { state: "no-cloud", pendingFlags: null, openReports: null, pendingCoaches: 0, athletes: 0, coaches: 0 };
  }
  const count = async (q: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>) => {
    const res = await q;
    if (res.error) {
      if (isMissingRelation(res.error)) return null;
      throw new Error(res.error.message);
    }
    return res.count ?? 0;
  };
  const flags = await count(client.from("message_flags").select("id", { count: "exact", head: true }).eq("status", "pending"));
  const reports = await count(client.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"));
  const coachesPending = await count(client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("verification_status", "pending"));
  const athletes = await count(client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "athlete"));
  const coaches = await count(client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach"));
  return {
    state: "ok",
    pendingFlags: flags,
    openReports: reports,
    pendingCoaches: coachesPending ?? 0,
    athletes: athletes ?? 0,
    coaches: coaches ?? 0,
  };
}
