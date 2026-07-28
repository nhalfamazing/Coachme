import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../../_lib/api";
import { isMissingRelation } from "../../../_lib/safety";
import { zonedParts, COACH_TZ } from "@/lib/scheduling/slots";
import { cardTime, threadCard, MODE_TEXT } from "../../../_lib/session-cards";

const RespondSchema = z.object({
  coachCode: z.string().min(3).max(80),
  requestId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
  reason: z.string().max(120).nullish(),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/respond");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, RespondSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const coach = await profileByCode(client, b.coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");

    const found = await client.from("session_requests").select("*")
      .eq("id", b.requestId).eq("coach_id", coach.id).limit(1);
    if (found.error) {
      if (isMissingRelation(found.error)) return jsonError(503, "not_ready", "Booking isn't set up on the server yet.");
      throw new Error(`request lookup failed: ${found.error.message}`);
    }
    const request = found.data?.[0];
    if (!request) return jsonError(404, "request_not_found", "No such request.");
    if (request.status !== "pending") return jsonError(409, "not_pending", "This request was already answered.");

    const respondedAt = new Date().toISOString();

    if (b.action === "decline") {
      const res = await client.from("session_requests")
        .update({ status: "declined", decline_reason: b.reason?.trim() || null, responded_at: respondedAt })
        .eq("id", request.id);
      if (res.error) throw new Error(`decline failed: ${res.error.message}`);
      await threadCard(client, request.athlete_id, coach.id, coach.id, "coach",
        `[session] Request for ${cardTime(request.requested_start)} was declined. You can request another time.`);
      return ok({ request: { ...request, status: "declined" }, session: null });
    }

    // ACCEPT. Location comes from the window that offers this slot.
    let locationNote: string | null = null;
    const win = await client.from("coach_availability").select("*")
      .eq("coach_id", coach.id).eq("mode", request.mode);
    if (!win.error) {
      const start = new Date(request.requested_start);
      const parts = zonedParts(start);
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: COACH_TZ, hour12: false, hour: "2-digit", minute: "2-digit",
      });
      const hm: Record<string, string> = {};
      for (const p of dtf.formatToParts(start)) hm[p.type] = p.value;
      const minute = (Number(hm.hour) % 24) * 60 + Number(hm.minute);
      const match = (win.data ?? []).find((w: any) =>
        w.active !== false && w.weekday === parts.weekday &&
        w.start_minute <= minute && minute + request.duration_min <= w.end_minute);
      locationNote = match?.location_note ?? null;
    }

    const inserted = await client.from("sessions").insert({
      request_id: request.id,
      athlete_id: request.athlete_id,
      coach_id: coach.id,
      starts_at: request.requested_start,
      duration_min: request.duration_min,
      mode: request.mode,
      location_note: locationNote,
    }).select();
    if (inserted.error) throw new Error(`session insert failed: ${inserted.error.message}`);
    const session = inserted.data![0];

    const upd = await client.from("session_requests")
      .update({ status: "accepted", responded_at: respondedAt })
      .eq("id", request.id);
    if (upd.error) throw new Error(`accept failed: ${upd.error.message}`);

    // The exact same slot cannot be promised twice: any other pending
    // request for it is declined as slot_taken.
    await client.from("session_requests")
      .update({ status: "declined", decline_reason: "slot_taken", responded_at: respondedAt })
      .eq("coach_id", coach.id).eq("status", "pending")
      .eq("requested_start", request.requested_start)
      .neq("id", request.id);

    await threadCard(client, request.athlete_id, coach.id, coach.id, "coach",
      `[session] Session confirmed for ${cardTime(request.requested_start)} · ${MODE_TEXT[request.mode] ?? request.mode}${locationNote ? ` · ${locationNote}` : ""}`);

    return ok({ request: { ...request, status: "accepted" }, session });
  });
}
