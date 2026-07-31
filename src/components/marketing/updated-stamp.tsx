import { formatUpdated } from "@/lib/content-dates";

/* The visible "Updated" line on drill pages, sport hubs and the library
 * index.
 *
 * Why it is visible rather than only in schema: a parent deciding whether
 * to trust coaching advice wants to know how old it is, and a date that
 * exists only in JSON-LD answers that question for Google and not for them.
 * Google also treats a visible date that agrees with the structured data as
 * the corroboration it is — the two disagreeing is worse than neither.
 *
 * The date comes from the manifest, never from the build. See
 * src/lib/content-dates.ts.
 */
export function UpdatedStamp({ date, label = "Updated" }: { date: string; label?: string }) {
  const human = formatUpdated(date);
  // A malformed date renders nothing at all rather than "Invalid Date".
  if (!human) return null;
  return (
    <p className="mk-updated mono">
      {label} <time dateTime={date}>{human}</time>
    </p>
  );
}
