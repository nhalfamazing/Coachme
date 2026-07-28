import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../../_lib/api";
import { isMissingRelation, isBanned, pairBlocked } from "../../_lib/safety";
import { checkHardBlock, BLOCK_MESSAGE } from "@/lib/safety/patterns";
import { deriveSlots, isDerivableSlot } from "@/lib/scheduling/slots";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  athleteCode: z.string().min(3).max(80),
  coachCode: z.string().min(3).max(80),
  startIso: z.string().datetime({ offset: true }),
  durationMin: z.number().int().min(15).max(240).default(60),
  mode: z.enum(["in_person", "live_online", "async"]),
  note: z.string().max(280).nullish(),
});

async function loadDeriveInputs(client: any, coachId: string) {
  const win = await client.from("coach_availability").select("*").eq("coach_id", coachId);
  if (win.error) {
    if (isMissingRelation(win.error)) return null;
    throw new Error(`availability query failed: ${win.error.message}`);
  }
  const windows = (win.data ?? []).map((r: any) => ({
    id: r.id, weekday: r.weekday, startMinute: r.start_minute, endMinute: r.end_minute,
    mode: r.mode, locationNote: r.location_note, active: r.active,
  }));
  const busyRes = await client.from("sessions").select("starts_at, duration_min")
    .eq("coach_id", coachId).eq("status", "scheduled");
  const busy = busyRes.error
    ? []
    : (busyRes.data ?? []).map((s: any) => ({ startIso: s.starts_at, durationMin: s.duration_min }));
  return { windows, busy };
}

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/request");
    if (limited) return limited;

    const parsed = await parseBody(req, CreateSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    // The note rides the same safety pipeline as messages: hard blocks
    // run before anything else, in every environment.
    if (b.note) {
      const hit = checkHardBlock(b.note);
      if (hit) return jsonError(400, "message_blocked", BLOCK_MESSAGE);
    }

    const client = db();
    if (!client) return cloudDisabled();

    const athlete = await profileByCode(client, b.athleteCode);
    if (!athlete || athlete.role !== "athlete") return jsonError(404, "athlete_not_found", "No athlete with that code.");
    if (isBanned(athlete)) {
      return jsonError(403, "sender_banned", "Booking is turned off for this account. If you think this is a mistake, ask a parent or guardian to contact us.");
    }

    const coach = await profileByCode(client, b.coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");
    if (isBanned(coach)) return jsonError(403, "coach_unavailable", "This coach isn't taking requests right now.");
    if (coach.verification_status !== "verified") {
      return jsonError(403, "coach_unverified", "This coach can take requests after KoachMe verifies them.");
    }
    if (await pairBlocked(client, athlete.id, coach.id)) {
      return jsonError(403, "blocked", "You can't book with this person.");
    }

    const inputs = await loadDeriveInputs(client, coach.id);
    if (!inputs) return jsonError(503, "not_ready", "Booking isn't set up on the server yet. Please try again soon.");
    if (!isDerivableSlot(b.startIso, b.mode, { windows: inputs.windows, busy: inputs.busy, now: new Date() })) {
      return jsonError(409, "slot_unavailable", "That time was just taken or is no longer offered. Pick another time.");
    }

    // Anti-spam: max 3 pending requests per athlete per coach.
    const pending = await client.from("session_requests")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athlete.id).eq("coach_id", coach.id).eq("status", "pending");
    if (!pending.error && (pending.count ?? 0) >= 3) {
      return jsonError(429, "too_many_pending", "You already have 3 requests waiting for this coach. Give them a moment to reply.");
    }

    const inserted = await client.from("session_requests").insert({
      athlete_id: athlete.id,
      coach_id: coach.id,
      requested_start: b.startIso,
      duration_min: b.durationMin,
      mode: b.mode,
      note: b.note?.trim() || null,
    }).select();
    if (inserted.error) {
      if (isMissingRelation(inserted.error)) return jsonError(503, "not_ready", "Booking isn't set up on the server yet. Please try again soon.");
      throw new Error(`request insert failed: ${inserted.error.message}`);
    }
    return ok({ request: inserted.data![0] }, 201);
  });
}

export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "sessions/requests-list");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const code = new URL(req.url).searchParams.get("code") ?? "";
    const me = await profileByCode(client, code);
    if (!me) return jsonError(404, "not_found", "No profile with that code.");

    const side = me.role === "athlete" ? "athlete_id" : "coach_id";
    const res = await client.from("session_requests").select("*")
      .eq(side, me.id)
      .order("requested_start", { ascending: true })
      .limit(200);
    if (res.error) {
      if (isMissingRelation(res.error)) return ok({ requests: [], tablesMissing: true });
      throw new Error(`requests query failed: ${res.error.message}`);
    }
    const rows = res.data ?? [];

    const otherIds = [...new Set(rows.map(r => (me.role === "athlete" ? r.coach_id : r.athlete_id)))];
    const others = otherIds.length
      ? await client.from("profiles").select("id, code, first_name, last_name, role").in("id", otherIds)
      : { data: [], error: null };
    const byId = new Map((others.data ?? []).map((p: any) => [p.id, p]));
    const meLite = { id: me.id, code: me.code, first_name: me.first_name, last_name: me.last_name };

    return ok({
      requests: rows.map(r => ({
        ...r,
        athlete: me.role === "athlete" ? meLite : byId.get(r.athlete_id) ?? null,
        coach: me.role === "coach" ? meLite : byId.get(r.coach_id) ?? null,
      })),
    });
  });
}
