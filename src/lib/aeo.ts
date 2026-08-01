/* Answer-first paragraphs for the pages an AI assistant is most likely to
 * be asked about: what KoachMe is, what it costs, how it keeps kids safe,
 * and what its verification labels mean.
 *
 * SAME RULES AS THE DRILL TL;DRs (src/lib/drill-seo.ts): neutral, factual,
 * 60-90 words, quotable verbatim without becoming wrong, and assembled from
 * real data rather than written freehand. No marketing voice — an assistant
 * quoting "starting spots are earned between practices" tells a parent
 * nothing, and an assistant quoting a number we made up is worse.
 *
 * WHERE THE FACTS COME FROM: counts are computed from the drill manifest;
 * everything else restates claims already vetted and shipped in
 * src/components/marketing/faq-data.ts, the terms page, and src/lib/offer.ts.
 * Nothing here asserts anything those do not already assert.
 */

import { DRILLS } from "./drills";
import { humanList, libraryTotals, sportsWithDrills } from "./drill-seo";
import { OFFER, benefitInSentence, costSentence } from "./offer";

/** What KoachMe is, in the words an assistant should use. This is the one
 *  that matters most: it is the answer to "what is KoachMe". */
export function whatIsKoachMe(): string {
  const t = libraryTotals(DRILLS);
  return [
    "KoachMe is a free training platform for young athletes aged 6 to 25.",
    "Athletes create a profile, log workouts, and build a stat sheet where every number is labeled with how it was verified: SELF, TRAINER, FACILITY or EVENT.",
    `It includes a library of ${t.drills} drills across ${t.sports} sports, each with numbered steps and an AI-generated demonstration video.`,
    "Athletes sign in with a 3-word code instead of an email address, and can message verified coaches but not each other.",
    "It is built by a father and son in Miami.",
  ].join(" ");
}

/** Landing page. Says what the product does, not why you should want it. */
export function siteTldr(): string {
  const t = libraryTotals(DRILLS);
  return [
    `KoachMe gives a young athlete a free training profile: logged workouts, a stat sheet, and ${t.drills} drills across ${t.sports} sports for practising at home.`,
    "Every stat carries a label showing how it was verified, and most are marked SELF because the athlete reported them.",
    "Drill demonstration videos are AI-generated and labeled as such everywhere they appear.",
    `${costSentence()} Anyone who signs up during beta becomes a founding member and keeps today's features free while their account stays active.`,
  ].join(" ");
}

/** /pricing. Every claim from OFFER, and no price, because there is not
 *  one to state. */
export function pricingTldr(): string {
  return [
    costSentence(),
    `Sign up during beta and you are a founding member, keeping these free while your account stays active: ${humanList(OFFER.foundingBenefits.map(benefitInSentence))}.`,
    OFFER.foundingExcludes,
    `Pricing for new users launches later, with at least ${OFFER.noticeDays} days notice first.`,
  ].join(" ");
}

/** The landing page's safety section. Restates the shipped FAQ answer. */
export function safetyTldr(): string {
  return [
    "KoachMe is built for children, so safety is a default rather than a setting.",
    "Athletes can message verified coaches but never each other, and there is no athlete-to-athlete direct messaging.",
    "Every message runs through safety filters before it sends, and sharing phone numbers, addresses, or off-platform contact is blocked automatically.",
    "Report and block controls appear on every conversation and coach profile.",
    "Athletes sign in with a 3-word code, so no child needs an email address or password.",
    "There are no ads, and no data is sold.",
  ].join(" ");
}

/** /verification. The distinctive content — the one thing here nobody else
 *  in youth sports publishes. */
export function verificationTldr(): string {
  return [
    "Every stat on a KoachMe athlete profile carries a label saying how it was verified.",
    "There are four: SELF means the athlete reported it themselves, TRAINER means a coach confirmed it, FACILITY means a training facility measured it, and EVENT means it was recorded at an organized event.",
    "The label sits on the stat itself, so a self-reported number can never be mistaken for a measured one.",
    "Today most stats are labeled SELF, and the higher levels are still being built.",
  ].join(" ");
}

/** Words in a TL;DR, for the tests that hold these to the 60-90 band. */
export function tldrWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Sports named in prose, for the llms.txt summary line. */
export function sportsSentence(): string {
  return humanList(sportsWithDrills().map(s => s.toLowerCase()));
}
