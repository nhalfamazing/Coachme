import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../../_lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "workouts/for");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { code } = await ctx.params;
    const athlete = await profileByCode(client, decodeURIComponent(code));
    if (!athlete) return jsonError(404, "not_found", "No profile with that code.");

    const found = await client
      .from("workouts").select("*")
      .eq("athlete_id", athlete.id)
      .order("performed_at", { ascending: false })
      .limit(500);
    if (found.error) throw new Error(`workouts query failed: ${found.error.message}`);
    return ok({ workouts: found.data ?? [] });
  });
}
