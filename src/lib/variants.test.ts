import { describe, it, expect } from "vitest";
import { COPY_VARIANTS, DEFAULT_VARIANT, activeVariant, activeVariantKey } from "./variants";

describe("copy variants", () => {
  it("defaults to the control, which is the shipped copy", () => {
    expect(activeVariantKey()).toBe(DEFAULT_VARIANT);
    expect(DEFAULT_VARIANT).toBe("control");
    expect(activeVariant()).toBe(COPY_VARIANTS.control);
  });

  it("gives every variant a complete set of copy", () => {
    // A variant missing a field would render `undefined` in the H1.
    for (const [key, v] of Object.entries(COPY_VARIANTS)) {
      expect(v.heroTitle.lead, key).toBeTruthy();
      expect(v.heroTitle.emphasis, key).toBeTruthy();
      expect(v.primaryCta, key).toBeTruthy();
    }
  });

  it("keeps every variant honest", () => {
    // A/B testing is not permission to test a claim we cannot support.
    // These may differ in emphasis, never in what they promise.
    for (const [key, v] of Object.entries(COPY_VARIANTS)) {
      const all = `${v.heroTitle.lead} ${v.heroTitle.emphasis} ${v.primaryCta}`;
      expect(all, key).not.toMatch(/\b(guarantee|proven|#1|best|fastest|scholarship|recruited)\b/i);
    }
  });

  it("keeps CTA copy short enough for a phone button", () => {
    for (const [key, v] of Object.entries(COPY_VARIANTS)) {
      expect(v.primaryCta.length, `${key}: "${v.primaryCta}"`).toBeLessThanOrEqual(34);
    }
  });
});
