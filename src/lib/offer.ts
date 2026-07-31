/* The offer, as numbers, in one place.
 *
 * WHY THIS EXISTS: "$9 a month" was written out longhand in seven prose
 * surfaces, in the Offer schema, and in the app's PRO_PRICE_LABEL. The prose
 * is deliberately left alone (see docs/offer-copy-inventory.md — the offer
 * model is frozen until the monetization session), but every NEW surface
 * reads its numbers from here, so the count of places a price is typed out
 * stops growing.
 *
 * THIS FILE DESCRIBES WHAT IS TRUE TODAY, not what is planned. In
 * particular `paymentsLive` is false and every surface must keep saying
 * nobody is charged while it stays false. Changing a value here changes what
 * the pricing page and the Offer schema claim, so it is a product decision.
 */

export const OFFER = {
  /** Free forever for athletes, and separately from the drill library. */
  athleteFree: [
    "Creating a profile",
    "Logging workouts",
    "Building a stat sheet",
    "Posting to the community feed",
    "Messaging coaches",
    "Booking sessions",
  ],
  /** The one paid thing. */
  proName: "KoachMe Pro (AI drill library)",
  proPriceUsd: 9,
  /** Free-month length, counted from the first drill a profile opens. */
  trialDays: 30,
  /** Payments have NOT launched. While this is false, an expired free month
   *  locks the drill videos and nobody is charged — every surface says so,
   *  and none of them may stop saying so while this is false. */
  paymentsLive: false,
  /** Share a coach keeps of their own rate when paid bookings launch. */
  coachTakeRatePercent: 90,
} as const;

/** "$9" — formatted once so no surface invents its own currency style. */
export const proPriceLabel = `$${OFFER.proPriceUsd}`;
