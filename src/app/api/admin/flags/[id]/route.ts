import { db, cloudDisabled, guarded, jsonError } from "../../../_lib/api";
import { backToConsole, requireAdmin } from "../../_lib/admin";

// Review-queue actions for one message flag:
//   dismiss -> reviewed_ok (message stays visible)
//   remove  -> hide the message + reviewed_removed
//   ban     -> hide the message + reviewed_removed + ban the sender
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
    if (!["dismiss", "remove", "ban"].includes(action)) {
      return jsonError(400, "invalid_action", "Unknown action.");
    }

    const found = await client.from("message_flags").select("*").eq("id", id).limit(1);
    if (found.error) throw new Error(`flag lookup failed: ${found.error.message}`);
    const flag = found.data?.[0];
    if (!flag) return jsonError(404, "flag_not_found", "No such flag.");

    if (action === "dismiss") {
      const res = await client.from("message_flags")
        .update({ status: "reviewed_ok", reviewed_at: new Date().toISOString(), reviewed_by: "admin" })
        .eq("id", id);
      if (res.error) throw new Error(`flag update failed: ${res.error.message}`);
      return backToConsole(req, "/admin/flags");
    }

    // remove and ban both hide the message and close the flag.
    const hide = await client.from("messages")
      .update({ hidden: true, hidden_reason: reason || `flag:${flag.reason}` })
      .eq("id", flag.message_id);
    if (hide.error) throw new Error(`message hide failed: ${hide.error.message}`);
    const close = await client.from("message_flags")
      .update({ status: "reviewed_removed", reviewed_at: new Date().toISOString(), reviewed_by: "admin" })
      .eq("id", id);
    if (close.error) throw new Error(`flag update failed: ${close.error.message}`);

    if (action === "ban") {
      const msg = await client.from("messages").select("sender_id").eq("id", flag.message_id).limit(1);
      if (msg.error) throw new Error(`message lookup failed: ${msg.error.message}`);
      const senderId = msg.data?.[0]?.sender_id;
      if (senderId) {
        const ban = await client.from("profiles")
          .update({ banned: true, banned_reason: reason || `flag:${flag.reason}` })
          .eq("id", senderId);
        if (ban.error) throw new Error(`ban failed: ${ban.error.message}`);
      }
    }

    return backToConsole(req, "/admin/flags");
  });
}
