import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";

/* Logging one drill session. reps and notes are BOTH optional on purpose:
   the whole point of the log button is that a kid can tap it once, with
   nothing filled in, and be done. Friction is what stops people logging. */
const LogSchema = z.object({
  athleteCode: z.string().min(3).max(80),
  drillId: z.string().min(1).max(80),
  reps: z.number().int().min(1).max(10000).nullish(),
  notes: z.string().max(2000).nullish(),
  completedAt: z.string().datetime({ offset: true }),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "drill-sessions/log");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, LogSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const athlete = await profileByCode(client, b.athleteCode);
    if (!athlete) return jsonError(404, "athlete_not_found", "No athlete with that code.");
    if (athlete.role !== "athlete") return jsonError(400, "role_mismatch", "Only athletes log drills.");

    const inserted = await client
      .from("drill_sessions")
      .insert({
        profile_id: athlete.id,
        drill_id: b.drillId,
        reps: b.reps ?? null,
        // An empty note is no note; do not store whitespace as content.
        notes: b.notes?.trim() ? b.notes.trim() : null,
        completed_at: b.completedAt,
      })
      .select();
    if (inserted.error) throw new Error(`drill session insert failed: ${inserted.error.message}`);
    return ok({ session: inserted.data && inserted.data[0] }, 201);
  });
}
