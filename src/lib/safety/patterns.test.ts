import { describe, expect, it } from "vitest";
import { checkFlags, checkHardBlock, normalize } from "./patterns";

const blockCat = (t: string) => checkHardBlock(t)?.category ?? null;
const flagCats = (t: string) => checkFlags(t).map(h => h.category);

describe("normalize", () => {
  it("lowercases and maps leetspeak-lite", () => {
    expect(normalize("D0N'T T3LL")).toBe("dont tell");
    expect(normalize("wh@ts@pp")).toBe("whatsapp");
    expect(normalize("c.a.l.l  me")).toBe("c a l l me");
  });
});

/* ------------------------------ hard blocks ------------------------------ */

describe("phone numbers -> hard block", () => {
  it("blocks a plain 10-digit number", () => {
    expect(blockCat("my number is 3055550134")).toBe("phone_number");
  });
  it("blocks a dashed number", () => {
    expect(blockCat("305-555-0134")).toBe("phone_number");
  });
  it("blocks a spaced number", () => {
    expect(blockCat("reach me on 305 555 0134 anytime")).toBe("phone_number");
  });
  it("blocks a dotted number with country code", () => {
    expect(blockCat("+1.305.555.0134")).toBe("phone_number");
  });
  it("blocks a 7-digit number with call context", () => {
    expect(blockCat("call me at 555 0134")).toBe("phone_number");
  });
  it("blocks parenthesized area code", () => {
    expect(blockCat("(305) 555-0134")).toBe("phone_number");
  });
  it("does NOT block a game time", () => {
    expect(blockCat("practice is at 10am, game at 7:30")).toBeNull();
  });
  it("does NOT block stats", () => {
    expect(blockCat("you hit 85 mph exit velo, ran a 7.4")).toBeNull();
  });
  it("does NOT block dates", () => {
    expect(blockCat("tournament is 7/28/2026 in tampa")).toBeNull();
  });
  it("does NOT block 'call the pitch' coaching talk", () => {
    expect(blockCat("you call the pitch and I'll call timeout")).toBeNull();
  });
  it("does NOT block jersey/score numbers", () => {
    expect(blockCat("we won 12 to 9, you went 3 for 4")).toBeNull();
  });
});

describe("emails -> hard block", () => {
  it("blocks a plain email", () => {
    expect(blockCat("email me coach@example.com")).toBe("email_address");
  });
  it("blocks an obfuscated email", () => {
    expect(blockCat("send it to sam smith at gmail dot com")).toBe("email_address");
  });
  it("does NOT block the word email alone", () => {
    expect(blockCat("ask your parents to email the league")).toBeNull();
  });
});

describe("street addresses -> hard block", () => {
  it("blocks a house-number street address", () => {
    expect(blockCat("come to 4821 Palm Grove Ave after school")).toBe("street_address");
  });
  it("blocks a numbered road", () => {
    expect(blockCat("my place is 12 Oak St")).toBe("street_address");
  });
  it("does NOT block a venue without a house number", () => {
    expect(blockCat("meet at Tropical Park on the main field")).toBeNull();
  });
});

describe("off-platform -> hard block", () => {
  it("blocks snapchat mentions", () => {
    expect(blockCat("add me on snapchat")).toBe("off_platform");
  });
  it("blocks leetspeak instagram", () => {
    expect(blockCat("my 1nstagram is open")).toBe("off_platform");
  });
  it("blocks whatsapp with symbol", () => {
    expect(blockCat("message me on wh@tsapp")).toBe("off_platform");
  });
  it("blocks discord", () => {
    expect(blockCat("join my discord server")).toBe("off_platform");
  });
  it("blocks tiktok", () => {
    expect(blockCat("i posted it on tik tok, follow me")).toBe("off_platform");
  });
  it("blocks 'text me'", () => {
    expect(blockCat("just text me tonight")).toBe("off_platform");
  });
  it("blocks 'dm me'", () => {
    expect(blockCat("dm me and we can set it up")).toBe("off_platform");
  });
  it("blocks 'add me on' without an app name", () => {
    expect(blockCat("add me on there and we can talk")).toBe("off_platform");
  });
  it("blocks my-handle constructions", () => {
    expect(blockCat("my ig is in my bio")).toBe("off_platform");
  });
  it("blocks @-handles", () => {
    expect(blockCat("follow @fastpitch_sam99")).toBe("off_platform");
  });
  it("blocks moving off the app", () => {
    expect(blockCat("let's find somewhere else to talk")).toBe("off_platform");
  });
  it("does NOT block 'snap throw' baseball usage", () => {
    expect(blockCat("good snap throw to second today")).toBeNull();
  });
  it("does NOT block normal session talk", () => {
    expect(blockCat("great session, same time next week")).toBeNull();
  });
});

