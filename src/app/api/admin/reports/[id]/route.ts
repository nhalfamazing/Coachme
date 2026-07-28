import { db, cloudDisabled, guarded, jsonError } from "../../../_lib/api";
import { backToConsole, requireAdmin } from "../../_lib/admin";

// Report-queue actions:
//   resolve_ok -> resolved_ok, nothing else changes
//   remove_ban -> ban the subject (and hide the pinned message if any),
//                 resolved_action
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return guarded(async () => {
    const unauthorized = await requireAdmin(req);
    if (unauthorized) return unauthorized;
    const client = db();
    if (!client) return cloudDisabled();

    const { id } = await ctx.params;
    const form = await req.formData();
    const action = String(form.get("action") ?? "");
    const reason = String(form.get("reason") ?? "").slice(0, 300);
    if (!["resolve_ok", "remove_ban"].includes(action)) {
      return jsonError(400, "invalid_action", "Unknown action.");
    }

    const found = await client.from("reports").select("*").eq("id", id).limit(1);
    if (found.error) throw new Error(`report lookup failed: ${found.error.message}`);
    const report = found.data?.[0];
    if (!report) return jsonError(404, "report_not_found", "No such report.");

    if (action === "resolve_ok") {
      const res = await client.from("reports")
        .update({ status: "resolved_ok", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (res.error) throw new Error(`report update failed: ${res.error.message}`);
      return backToConsole(req, "/admin/reports");
    }

    const ban = await client.from("profiles")
      .update({ banned: true, banned_reason: reason || `report:${report.reason}` })
      .eq("id", report.subject_profile_id);
    if (ban.error) throw new Error(`ban failed: ${ban.error.message}`);

    if (report.message_id) {
      const hide = await client.from("messages")
        .update({ hidden: true, hidden_reason: `report:${report.reason}` })
        .eq("id", report.message_id);
      if (hide.error) throw new Error(`message hide failed: ${hide.error.message}`);
    }

    const res = await client.from("reports")
      .update({ status: "resolved_action", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (res.error) throw new Error(`report update failed: ${res.error.message}`);

    return backToConsole(req, "/admin/reports");
  });
}
