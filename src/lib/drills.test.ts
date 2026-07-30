/* Guards on the generated Drill Library.

   The teaching content in drills.ts is written by a human and copied
   verbatim by scripts/build-drills.mjs. These tests exist to catch the
   two ways that pipeline could hurt a kid:
     1. content that is present but malformed (a mistake with no fix, a
        step numbered out of order), and
     2. content that is absent but rendered anyway — which is why every
        optional field must be either real data or exactly null, never
        an empty string or empty array that a UI would happily show as
        a blank section.
   They do NOT assert that any particular drill HAS content: drills are
   allowed to ship with none. */

import { describe, it, expect } from "vitest";
import { DRILLS, COACHES, coachFor, type Drill } from "./drills";

const ids = (ds: Drill[]) => ds.map(d => d.id).join(", ");

describe("drill library", () => {
  it("ships drills and coaches", () => {
    expect(DRILLS.length).toBeGreaterThan(0);
    expect(COACHES.length).toBeGreaterThan(0);
  });

  it("has unique drill ids", () => {
    expect(new Set(DRILLS.map(d => d.id)).size).toBe(DRILLS.length);
  });

  it("resolves every drill's coach", () => {
    for (const d of DRILLS) expect(coachFor(d), d.id).toBeTruthy();
  });

  it("serves only mirrored Blob URLs, never the source CDN", () => {
    const served = DRILLS.flatMap(d => [d.demo.blob, d.poster.blob, ...(d.intro ? [d.intro.blob] : [])]);
    const offBlob = served.filter(u => !u.startsWith("https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/"));
    expect(offBlob).toEqual([]);
  });
});

describe("drill teaching content", () => {
  it("uses null, never an empty value, for content that is not written", () => {
    // An empty string or [] would render as a headed, empty section.
    // Absent content must be indistinguishable from "no section".
    const bad = DRILLS.filter(d =>
      d.summary === "" || d.space === ""
      || (Array.isArray(d.builds) && d.builds.length === 0)
      || (Array.isArray(d.equipment) && d.equipment.length === 0)
      || (Array.isArray(d.steps) && d.steps.length === 0)
      || (Array.isArray(d.mistakes) && d.mistakes.length === 0)
      || d.trackedStat === "");
    expect(ids(bad)).toBe("");
  });

  it("numbers steps 1..N with no gaps", () => {
    for (const d of DRILLS) {
      if (!d.steps) continue;
      expect(d.steps.map(s => s.n), d.id).toEqual(d.steps.map((_, i) => i + 1));
    }
  });

  it("gives every step a title and a detail", () => {
    for (const d of DRILLS) {
      for (const s of d.steps ?? []) {
        expect(s.title.trim(), `${d.id} step ${s.n}`).not.toBe("");
        expect(s.detail.trim(), `${d.id} step ${s.n}`).not.toBe("");
      }
    }
  });

  it("never names a mistake without giving the fix", () => {
    for (const d of DRILLS) {
      for (const m of d.mistakes ?? []) {
        expect(m.mistake.trim(), d.id).not.toBe("");
        expect(m.fix.trim(), `${d.id}: "${m.mistake}"`).not.toBe("");
      }
    }
  });

  it("points trackedStat at a stat key or leaves it null", () => {
    // Today every trackedStat is null (no stat list agreed yet); this
    // asserts the shape so a future value cannot arrive as "" or 0.
    for (const d of DRILLS) {
      expect(d.trackedStat === null || typeof d.trackedStat === "string", d.id).toBe(true);
    }
  });
});
