import { db, cloudDisabled, guarded, jsonError, ok, rateLimited, profileByCode } from "../../../_lib/api";

export const dynamic = "force-dynamic";

// Cross-device login: the 3-word code is the lookup key.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return guarded(async () => {
    const limited = rateLimited(req, "profiles/by-code");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const { code } = await ctx.params;
    const row = await profileByCode(client, decodeURIComponent(code));
    if (!row) return jsonError(404, "not_found", "No profile with that code.");
    return ok({ profile: row, pending: row.verification_status !== "verified" });
  });
}
