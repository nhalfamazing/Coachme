import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../../_lib/api";

export const dynamic = "force-dynamic";

/* Every drill session for one athlete. The progress tab groups by drill
   client-side, and the achievements layer needs the whole history, so
   this returns the lot rather than one drill at a time. */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "drill-sessions/for");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { code } = await ctx.params;
    const athlete = await profileByCode(client, decodeURIComponent(code));
    if (!athlete) return jsonError(404, "not_found", "No profile with that code.");

    const found = await client
      .from("drill_sessions").select("*")
      .eq("profile_id", athlete.id)
      .order("completed_at", { ascending: false })
      .limit(1000);
    if (found.error) throw new Error(`drill sessions query failed: ${found.error.message}`);
    return ok({ sessions: found.data ?? [] });
  });
}
