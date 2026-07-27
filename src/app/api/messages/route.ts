import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";

const SendSchema = z.object({
  threadId: z.string().uuid(),
  senderCode: z.string().min(3).max(80),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "messages/send");
    if (limited) return limited;
    const client = db();
    if (!client) return cloudDisabled();

    const parsed = await parseBody(req, SendSchema);
    if ("response" in parsed) return parsed.response;
    const { threadId, senderCode, body } = parsed.data;

    const sender = await profileByCode(client, senderCode);
    if (!sender) return jsonError(404, "sender_not_found", "No profile with that code.");

    const found = await client.from("threads").select("*").eq("id", threadId).limit(1);
    if (found.error) throw new Error(`thread lookup failed: ${found.error.message}`);
    const thread = found.data && found.data[0];
    if (!thread) return jsonError(404, "thread_not_found", "No such thread.");

    // The sender must be one of the two participants.
    let senderRole: "athlete" | "coach";
    if (sender.id === thread.athlete_id) senderRole = "athlete";
    else if (sender.id === thread.coach_id) senderRole = "coach";
    else return jsonError(403, "not_in_thread", "Sender is not part of this thread.");

    const inserted = await client
      .from("messages")
      .insert({ thread_id: threadId, sender_role: senderRole, sender_id: sender.id, body })
      .select();
    if (inserted.error) throw new Error(`message insert failed: ${inserted.error.message}`);

    return ok({ message: inserted.data && inserted.data[0] }, 201);
  });
}
