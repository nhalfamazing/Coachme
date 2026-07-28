import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";
import { isMissingRelation } from "../_lib/safety";

// A user (athlete or coach) reports the other party of a conversation.
// Service-role only, like every route. When the report lands we also
// auto-flag the last 20 messages of their thread as 'report_context'
// so the admin reviews the report with the conversation in front of
// them instead of a bare accusation.

const ReportSchema = z.object({
  reporterCode: z.string().min(3).max(80),
  subjectCode: z.string().min(3).max(80),
  messageId: z.string().uuid().nullish(),
  reason: z.enum(["uncomfortable", "personal_info", "move_off_platform", "other"]),
  details: z.string().max(500).nullish(),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "reports/create");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, ReportSchema);
    if ("response" in parsed) return parsed.response;
    const b = parsed.data;

    const reporter = await profileByCode(client, b.reporterCode);
    if (!reporter) return jsonError(404, "reporter_not_found", "No profile with that code.");
    const subject = await profileByCode(client, b.subjectCode);
    if (!subject) return jsonError(404, "subject_not_found", "No profile with that code.");
    if (reporter.id === subject.id) return jsonError(400, "self_report", "You can't report yourself.");

    const inserted = await client.from("reports").insert({
      reporter_profile_id: reporter.id,
      subject_profile_id: subject.id,
      message_id: b.messageId ?? null,
      reason: b.reason,
      details: b.details?.trim() || null,
    }).select();
    if (inserted.error) {
      if (isMissingRelation(inserted.error)) {
        return jsonError(503, "not_ready", "Reporting isn't available right now. Please try again soon.");
      }
      throw new Error(`report insert failed: ${inserted.error.message}`);
    }
    const report = inserted.data && inserted.data[0];

    // Context capture: flag the last 20 messages of the pair's thread.
    // Best-effort; a failure here never loses the report itself.
    const athleteId = reporter.role === "athlete" ? reporter.id : subject.id;
    const coachId = reporter.role === "coach" ? reporter.id : subject.id;
    const thread = await client
      .from("threads").select("id")
      .eq("athlete_id", athleteId).eq("coach_id", coachId).limit(1);
    const threadId = thread.data?.[0]?.id;
    if (!thread.error && threadId) {
      const msgs = await client
        .from("messages").select("id")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!msgs.error && (msgs.data ?? []).length > 0) {
        const res = await client.from("message_flags").insert(
          (msgs.data ?? []).map(m => ({
            message_id: m.id,
            reason: "report_context",
            matched_pattern: `report:${report?.id ?? "unknown"}`,
          })),
        );
        if (res.error && !isMissingRelation(res.error)) {
          throw new Error(`report context flags failed: ${res.error.message}`);
        }
      }
    }

    return ok({ report }, 201);
  });
}
