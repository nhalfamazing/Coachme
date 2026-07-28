import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, rateLimited } from "../_lib/api";

export const dynamic = "force-dynamic";

const QuerySchema = z.enum(["athlete", "coach"]);

// Directories. Coaches include BOTH verified and pending rows — the
// payload flags pending so the UI can label them honestly.
export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "profiles/directory");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const role = QuerySchema.safeParse(new URL(req.url).searchParams.get("role"));
    if (!role.success) return jsonError(400, "invalid_input", "role must be 'athlete' or 'coach'");

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("role", role.data)
      .limit(1000);
    if (error) throw new Error(`directory query failed: ${error.message}`);

    // Banned profiles disappear from all directories (column-agnostic
    // before the trust_safety migration: undefined is not true).
    const rows = (data ?? [])
      .filter(r => r.banned !== true)
      .map(r => ({ ...r, pending: r.verification_status !== "verified" }));
    return ok({ profiles: rows });
  });
}
