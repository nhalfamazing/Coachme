import { db, cloudDisabled, guarded, jsonError, rateLimited, profileByCode } from "../../_lib/api";
import { isMissingRelation } from "../../_lib/safety";
import { buildIcs } from "@/lib/scheduling/ics";

export const dynamic = "force-dynamic";

const MODE_TEXT: Record<string, string> = {
  in_person: "In person", live_online: "Live online", async: "Async video review",
};

// "Add to calendar": downloads a .ics for one session. The requesting
// code must belong to a participant. This is the whole no-email
// calendar story: the family's own calendar app takes it from here.
export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/ics");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const code = url.searchParams.get("code") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return jsonError(400, "invalid_input", "Bad session id.");

    const me = await profileByCode(client, code);
    if (!me) return jsonError(404, "not_found", "No profile with that code.");

    const found = await client.from("sessions").select("*").eq("id", sessionId).limit(1);
    if (found.error) {
      if (isMissingRelation(found.error)) return jsonError(503, "not_ready", "Booking isn't set up on the server yet.");
      throw new Error(`session lookup failed: ${found.error.message}`);
    }
    const session = found.data?.[0];
    if (!session) return jsonError(404, "session_not_found", "No such session.");
    if (session.athlete_id !== me.id && session.coach_id !== me.id) {
      return jsonError(403, "not_participant", "This session isn't yours.");
    }

    const otherId = me.id === session.athlete_id ? session.coach_id : session.athlete_id;
    const other = await client.from("profiles").select("first_name, last_name, role").eq("id", otherId).limit(1);
    const o = other.data?.[0];
    const otherName = o ? `${o.role === "coach" ? "Coach " : ""}${o.first_name} ${o.last_name}`.trim() : "your session partner";

    const ics = buildIcs({
      id: session.id,
      title: `CoachMe training with ${otherName}`,
      startsAt: session.starts_at,
      durationMin: session.duration_min,
      locationNote: session.location_note,
      description:
        `${MODE_TEXT[session.mode] ?? session.mode} training session booked on CoachMe. ` +
        `Tell your parent or guardian about this session. Sessions should happen in public training locations.`,
    });

    return new Response(ics, {
      status: 200,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="coachme-session.ics"`,
        "cache-control": "no-store",
      },
    });
  });
}
