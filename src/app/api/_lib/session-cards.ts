// Session thread cards: on accept/decline/cancel the conversation
// carries the record, reusing the existing message thread rather than
// inventing a notification system. Client renderers treat bodies
// starting with "[session]" as system cards.

import { COACH_TZ } from "@/lib/scheduling/slots";

/** "Sat, Aug 1, 10:00 AM ET" - the shared thread card time format.
 *  Coach-local zone with an honest suffix; each side's Sessions tab
 *  shows their own local time. */
export function cardTime(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleString("en-US", {
    timeZone: COACH_TZ, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  return `${label} ET`;
}

export const MODE_TEXT: Record<string, string> = {
  in_person: "In person", live_online: "Live online", async: "Async video review",
};

/** Drop a `[session]` system card into the pair's thread. Best-effort:
 *  a card failure never fails the decision itself. */
export async function threadCard(
  client: any, athleteId: string, coachId: string, senderId: string,
  senderRole: "athlete" | "coach", text: string,
): Promise<void> {
  try {
    let thread = (await client.from("threads").select("id")
      .eq("athlete_id", athleteId).eq("coach_id", coachId).limit(1)).data?.[0];
    if (!thread) {
      thread = (await client.from("threads")
        .insert({ athlete_id: athleteId, coach_id: coachId }).select()).data?.[0];
    }
    if (thread) {
      await client.from("messages").insert({
        thread_id: thread.id, sender_role: senderRole, sender_id: senderId, body: text,
      });
    }
  } catch { /* the decision stands even if the card could not be written */ }
}
