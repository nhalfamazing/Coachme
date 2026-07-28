import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../../_lib/api";
import { isMissingRelation } from "../../../_lib/safety";

const CancelSchema = z.object({
  athleteCode: z.string().min(3).max(80),
  requestId: z.string().uuid(),
});

// An athlete withdraws their own pending request. Anything already
// answered stays as the coach left it.
export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/request-cancel");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, CancelSchema);
    if ("response" in parsed) return parsed.response;
    const { athleteCode, requestId } = parsed.data;

    const athlete = await profileByCode(client, athleteCode);
    if (!athlete || athlete.role !== "athlete") return jsonError(404, "athlete_not_found", "No athlete with that code.");

    const res = await client.from("session_requests")
      .update({ status: "cancelled_by_athlete", responded_at: new Date().toISOString() })
      .eq("id", requestId).eq("athlete_id", athlete.id).eq("status", "pending")
      .select();
    if (res.error) {
      if (isMissingRelation(res.error)) return jsonError(503, "not_ready", "Booking isn't set up on the server yet.");
      throw new Error(`request cancel failed: ${res.error.message}`);
    }
    if (!res.data?.[0]) return jsonError(404, "not_pending", "This request was already answered.");
    return ok({ request: res.data[0] });
  });
}
