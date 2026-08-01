/* These paragraphs are written to be quoted verbatim by an AI assistant.
   A wrong count or an unsupported claim here is repeated as fact, so the
   tests check the facts and not just the shape. */

import { describe, it, expect } from "vitest";
import { DRILLS } from "./drills";
import { libraryTotals, sportsWithDrills } from "./drill-seo";
import { OFFER } from "./offer";
import {
  pricingTldr, safetyTldr, siteTldr, sportsSentence,
  tldrWordCount, verificationTldr, whatIsKoachMe,
} from "./aeo";

const BLOCKS: [string, () => string][] = [
  ["whatIsKoachMe", whatIsKoachMe],
  ["siteTldr", siteTldr],
  ["pricingTldr", pricingTldr],
  ["safetyTldr", safetyTldr],
  ["verificationTldr", verificationTldr],
];

describe("every TL;DR block", () => {
  it.each(BLOCKS)("%s lands in the 60-90 word band", (name, fn) => {
    const w = tldrWordCount(fn());
    expect(w, `${name}: ${w} words — "${fn()}"`).toBeGreaterThanOrEqual(60);
    expect(w, `${name}: ${w} words`).toBeLessThanOrEqual(90);
  });

  it.each(BLOCKS)("%s never emits a placeholder or a dangling list", (name, fn) => {
    const t = fn();
    expect(t, name).not.toMatch(/undefined|null|NaN|\s,|,\.|\[|\]/);
    expect(t.trim(), name).toMatch(/\.$/);
  });

  it.each(BLOCKS)("%s avoids marketing voice", (name, fn) => {
    // Second person selling and superlatives are what make a paragraph
    // useless to quote. "your athlete" is the landing page's voice, not this.
    expect(fn(), name).not.toMatch(/\b(best|amazing|revolutionary|game-?chang|unlock|supercharge|effortless)\b/i);
  });
});

describe("counts are real", () => {
  it("states the actual drill and sport totals", () => {
    const t = libraryTotals(DRILLS);
    expect(whatIsKoachMe()).toContain(`${t.drills} drills across ${t.sports} sports`);
    expect(siteTldr()).toContain(`${t.drills} drills across ${t.sports} sports`);
  });

  it("names every sport that has drills, and no others", () => {
    const sentence = sportsSentence();
    for (const s of sportsWithDrills()) expect(sentence, s).toContain(s.toLowerCase());
    expect(sentence).not.toMatch(/tennis|wrestling/); // in the manifest, no drills yet
  });
});

describe("offer claims stay tied to OFFER", () => {
  it("states no price anywhere", () => {
    // The whole reason this session happened: these paragraphs advertised
    // $9 a month for something nobody was ever charged, and assistants
    // quoted it as fact. No currency figure may reappear here.
    for (const [name, fn] of BLOCKS) {
      expect(fn(), name).not.toMatch(/\$\s?\d/);
      expect(fn(), name).not.toMatch(/\b\d+ (a|per) month\b/);
      expect(fn(), name).not.toMatch(/first month free|free (for the |your )?first month/i);
    }
  });

  it("says nobody is charged while pricing has not launched", () => {
    expect(OFFER.PRICING_LAUNCHED).toBe(false);
    expect(pricingTldr()).toMatch(/[Nn]obody is charged/);
    expect(siteTldr()).toMatch(/[Nn]obody is charged/);
  });

  it("names every founding benefit, so the promise cannot shrink quietly", () => {
    const t = pricingTldr().toLowerCase();
    for (const b of OFFER.foundingBenefits) expect(t, b).toContain(b.toLowerCase());
  });

  it("states the exclusion and the notice period alongside the promise", () => {
    // Grandfathering is a commitment to families. The limit on it and the
    // notice we owe them travel with it or the promise is misleading.
    expect(pricingTldr()).toContain(OFFER.foundingExcludes);
    expect(pricingTldr()).toContain(`${OFFER.noticeDays} days`);
  });

  it("invents no urgency", () => {
    // Permitted urgency is the notice period and the fact that founding
    // status ends when pricing launches. Everything else is fabricated.
    for (const [name, fn] of BLOCKS) {
      expect(fn(), name).not.toMatch(/limited spots|only \d+|spots? left|hurry|act now|ends (today|soon)|\d+ (members|athletes) (have )?(joined|signed)/i);
    }
  });
});

describe("AI disclosure", () => {
  it("says the demo videos are AI-generated wherever drills are mentioned", () => {
    expect(whatIsKoachMe()).toMatch(/AI-generated/);
    expect(siteTldr()).toMatch(/AI-generated/);
  });
});

describe("safety claims match what is actually built", () => {
  it("states the athlete-to-athlete messaging rule", () => {
    expect(safetyTldr()).toMatch(/no athlete-to-athlete direct messaging/);
  });

  it("does not claim coach background checks are complete", () => {
    // Full credential and background review is still being built; the FAQ
    // says so. This paragraph must not quietly upgrade that.
    expect(safetyTldr()).not.toMatch(/background[- ]check(ed)?\b/i);
  });
});

describe("verification ladder", () => {
  it("defines all four labels", () => {
    const t = verificationTldr();
    for (const label of ["SELF", "TRAINER", "FACILITY", "EVENT"]) expect(t, label).toContain(label);
  });

  it("admits most stats are still self-reported", () => {
    expect(verificationTldr()).toMatch(/most stats are labeled SELF/);
  });
});
