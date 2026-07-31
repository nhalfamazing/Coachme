import { describe, it, expect } from "vitest";
import { changedPageUrls, changedPaths, drillUrlPath, toAbsolute } from "./indexnow-urls.mjs";

const drill = (id, sport, slug, extra = {}) => ({ id, sport, slug, addedAt: "2026-07-29", ...extra });

const before = {
  drills: [
    drill("sb-windmill", "softball", "windmill-pitching"),
    drill("sb-soft-toss", "softball", "soft-toss"),
    drill("bb-mikan", "basketball", "mikan-drill"),
  ],
};

describe("drillUrlPath", () => {
  it("uses the sport segment and the public slug, never the id", () => {
    expect(drillUrlPath(drill("sb-windmill", "softball", "windmill-pitching")))
      .toBe("/drills/softball/windmill-pitching");
  });
});

describe("changedPageUrls", () => {
  it("maps a marketing page file to its URL", () => {
    expect([...changedPageUrls(["src/app/(marketing)/about/page.tsx"])]).toEqual(["/about"]);
    expect([...changedPageUrls(["src/app/(marketing)/page.tsx"])]).toEqual(["/"]);
  });

  it("handles windows path separators", () => {
    expect([...changedPageUrls(["src\\app\\(marketing)\\privacy\\page.tsx"])]).toEqual(["/privacy"]);
  });

  it("ignores the dynamic drill routes", () => {
    // A template edit touches all 24 drill pages; the manifest diff is the
    // honest signal for those, not the file path.
    const files = [
      "src/app/(marketing)/drills/[sport]/page.tsx",
      "src/app/(marketing)/drills/[sport]/[drillSlug]/page.tsx",
    ];
    expect([...changedPageUrls(files)]).toEqual([]);
  });

  it("ignores files that are not marketing pages", () => {
    const files = ["src/lib/drills.ts", "src/app/(marketing)/marketing.css", "package.json"];
    expect([...changedPageUrls(files)]).toEqual([]);
  });
});

describe("changedPaths", () => {
  it("submits nothing when nothing changed", () => {
    expect(changedPaths({ before, after: before, changedFiles: [] })).toEqual([]);
  });

  it("submits an edited drill, its hub and the index", () => {
    const after = { drills: [{ ...before.drills[0], addedAt: "2026-07-30" }, ...before.drills.slice(1)] };
    expect(changedPaths({ before, after })).toEqual([
      "/drills",
      "/drills/softball",
      "/drills/softball/windmill-pitching",
    ]);
  });

  it("does not touch hubs of sports that did not change", () => {
    const after = { drills: [{ ...before.drills[0], addedAt: "2026-07-30" }, ...before.drills.slice(1)] };
    expect(changedPaths({ before, after })).not.toContain("/drills/basketball");
  });

  it("submits a newly added drill", () => {
    const after = { drills: [...before.drills, drill("tr-a-skip", "track", "a-skip")] };
    const paths = changedPaths({ before, after });
    expect(paths).toContain("/drills/track/a-skip");
    expect(paths).toContain("/drills/track");
    expect(paths).toContain("/drills");
  });

  it("does NOT submit a removed drill's own URL, which is now a 404", () => {
    const after = { drills: before.drills.filter(d => d.id !== "sb-soft-toss") };
    const paths = changedPaths({ before, after });
    expect(paths).not.toContain("/drills/softball/soft-toss");
    // but the pages that listed it did change
    expect(paths).toContain("/drills/softball");
    expect(paths).toContain("/drills");
  });

  it("submits a renamed slug at its new URL only", () => {
    const after = {
      drills: [{ ...before.drills[0], slug: "windmill-pitch" }, ...before.drills.slice(1)],
    };
    const paths = changedPaths({ before, after });
    expect(paths).toContain("/drills/softball/windmill-pitch");
    expect(paths).not.toContain("/drills/softball/windmill-pitching");
  });

  it("combines drill changes with static page changes", () => {
    const after = { drills: [...before.drills, drill("tr-a-skip", "track", "a-skip")] };
    const paths = changedPaths({ before, after, changedFiles: ["src/app/(marketing)/about/page.tsx"] });
    expect(paths).toContain("/about");
    expect(paths).toContain("/drills/track/a-skip");
  });

  it("returns a sorted, duplicate-free list", () => {
    const after = { drills: [...before.drills, drill("sb-slap", "softball", "slap-hitting")] };
    const paths = changedPaths({ before, after });
    expect(paths).toEqual([...new Set(paths)].sort());
  });
});

describe("toAbsolute", () => {
  it("puts every path on the canonical host", () => {
    expect(toAbsolute(["/", "/drills/softball"], "https://koachme.ai"))
      .toEqual(["https://koachme.ai/", "https://koachme.ai/drills/softball"]);
  });

  it("tolerates a trailing slash on the base", () => {
    expect(toAbsolute(["/about"], "https://koachme.ai/")).toEqual(["https://koachme.ai/about"]);
  });
});