/* --------------------------- flag but deliver ---------------------------- */

describe("secrecy -> flag", () => {
  it("flags don't tell your parents", () => {
    expect(flagCats("don't tell your parents about this")).toContain("secrecy");
  });
  it("flags leetspeak secrecy", () => {
    expect(flagCats("d0n't t3ll anyone ok")).toContain("secrecy");
  });
  it("flags our secret", () => {
    expect(flagCats("this is our little secret")).toContain("secrecy");
  });
  it("flags just between us", () => {
    expect(flagCats("keep it just between us")).toContain("secrecy");
  });
  it("flags delete this chat", () => {
    expect(flagCats("delete this conversation after you read it")).toContain("secrecy");
  });
  it("does NOT flag normal privacy talk", () => {
    expect(flagCats("we keep athlete data private")).toHaveLength(0);
  });
});

describe("meetup pressure -> flag", () => {
  it("flags meet me alone", () => {
    expect(flagCats("meet me alone at the cages")).toContain("meetup_pressure");
  });
  it("flags don't bring your parents", () => {
    expect(flagCats("don't bring your mom this time")).toContain("meetup_pressure");
  });
  it("flags pick you up", () => {
    expect(flagCats("I can pick you up on the way")).toContain("meetup_pressure");
  });
  it("does NOT flag parent-visible scheduling", () => {
    expect(flagCats("see you at the field Saturday at 10am, bring your glove")).toHaveLength(0);
  });
  it("does NOT flag group session planning", () => {
    expect(flagCats("meet at the dugout with the rest of the team")).toHaveLength(0);
  });
});

describe("gifts and money -> flag", () => {
  it("flags buying things for the athlete", () => {
    expect(flagCats("I'll buy you new cleats")).toContain("gift_money");
  });
  it("flags sending money", () => {
    expect(flagCats("I can send you some money for the trip")).toContain("gift_money");
  });
  it("flags payment apps", () => {
    expect(flagCats("my venmo is open")).toContain("gift_money");
  });
  it("flags gift cards", () => {
    expect(flagCats("I got you a gift card")).toContain("gift_money");
  });
  it("does NOT flag rate talk", () => {
    expect(flagCats("my rate is 60 per hour, first session is free")).toHaveLength(0);
  });
});

describe("photo requests -> flag", () => {
  it("flags send me a photo", () => {
    expect(flagCats("send me a photo of you")).toContain("photo_request");
  });
  it("flags send pics", () => {
    expect(flagCats("send pics")).toContain("photo_request");
  });
  it("flags what do you look like", () => {
    expect(flagCats("what do you look like")).toContain("photo_request");
  });
  it("flags camera pressure", () => {
    expect(flagCats("turn your camera on")).toContain("photo_request");
  });
  it("does NOT flag swing video review", () => {
    expect(flagCats("upload a video of your swing so we can review it")).toHaveLength(0);
  });
});

describe("personal probing -> flag", () => {
  it("flags school questions", () => {
    expect(flagCats("what school do you go to")).toContain("personal_probing");
  });
  it("flags home alone questions", () => {
    expect(flagCats("are you home alone right now")).toContain("personal_probing");
  });
  it("flags parents-around questions", () => {
    expect(flagCats("are your parents home")).toContain("personal_probing");
  });
  it("flags where do you live", () => {
    expect(flagCats("where do you live exactly")).toContain("personal_probing");
  });
  it("does NOT flag sport-context questions", () => {
    expect(flagCats("what position do you play and what city are you in")).toHaveLength(0);
  });
});

describe("multi-category and edge behavior", () => {
  it("reports each category once", () => {
    const cats = flagCats("don't tell your parents, this is our secret");
    expect(cats.filter(c => c === "secrecy")).toHaveLength(1);
  });
  it("catches multiple categories in one message", () => {
    const cats = flagCats("don't tell your mom, I'll buy you cleats");
    expect(cats).toContain("secrecy");
    expect(cats).toContain("gift_money");
  });
  it("hard block wins even when flags also present", () => {
    expect(blockCat("don't tell your parents, text me at 305 555 0134")).toBe("phone_number");
  });
  it("handles empty strings", () => {
    expect(blockCat("")).toBeNull();
    expect(flagCats("")).toHaveLength(0);
  });
  it("handles long clean messages", () => {
    const clean = "Great work this week. ".repeat(50);
    expect(blockCat(clean)).toBeNull();
    expect(flagCats(clean)).toHaveLength(0);
  });
});
