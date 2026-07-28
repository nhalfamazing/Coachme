import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";
import { isMissingRelation } from "../_lib/safety";

// Block a profile. Symmetric enforcement happens in the message route
// (neither side can message the other); the blocked party is never
// notified and gets the same neutral copy as the blocker if they try
// to send. Unblocking is deliberately not built yet: for a kid-safety
// tool, un-blocking should be a considered step, likely parent-mediated.

const BlockSchema = z.object({
  blockerCode: z.string().min(3).max(80),
  blockedCode: z.string().min(3).max(80),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "blocks/create");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, BlockSchema);
    if ("response" in parsed) return parsed.response;
    const { blockerCode, blockedCode } = parsed.data;

    const blocker = await profileByCode(client, blockerCode);
    if (!blocker) return jsonError(404, "blocker_not_found", "No profile with that code.");
    const blocked = await profileByCode(client, blockedCode);
    if (!blocked) return jsonError(404, "blocked_not_found", "No profile with that code.");
    if (blocker.id === blocked.id) return jsonError(400, "self_block", "You can't block yourself.");

    const res = await client.from("blocks").upsert({
      blocker_profile_id: blocker.id,
      blocked_profile_id: blocked.id,
    });
    if (res.error) {
      if (isMissingRelation(res.error)) {
        return jsonError(503, "not_ready", "Blocking isn't available right now. Please try again soon.");
      }
      throw new Error(`block insert failed: ${res.error.message}`);
    }
    return ok({ blocked: true }, 201);
  });
}
