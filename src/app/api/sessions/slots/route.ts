import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../_lib/api";
import { isMissingRelation, isBanned, pairBlocked } from "../../_lib/safety";
import { deriveSlots } from "@/lib/scheduling/slots";

export const dynamic = "force-dynamic";

// Bookable slots for one coach over the next 14 days: derived from
// active windows minus accepted sessions. Also tells the client WHY a
// coach is not bookable so the UI can be honest:
//   unverified -> "accepting requests after verification"
//   banned     -> treated as unavailable
//   blocked    -> neutral unavailable (never reveals who blocked whom)
//   no_windows -> honest empty state + message CTA
export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/slots");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const url = new URL(req.url);
    const coachCode = url.searchParams.get("coachCode") ?? "";
    const athleteCode = url.searchParams.get("athleteCode");

    const coach = await profileByCode(client, coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");

    if (isBanned(coach)) return ok({ bookable: false, reason: "banned", slots: [] });
    if (coach.verification_status !== "verified") {
      return ok({ bookable: false, reason: "unverified", slots: [] });
    }

    if (athleteCode) {
      const athlete = await profileByCode(client, athleteCode);
      if (athlete && (await pairBlocked(client, athlete.id, coach.id))) {
        return ok({ bookable: false, reason: "blocked", slots: [] });
      }
    }

    const win = await client.from("coach_availability").select("*").eq("coach_id", coach.id);
    if (win.error) {
      if (isMissingRelation(win.error)) return ok({ bookable: false, reason: "no_windows", slots: [] });
      throw new Error(`availability query failed: ${win.error.message}`);
    }
    const windows = (win.data ?? []).map(r => ({
      id: r.id, weekday: r.weekday, startMinute: r.start_minute, endMinute: r.end_minute,
      mode: r.mode, locationNote: r.location_note, active: r.active,
    }));
    if (windows.filter(w => w.active !== false).length === 0) {
      return ok({ bookable: false, reason: "no_windows", slots: [] });
    }

    const horizonEnd = new Date(Date.now() + 15 * 86400000).toISOString();
    const busyRes = await client.from("sessions").select("starts_at, duration_min")
      .eq("coach_id", coach.id).eq("status", "scheduled")
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .lte("starts_at", horizonEnd);
    const busy = busyRes.error
      ? []
      : (busyRes.data ?? []).map(s => ({ startIso: s.starts_at, durationMin: s.duration_min }));

    const slots = deriveSlots({ windows, busy, now: new Date() });
    return ok({ bookable: slots.length > 0, reason: slots.length > 0 ? "ok" : "no_windows", slots });
  });
}
