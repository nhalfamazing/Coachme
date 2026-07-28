import { z } from "zod";
import { db, cloudDisabled, guarded, jsonError, ok, parseBody, rateLimited, profileByCode } from "../_lib/api";
import { checkFlags, checkHardBlock, BLOCK_MESSAGE } from "@/lib/safety/patterns";
import { insertMessageFlags, isBanned, pairBlocked, threadSendLimited } from "../_lib/safety";

const SendSchema = z.object({
  threadId: z.string().uuid(),
  senderCode: z.string().min(3).max(80),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  return guarded(async () => {
    const limited = rateLimited(req, "messages/send");
    if (limited) return limited;

    const parsed = await parseBody(req, SendSchema);
    if ("response" in parsed) return parsed.response;
    const { threadId, senderCode, body } = parsed.data;

    // HARD BLOCK runs before anything else, including the cloud check:
    // phone numbers, emails, street addresses, and off-platform moves
    // are refused everywhere, in every environment, in both directions.
    // Policy lives in src/lib/safety/patterns.ts.
    const blocked = checkHardBlock(body);
    if (blocked) {
      return jsonError(400, "message_blocked", BLOCK_MESSAGE);
    }

    const client = db();
    if (!client) return cloudDisabled();

    const sender = await profileByCode(client, senderCode);
    if (!sender) return jsonError(404, "sender_not_found", "No profile with that code.");

    // Banned profiles cannot send. Copy is calm on purpose.
    if (isBanned(sender)) {
      return jsonError(403, "sender_banned",
        "Messaging is turned off for this account. If you think this is a mistake, ask a parent or guardian to contact us.");
    }

    const found = await client.from("threads").select("*").eq("id", threadId).limit(1);
    if (found.error) throw new Error(`thread lookup failed: ${found.error.message}`);
    const thread = found.data && found.data[0];
    if (!thread) return jsonError(404, "thread_not_found", "No such thread.");

    // The sender must be one of the two participants.
    let senderRole: "athlete" | "coach";
    if (sender.id === thread.athlete_id) senderRole = "athlete";
    else if (sender.id === thread.coach_id) senderRole = "coach";
    else return jsonError(403, "not_in_thread", "Sender is not part of this thread.");

    const otherId = senderRole === "athlete" ? thread.coach_id : thread.athlete_id;

    // Banned recipients are simply unavailable; no details leak.
    const other = await client.from("profiles").select("*").eq("id", otherId).limit(1);
    if (other.error) throw new Error(`recipient lookup failed: ${other.error.message}`);
    if (isBanned(other.data?.[0])) {
      return jsonError(403, "recipient_unavailable", "This person isn't available to message right now.");
    }

    // Blocked pairs cannot message in either direction. Same neutral
    // copy no matter who blocked whom, so blocking stays silent.
    if (await pairBlocked(client, sender.id, otherId)) {
      return jsonError(403, "blocked", "You can't message this person.");
    }

    // Per-thread send limit (20 per sender per 5 minutes), polite 429.
    if (await threadSendLimited(client, threadId, sender.id)) {
      return jsonError(429, "rate_limited_thread",
        "That's a lot of messages at once. Take a short break and try again in a few minutes.");
    }

    const inserted = await client
      .from("messages")
      .insert({ thread_id: threadId, sender_role: senderRole, sender_id: sender.id, body })
      .select();
    if (inserted.error) throw new Error(`message insert failed: ${inserted.error.message}`);
    const message = inserted.data && inserted.data[0];

    // FLAG BUT DELIVER: risky-but-reviewable content is delivered and
    // queued for human review. Degrades to delivery-only until the
    // trust_safety migration is applied.
    const flags = checkFlags(body);
    if (message && flags.length > 0) {
      await insertMessageFlags(client, message.id, flags.map(f => ({ category: f.category, pattern: f.pattern })));
    }

    return ok({ message }, 201);
  });
}
