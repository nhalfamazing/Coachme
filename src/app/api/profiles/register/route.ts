import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, normalizeCode, profileByCode } from "../../_lib/api";

// Data minimization: this schema is the allowlist. No email, no phone, no
// birthdate — unknown keys are stripped by zod, so a client sending them
// never reaches the database.
const RegisterSchema = z.object({
  role: z.enum(["athlete", "coach"]),
  code: z.string().min(3).max(80),
  legacyId: z.union([z.string().max(40), z.number()]).nullish(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).nullish(),
  sport: z.string().max(60).nullish(),
  position: z.string().max(60).nullish(),
  specialty: z.string().max(120).nullish(),
  age: z.number().int().min(5).max(25).nullish(),
  yearsPro: z.number().int().min(0).max(80).nullish(),
  yearsCoaching: z.number().int().min(0).max(80).nullish(),
  city: z.string().max(80).nullish(),
  state: z.string().max(20).nullish(),
  rateCents: z.number().int().min(0).max(10_000_000).nullish(),
  modes: z.array(z.enum(["in_person", "live_online", "async"])).max(3).nullish(),
  background: z.string().max(60).nullish(),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "profiles/register");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, RegisterSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const code = normalizeCode(b.code);
    if (!code) return jsonError(400, "invalid_input", "code is empty after normalization");

    const mutable = {
      first_name: b.firstName.trim(),
      last_name: (b.lastName ?? "").trim(),
      sport: b.sport ?? null,
      position: b.position ?? null,
      specialty: b.specialty ?? null,
      age: b.role === "athlete" ? b.age ?? null : null,
      years_pro: b.role === "coach" ? b.yearsPro ?? null : null,
      years_coaching: b.role === "coach" ? b.yearsCoaching ?? null : null,
      city: b.city ?? null,
      state: b.state ?? null,
      rate_cents: b.role === "coach" ? b.rateCents ?? null : null,
      modes: b.role === "coach" ? b.modes ?? null : null,
      background: b.role === "coach" ? b.background ?? null : null,
    };
    const legacyId = b.legacyId != null ? String(b.legacyId) : null;

    const existing = await profileByCode(client, code);
    if (existing) {
      if (existing.role !== b.role) {
        return jsonError(409, "role_mismatch", "That code belongs to a different kind of profile.");
      }
      // Never overwrite an established legacy_id (it is the migration
      // matching key) and never touch verification_status here.
      const update: Record<string, unknown> = { ...mutable };
      if (existing.legacy_id == null && legacyId != null) update.legacy_id = legacyId;
      const { data, error } = await client
        .from("profiles").update(update).eq("id", existing.id).select();
      if (error) throw new Error(`profile update failed: ${error.message}`);
      const row = (data && data[0]) || { ...existing, ...update };
      return ok({ profile: row, pending: row.verification_status !== "verified" });
    }

    const { data, error } = await client
      .from("profiles")
      .insert({ role: b.role, code, legacy_id: legacyId, ...mutable })
      .select();
    if (error) {
      // Unique race on code: someone else inserted between our check and
      // insert. Serve the winner.
      const raced = await profileByCode(client, code);
      if (raced) return ok({ profile: raced, pending: raced.verification_status !== "verified" });
      throw new Error(`profile insert failed: ${error.message}`);
    }
    const row = data && data[0];
    return ok({ profile: row, pending: row?.verification_status !== "verified" }, 201);
  });
}
