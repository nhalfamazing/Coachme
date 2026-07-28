import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";
import { isMissingRelation, isBanned } from "../_lib/safety";
import { checkHardBlock } from "@/lib/safety/patterns";

// Coach availability windows: recurring weekly, coach-local time
// (America/New_York for this phase; see the scheduling migration).
// Service-role only; scoped to the acting coach's code.

const WindowSchema = z.object({
  coachCode: z.string().min(3).max(80),
  id: z.string().uuid().nullish(),
  weekday: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  mode: z.enum(["in_person", "live_online", "async"]),
  locationNote: z.string().max(120).nullish(),
  active: z.boolean().nullish(),
});

const DeleteSchema = z.object({
  coachCode: z.string().min(3).max(80),
  id: z.string().uuid(),
});

function rowToWindow(r: any) {
  return {
    id: r.id, weekday: r.weekday,
    startMinute: r.start_minute, endMinute: r.end_minute,
    mode: r.mode, locationNote: r.location_note, active: r.active,
  };
}

export async function GET(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "availability/get");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const coachCode = new URL(req.url).searchParams.get("coachCode") ?? "";
    const coach = await profileByCode(client, coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");

    const res = await client.from("coach_availability").select("*")
      .eq("coach_id", coach.id).order("weekday").order("start_minute");
    if (res.error) {
      if (isMissingRelation(res.error)) return ok({ windows: [], tablesMissing: true });
      throw new Error(`availability query failed: ${res.error.message}`);
    }
    return ok({ windows: (res.data ?? []).map(rowToWindow) });
  });
}

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "availability/save");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, WindowSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;
    if (b.endMinute <= b.startMinute) {
      return jsonError(400, "invalid_window", "The end time must be after the start time.");
    }

    // Location notes are public training locations, so street addresses
    // are legitimate HERE (the one surface where they are). Phones,
    // emails, and off-platform handles still have no business in them.
    if (b.locationNote) {
      const hit = checkHardBlock(b.locationNote);
      if (hit && hit.category !== "street_address") {
        return jsonError(400, "location_note_blocked",
          "Location notes can't include phone numbers, emails, or other apps. Just describe the training spot.");
      }
    }

    const coach = await profileByCode(client, b.coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");
    if (isBanned(coach)) return jsonError(403, "coach_banned", "This account can't publish availability.");

    const row = {
      coach_id: coach.id,
      weekday: b.weekday,
      start_minute: b.startMinute,
      end_minute: b.endMinute,
      mode: b.mode,
      location_note: b.locationNote?.trim() || null,
      active: b.active ?? true,
    };

    if (b.id) {
      const res = await client.from("coach_availability")
        .update(row).eq("id", b.id).eq("coach_id", coach.id).select();
      if (res.error) {
        if (isMissingRelation(res.error)) return jsonError(503, "not_ready", "Availability isn't set up on the server yet.");
        throw new Error(`availability update failed: ${res.error.message}`);
      }
      if (!res.data?.[0]) return jsonError(404, "window_not_found", "No such window.");
      return ok({ window: rowToWindow(res.data[0]) });
    }

    const res = await client.from("coach_availability").insert(row).select();
    if (res.error) {
      if (isMissingRelation(res.error)) return jsonError(503, "not_ready", "Availability isn't set up on the server yet.");
      throw new Error(`availability insert failed: ${res.error.message}`);
    }
    return ok({ window: rowToWindow(res.data![0]) }, 201);
  });
}

export async function DELETE(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "availability/delete");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, DeleteSchema);
    if ("response" in parsed) return parsed.response;
    const { coachCode, id } = parsed.data;

    const coach = await profileByCode(client, coachCode);
    if (!coach || coach.role !== "coach") return jsonError(404, "coach_not_found", "No coach with that code.");

    const res = await client.from("coach_availability").delete().eq("id", id).eq("coach_id", coach.id);
    if (res.error && !isMissingRelation(res.error)) {
      throw new Error(`availability delete failed: ${res.error.message}`);
    }
    return ok({ deleted: true });
  });
}
