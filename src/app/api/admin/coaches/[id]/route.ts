import { db, cloudDisabled, guarded, jsonError } from "../../../_lib/api";
import { backToConsole, requireAdmin } from "../../_lib/admin";

// Coach verification actions: approve -> verified, reject -> rejected
// (reason kept in banned_reason-adjacent style is wrong; rejection
// reason lives in background review notes later. For now we store it in
// verification-adjacent form: rejected + reason appended to background.)
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
    if (!["approve", "reject"].includes(action)) {
      return jsonError(400, "invalid_action", "Unknown action.");
    }

    const found = await client.from("profiles").select("*").eq("id", id).eq("role", "coach").limit(1);
    if (found.error) throw new Error(`coach lookup failed: ${found.error.message}`);
    const coach = found.data?.[0];
    if (!coach) return jsonError(404, "coach_not_found", "No such coach.");

    const update: Record<string, unknown> = {
      verification_status: action === "approve" ? "verified" : "rejected",
    };
    if (action === "reject" && reason) {
      // Keep the rejection reason with the profile without adding a new
      // column tonight: append to background (free-text field shown
      // only in admin).
      update.background = [coach.background, `REJECTED: ${reason}`].filter(Boolean).join(" | ");
    }
    const res = await client.from("profiles").update(update).eq("id", id);
    if (res.error) throw new Error(`coach update failed: ${res.error.message}`);

    return backToConsole(req, "/admin/coaches");
  });
}
