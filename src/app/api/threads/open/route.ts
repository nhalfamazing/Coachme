import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../_lib/api";
import { visibleMessages } from "../../_lib/safety";

const OpenSchema = z.object({
  athleteCode: z.string().min(3).max(80),
  coachCode: z.string().min(3).max(80),
  // The `${athleteId}::${coachId}` localStorage key, preserved for the
  // localStorage -> server migration matching. Set on create only.
  legacyKey: z.string().max(120).nullish(),
});

// Find-or-create the athlete<->coach thread and return it with its
// messages. This one endpoint also serves as the 5s poll while a
// conversation is open.
export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "threads/open");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, OpenSchema);
    if ("response" in parsed) return parsed.response;
    const { athleteCode, coachCode, legacyKey } = parsed.data;

    const athlete = await profileByCode(client, athleteCode);
    if (!athlete) return jsonError(404, "athlete_not_found", "No athlete with that code.");
    const coach = await profileByCode(client, coachCode);
    if (!coach) return jsonError(404, "coach_not_found", "No coach with that code.");
    if (athlete.role !== "athlete" || coach.role !== "coach") {
      return jsonError(400, "role_mismatch", "athleteCode/coachCode roles are wrong.");
    }

    const found = await client
      .from("threads").select("*")
      .eq("athlete_id", athlete.id).eq("coach_id", coach.id).limit(1);
    if (found.error) throw new Error(`thread lookup failed: ${found.error.message}`);
    let thread = found.data && found.data[0];

    if (!thread) {
      const inserted = await client
        .from("threads")
        .insert({ athlete_id: athlete.id, coach_id: coach.id, legacy_key: legacyKey ?? null })
        .select();
      if (inserted.error) {
        // unique(athlete_id, coach_id) race: the other writer won.
        const again = await client
          .from("threads").select("*")
          .eq("athlete_id", athlete.id).eq("coach_id", coach.id).limit(1);
        if (again.error || !again.data?.[0]) throw new Error(`thread create failed: ${inserted.error.message}`);
        thread = again.data[0];
      } else {
        thread = inserted.data && inserted.data[0];
      }
    }

    const msgs = await client
      .from("messages").select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (msgs.error) throw new Error(`messages query failed: ${msgs.error.message}`);

    // Admin-hidden messages never reach the apps.
    return ok({ thread, athlete, coach, messages: visibleMessages(msgs.data ?? []) });
  });
}
