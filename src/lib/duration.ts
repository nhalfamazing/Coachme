/* Clip durations, in the one format schema.org accepts.
 *
 * The manifest stores a measured number of seconds (from ffprobe, see
 * scripts/mirror-drills.mjs). Schema.org wants an ISO 8601 duration, so the
 * conversion lives here rather than inline in a component — it is the kind
 * of small formatting rule that is easy to get subtly wrong and impossible
 * to notice afterwards, because nobody reads their own JSON-LD.
 *
 * A drill with no measured duration emits NO duration field. There is no
 * default and no estimate: a wrong number in structured data is repeated by
 * search results and AI assistants as fact.
 */

/** Seconds -> ISO 8601 duration ("PT8S", "PT1M12S").
 *
 *  Returns null for anything that is not a usable positive measurement, so
 *  the caller's `?? omit` path is the same for "never measured" and "the
 *  measurement was nonsense". Rounds to whole seconds: these are short demo
 *  clips, and PT7.457S is precision nobody asked for. */
export function secondsToIso8601(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  // A clip that rounds to zero was measured, but not to anything we can
  // state: "PT0S" would claim the video has no length.
  if (total === 0) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}
