/* The offer, as data, in one place.
 *
 * WHY THIS EXISTS: "$9 a month" was written out longhand in seven prose
 * surfaces, in two Offer schema nodes, and in the app's PRO_PRICE_LABEL —
 * a price nobody was ever charged. Search engines and AI assistants read
 * that as fact. This module is now the single source of truth for every
 * offer claim on the site, and no component may state anything about cost
 * that does not come from here.
 *
 * THERE IS NO PRICE FIELD, DELIBERATELY. Not zero, not null, not "TBD".
 * We have not decided a price, and a price represented as data is a price
 * something will eventually render. When pricing is decided, adding the
 * field and flipping PRICING_LAUNCHED is one deliberate change.
 *
 * THIS FILE DESCRIBES WHAT IS TRUE TODAY, not what is planned.
 */

export const OFFER = {
  /** KoachMe is in open beta. Nobody is charged anything. */
  beta: true,

  /** Has pricing launched for new users? While this is false, everything
   *  below is free, every signup becomes a founding member, and no surface
   *  may state or imply a cost. Flipping it is a product decision, not a
   *  copy edit. */
  PRICING_LAUNCHED: false,

  /** What a founding member keeps permanently free, for as long as the
   *  account is active. This is a promise to families, so it is written
   *  once and read everywhere. See docs/terms-additions-draft.md. */
  foundingBenefits: [
    "An athlete profile",
    "Unlimited workout and drill logging",
    "Core stat tracking",
    "Streaks and XP",
    "Posting to the community feed",
    "The drill library as it stands when beta ends",
    "Finding and messaging coaches",
    "Booking sessions",
  ],

  /** The honest limit on the promise above. Features built AFTER beta ends
   *  are not covered, and saying so plainly is the whole point. */
  foundingExcludes:
    "Features we build after beta ends may be paid, including for founding members.",

  /** Days of notice before any pricing change affects anyone. The only
   *  deadline we are allowed to mention, because it is the only one that
   *  exists. */
  noticeDays: 30,

  /** Share a coach keeps of their own rate when paid bookings launch. Not
   *  a price we charge — coaches set their own rates. */
  coachTakeRatePercent: 90,
} as const;

/** Is someone signing up today a founding member? */
export const isFoundingWindowOpen = !OFFER.PRICING_LAUNCHED;

/** The sentence about cost. Every surface that mentions money uses this or
 *  something derived from it, so the claim cannot drift between pages. */
export function costSentence(): string {
  return OFFER.PRICING_LAUNCHED
    ? "KoachMe is free to start, and paid plans are available."
    : "KoachMe is free during beta. Nobody is charged anything.";
}

/** The founding promise in one sentence a kid can read. */
export function foundingSentence(): string {
  return "You joined during beta, so you are a founding member: the things you use today stay free for you.";
}

/** The notice commitment, stated the same way everywhere. */
export function noticeSentence(): string {
  return `If pricing ever changes anything for you, we will tell you at least ${OFFER.noticeDays} days before it happens.`;
}

/** The founding benefits as prose, lowercased and comma-joined with a
 *  trailing "and". Used wherever the list has to read as a sentence rather
 *  than render as bullets, so the two can never disagree. */
export function foundingBenefitsProse(): string {
  const items = OFFER.foundingBenefits.map(b => b.toLowerCase());
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
