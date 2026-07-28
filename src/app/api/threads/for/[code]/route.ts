import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../../_lib/api";
import { visibleMessages } from "../../../_lib/safety";

export const dynamic = "force-dynamic";

// All threads for one profile, each with its messages, last message, and
// an unread hint (trailing messages from the other party — the same
// heuristic the client used against localStorage; real per-user read
// tracking needs auth and a read_at column, next phase).
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "threads/for");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { code } = await ctx.params;
    const me = await profileByCode(client, decodeURIComponent(code));
    if (!me) return jsonError(404, "not_found", "No profile with that code.");

    const side = me.role === "athlete" ? "athlete_id" : "coach_id";
    const found = await client.from("threads").select("*").eq(side, me.id).limit(200);
    if (found.error) throw new Error(`threads query failed: ${found.error.message}`);
    const threads = found.data ?? [];
    if (threads.length === 0) return ok({ threads: [] });

    const otherIds = threads.map(t => (me.role === "athlete" ? t.coach_id : t.athlete_id));
    const others = await client.from("profiles").select("*").in("id", otherIds);
    if (others.error) throw new Error(`profiles query failed: ${others.error.message}`);
    const byId = new Map((others.data ?? []).map(p => [p.id, p]));

    const msgs = await client
      .from("messages").select("*")
      .in("thread_id", threads.map(t => t.id))
      .limit(5000);
    if (msgs.error) throw new Error(`messages query failed: ${msgs.error.message}`);
    const grouped = new Map<string, any[]>();
    // Admin-hidden messages never reach the apps.
    for (const m of visibleMessages(msgs.data ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
      const list = grouped.get(m.thread_id) ?? [];
      list.push(m);
      grouped.set(m.thread_id, list);
    }

    const payload = threads.map(t => {
      const messages = grouped.get(t.id) ?? [];
      let unreadHint = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender_id !== me.id) unreadHint++;
        else break;
      }
      return {
        thread: t,
        athlete: me.role === "athlete" ? me : byId.get(t.athlete_id) ?? null,
        coach: me.role === "coach" ? me : byId.get(t.coach_id) ?? null,
        messages,
        lastMessage: messages[messages.length - 1] ?? null,
        unreadHint,
      };
    });
    return ok({ threads: payload });
  });
}
