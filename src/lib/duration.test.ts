import { describe, it, expect } from "vitest";
import { DRILLS } from "./drills";
import { secondsToIso8601 } from "./duration";

describe("secondsToIso8601", () => {
  it("formats the short clips this library actually holds", () => {
    expect(secondsToIso8601(8)).toBe("PT8S");
    expect(secondsToIso8601(59)).toBe("PT59S");
  });

  it("rolls over into minutes and hours", () => {
    expect(secondsToIso8601(60)).toBe("PT1M");
    expect(secondsToIso8601(72)).toBe("PT1M12S");
    expect(secondsToIso8601(3600)).toBe("PT1H");
    expect(secondsToIso8601(3661)).toBe("PT1H1M1S");
  });

  it("rounds to whole seconds", () => {
    expect(secondsToIso8601(7.457)).toBe("PT7S");
    expect(secondsToIso8601(7.5)).toBe("PT8S");
  });

  /* Every one of these must produce NO duration rather than a plausible
     one. Structured data is read by machines that cannot sanity-check it,
     and a fabricated length is repeated as fact. */
  it("returns null for anything that is not a real measurement", () => {
    expect(secondsToIso8601(null)).toBeNull();
    expect(secondsToIso8601(undefined)).toBeNull();
    expect(secondsToIso8601(0)).toBeNull();
    expect(secondsToIso8601(-5)).toBeNull();
    expect(secondsToIso8601(NaN)).toBeNull();
    expect(secondsToIso8601(Infinity)).toBeNull();
    // Measured, but too short to state honestly.
    expect(secondsToIso8601(0.4)).toBeNull();
  });

  it("never emits a bare PT, which is not a valid duration", () => {
    for (const v of [0, 0.1, 0.4, -1, NaN]) expect(secondsToIso8601(v)).not.toBe("PT");
  });
});

describe("drill durations in the manifest", () => {
  it("is either a positive number or null on every drill — never a guess", () => {
    for (const d of DRILLS) {
      expect(
        d.durationSeconds === null || (typeof d.durationSeconds === "number" && d.durationSeconds > 0),
        `${d.id}: durationSeconds is ${d.durationSeconds}`,
      ).toBe(true);
    }
  });

  it("formats every measured duration into a valid ISO 8601 string", () => {
    for (const d of DRILLS) {
      const iso = secondsToIso8601(d.durationSeconds);
      if (d.durationSeconds === null) expect(iso, d.id).toBeNull();
      else expect(iso, `${d.id}: ${d.durationSeconds}s`).toMatch(/^PT(\d+H)?(\d+M)?(\d+S)?$/);
    }
  });
});
