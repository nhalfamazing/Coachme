import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";

const LogSchema = z.object({
  athleteCode: z.string().min(3).max(80),
  type: z.string().min(1).max(60),
  durationMin: z.number().int().min(1).max(1440).nullish(),
  intensity: z.number().int().min(1).max(5).nullish(),
  notes: z.string().max(2000).nullish(),
  performedAt: z.string().datetime({ offset: true }),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "workouts/log");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, LogSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const athlete = await profileByCode(client, b.athleteCode);
    if (!athlete) return jsonError(404, "athlete_not_found", "No athlete with that code.");
    if (athlete.role !== "athlete") return jsonError(400, "role_mismatch", "Only athletes log workouts.");

    const inserted = await client
      .from("workouts")
      .insert({
        athlete_id: athlete.id,
        type: b.type,
        duration_min: b.durationMin ?? null,
        intensity: b.intensity ?? null,
        notes: b.notes ?? null,
        performed_at: b.performedAt,
      })
      .select();
    if (inserted.error) throw new Error(`workout insert failed: ${inserted.error.message}`);
    return ok({ workout: inserted.data && inserted.data[0] }, 201);
  });
}
