import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../_lib/api";
import { isMissingRelation } from "../_lib/safety";

export const dynamic = "force-dynamic";

// All sessions for one profile (athlete or coach side), joined with the
// other party's public identity.
export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/list");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const code = new URL(req.url).searchParams.get("code") ?? "";
    const me = await profileByCode(client, code);
    if (!me) return jsonError(404, "not_found", "No profile with that code.");

    const side = me.role === "athlete" ? "athlete_id" : "coach_id";
    const res = await client.from("sessions").select("*")
      .eq(side, me.id)
      .order("starts_at", { ascending: true })
      .limit(200);
    if (res.error) {
      if (isMissingRelation(res.error)) return ok({ sessions: [], tablesMissing: true });
      throw new Error(`sessions query failed: ${res.error.message}`);
    }
    const rows = res.data ?? [];

    const otherIds = [...new Set(rows.map(r => (me.role === "athlete" ? r.coach_id : r.athlete_id)))];
    const others = otherIds.length
      ? await client.from("profiles").select("id, code, first_name, last_name, role").in("id", otherIds)
      : { data: [], error: null };
    const byId = new Map((others.data ?? []).map((p: any) => [p.id, p]));
    const meLite = { id: me.id, code: me.code, first_name: me.first_name, last_name: me.last_name };

    return ok({
      sessions: rows.map(r => ({
        ...r,
        athlete: me.role === "athlete" ? meLite : byId.get(r.athlete_id) ?? null,
        coach: me.role === "coach" ? meLite : byId.get(r.coach_id) ?? null,
      })),
    });
  });
}
