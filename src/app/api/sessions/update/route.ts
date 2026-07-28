import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../_lib/api";
import { isMissingRelation } from "../../_lib/safety";
import { cardTime, threadCard } from "../../_lib/session-cards";

const UpdateSchema = z.object({
  coachCode: z.string().min(3).max(80),
  sessionId: z.string().uuid(),
  action: z.enum(["cancel", "complete", "no_show"]),
  reason: z.string().max(120).nullish(),
});

// Coach-side session lifecycle: cancel (athlete sees the reason
// honestly), mark completed, mark no-show (only after start time).
export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/update");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, UpdateSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const coach = await profileByCode(client, b.coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");

    const found = await client.from("sessions").select("*")
      .eq("id", b.sessionId).eq("coach_id", coach.id).limit(1);
    if (found.error) {
      if (isMissingRelation(found.error)) return jsonError(503, "not_ready", "Booking isn't set up on the server yet.");
      throw new Error(`session lookup failed: ${found.error.message}`);
    }
    const session = found.data?.[0];
    if (!session) return jsonError(404, "session_not_found", "No such session.");
    if (session.status !== "scheduled") return jsonError(409, "not_scheduled", "This session was already finalized.");

    if (b.action === "no_show" && new Date(session.starts_at).getTime() > Date.now()) {
      return jsonError(400, "too_early", "You can mark a no-show after the session start time.");
    }

    const status = b.action === "cancel" ? "cancelled" : b.action === "complete" ? "completed" : "no_show";
    const res = await client.from("sessions")
      .update({ status, cancel_reason: b.action === "cancel" ? (b.reason?.trim() || null) : null })
      .eq("id", session.id);
    if (res.error) throw new Error(`session update failed: ${res.error.message}`);

    if (b.action === "cancel") {
      await threadCard(client, session.athlete_id, coach.id, coach.id, "coach",
        `[session] The session on ${cardTime(session.starts_at)} was cancelled by the coach${b.reason?.trim() ? ` · ${b.reason.trim()}` : ""}. You can request another time.`);
    }

    return ok({ session: { ...session, status } });
  });
}
