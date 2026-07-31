import { track } from "@vercel/analytics";

/* Send an analytics event that fires on MOUNT rather than on interaction.
 *
 * THE PROBLEM THIS SOLVES: `track()` is a silent no-op when `window.va` does
 * not exist yet — the SDK call is optional-chained, so there is no error, no
 * warning, and no event. `<Analytics />` installs `window.va` from an effect
 * in the root layout, and React runs CHILD effects before PARENT effects, so
 * anything tracked from a page's own mount effect runs too early and is
 * thrown away. A plain setTimeout(0) is not enough either: the queue is
 * installed by an injected script, not synchronously.
 *
 * Interaction events (clicks, video play) are unaffected — by the time
 * somebody taps anything the queue exists. This is only for mount-time
 * events, and those are exactly the attribution events: which page a
 * search visitor landed on, and that a signup began.
 *
 * Found on 2026-07-30 by watching the real queue in a browser against a
 * production build: the effect ran, track() was called, and the event never
 * arrived, while a later click from the same component did. `signup_started`
 * on the ?signup=1 path had been silently dropped the same way since it was
 * written.
 *
 * Returns a cleanup function — call it from the effect's teardown so a fast
 * unmount does not leave a timer running.
 */
export function trackWhenReady(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout>;
  let attempts = 0;
  // ~2.5s. Long enough for a slow script, short enough to stop rather than
  // spin when analytics is blocked outright.
  const MAX_ATTEMPTS = 25;

  const send = () => {
    if (cancelled) return;
    if (typeof (window as unknown as { va?: unknown }).va !== "function") {
      if (++attempts > MAX_ATTEMPTS) return;
      timer = setTimeout(send, 100);
      return;
    }
    if (properties) track(name, properties);
    else track(name);
  };

  timer = setTimeout(send, 0);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
