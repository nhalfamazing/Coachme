// End-to-end booking flow on ONE device (the local-first path, which is
// what runs before the migration is applied): coach windows -> athlete
// sees derived slots -> moderated note -> request -> coach accepts ->
// both sides see the session -> double-booking guard -> decline with
// reason -> coach cancels -> athlete sees it + thread card. Also the
// unverified-coach unbookable state.
//
//   node scripts/booking-e2e.mjs [url]

import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}`); };

const ATHLETE = {
  id: 424242, firstName: "Test", lastName: "Athlete", name: "T. Athlete", initials: "TA",
  sport: "Baseball", position: "Shortstop", age: 14, city: "Miami", state: "FL",
  location: "Miami, FL", photo: null, banner: "/banner.jpg", stats: [],
  level: 1, xp: 120, xpMax: 500, code: "test-tiger-moon",
};
const COACH = {
  id: "test-coach-1", name: "Sam Rivera", initials: "SR", sport: "Baseball",
  title: "Hitting Coach", specialty: "Exit velo development", location: "Miami, FL",
  city: "Miami", state: "FL", rate: 60, rating: null, reviews: 0, athletes: 0,
  avgGain: null, commits: 0, modes: ["in_person", "live_online", "async"],
  badge: "VERIFIED", bio: "Bio.", color: "#C5FF3D", cover: null, photo: null,
  years: 10, code: "sam-coach-tiger", verified: true, pending: false,
};
const WINDOWS = {
  "sam-coach-tiger": [
    { id: "w-sat", weekday: 6, startMinute: 600, endMinute: 720, mode: "in_person", locationNote: "Tropical Park, field 3", active: true },
    { id: "w-mon", weekday: 1, startMinute: 540, endMinute: 660, mode: "live_online", locationNote: null, active: true },
  ],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(({ athlete, coach, windows }) => {
  if (!localStorage.getItem("coachme_athlete")) {
    localStorage.setItem("coachme_athlete", JSON.stringify(athlete));
    localStorage.setItem("coachme_coaches", JSON.stringify([coach]));
    localStorage.setItem("coachme_availability", JSON.stringify(windows));
    localStorage.setItem("coachme_athletes", JSON.stringify([{ ...athlete, registeredAt: Date.now() }]));
    localStorage.removeItem("coachme_signed_out");
  }
}, { athlete: ATHLETE, coach: COACH, windows: WINDOWS });

const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(String(e.message)));
page.on("dialog", d => d.accept());

const $click = async (text, nth = 0) => {
  const hit = await page.evaluate(({ text, nth }) => {
    const t = text.toLowerCase();
    const els = [...document.querySelectorAll("button, a")].filter(e =>
      (e.innerText || "").toLowerCase().includes(t) ||
      (e.getAttribute("aria-label") || "").toLowerCase().includes(t));
    const el = els[nth];
    if (el) { el.click(); return true; }
    return false;
  }, { text, nth });
  await page.waitForTimeout(500);
  return hit;
};
const $has = async (text) => {
  try {
    await page.waitForFunction(
      t => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
      text, { timeout: 6000 },
    );
    return true;
  } catch { return false; }
};
const $hasNot = async (text) =>
  !(await page.evaluate(t => document.body.innerText.toLowerCase().includes(t.toLowerCase()), text));

/* ---- athlete requests a session ---- */
await page.goto(`${base}/app`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await $click("Test Athlete");
await page.waitForTimeout(700);
await $click("Trainers");
await page.waitForTimeout(600);
await $click("SAM RIVERA");
await page.waitForTimeout(600);
await $click("Book a");
ok("derived slots visible", await $has("Pick a time that works"));
ok("saturday slot listed", await $has("10:00 AM"));

await $click("10:00 AM");
ok("kid-safety framing shown", await $has("Tell your parent or guardian"));
ok("public-location line shown", await $has("public training locations"));
ok("verified badge shown", await $has("COACHME VERIFIED COACH"));

// A note with a phone number must be rejected by the safety policy.
await page.fill("textarea", "call my dad at 305 555 0134 to confirm");
await $click("Send request");
ok("phone-number note rejected", await $has("conversations stay inside CoachMe"));

// Clean note goes through.
await page.fill("textarea", "Working on my swing before tryouts");
await $click("Send request");
ok("request sent", await $has("Request sent"));
await $click("Done");

await $click("BACK");
await $click("Sessions");
ok("athlete sees pending request", await $has("Waiting for Coach Sam to confirm"));

/* ---- second request (for the decline path) ---- */
await $click("Trainers");
await page.waitForTimeout(500);
await $click("SAM RIVERA");
await page.waitForTimeout(500);
await $click("Book a");
await page.waitForTimeout(400);
await $click("9:00 AM");
await $click("Send request");
await $has("Request sent");
await $click("Done");
await $click("BACK");

/* ---- coach decides ---- */
await page.goto(`${base}/coach`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await $click("Sam Rivera");
await page.waitForTimeout(700);
await $click("Sessions");
ok("coach sees the requests", await $has("WAITING"));
ok("coach sees the athlete note", await $has("Working on my swing"));

// Accept the Saturday 10:00 request (first in time order).
await $click("Accept");
await page.waitForTimeout(600);
ok("accepted lands in schedule", await $has("SCHEDULE"));

// Decline the Monday request with a reason.
await $click("Decline");
await page.waitForTimeout(300);
await $click("Confirm decline");
await page.waitForTimeout(500);
ok("no requests left waiting", await $has("No requests waiting"));

/* ---- athlete sees both outcomes ---- */
await page.goto(`${base}/app`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await $click("Test Athlete");
await page.waitForTimeout(600);
await $click("Sessions");
ok("athlete sees confirmed session", await $has("Confirmed. Tell your parent"));
ok("athlete sees declined request honestly", await $has("time doesn't work", ) || await $has("DECLINED"));

/* ---- double-booking guard: the taken slot is gone ---- */
await $click("Trainers");
await page.waitForTimeout(500);
await $click("SAM RIVERA");
await page.waitForTimeout(500);
await $click("Book a");
await page.waitForTimeout(600);
// Two Saturdays sit in the 14-day horizon; only the accepted Aug-1
// instant must vanish, so exactly ONE "10:00 AM in person" chip stays.
ok("taken Sat 10:00 slot no longer offered", await page.evaluate(() => {
  const chips = [...document.querySelectorAll("button")]
    .filter(b => b.innerText.includes("10:00 AM") && b.innerText.includes("IN PERSON"));
  return chips.length === 1;
}));
await $click("11:00 AM").catch(() => {});
await page.keyboard.press("Escape").catch(() => {});
await page.mouse.click(8, 8);

/* ---- coach cancels the session ---- */
await page.goto(`${base}/coach`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await $click("Sam Rivera");
await page.waitForTimeout(600);
await $click("Sessions");
await $click("Cancel");
await page.waitForTimeout(300);
await page.fill('input[placeholder*="Reason the athlete"]', "Field is closed for maintenance");
await $click("Confirm cancel");
await page.waitForTimeout(600);
ok("session cancelled on coach side", await $has("CANCELLED"));

/* ---- athlete sees the cancellation + thread card ---- */
await page.goto(`${base}/app`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await $click("Test Athlete");
await page.waitForTimeout(600);
await $click("Sessions");
ok("athlete sees cancelled state + reason", await $has("Field is closed for maintenance"));

await $click("Messages");
await page.waitForTimeout(500);
await $click("SAM RIVERA");
ok("thread carries session cards", await $has("Session confirmed for"));
ok("thread carries the cancellation card", await $has("cancelled by the coach"));

/* ---- unverified coach is unbookable ---- */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx2.addInitScript(({ athlete, coach }) => {
  localStorage.setItem("coachme_athlete", JSON.stringify(athlete));
  localStorage.setItem("coachme_coaches", JSON.stringify([{ ...coach, verified: false, pending: true, badge: "NEW COACH" }]));
  localStorage.removeItem("coachme_signed_out");
}, { athlete: ATHLETE, coach: COACH });
const page2 = await ctx2.newPage();
const $click2 = async (text) => {
  const hit = await page2.evaluate(t => {
    const el = [...document.querySelectorAll("button, a")].find(e => (e.innerText || "").toLowerCase().includes(t.toLowerCase()));
    if (el) { el.click(); return true; }
    return false;
  }, text);
  await page2.waitForTimeout(500);
  return hit;
};
await page2.goto(`${base}/app`, { waitUntil: "networkidle" });
await page2.waitForTimeout(800);
await $click2("Test Athlete");
await page2.waitForTimeout(600);
await $click2("Trainers");
await page2.waitForTimeout(500);
await $click2("SAM RIVERA");
await page2.waitForTimeout(500);
await $click2("Book a");
let unv = false;
try {
  await page2.waitForFunction(() => document.body.innerText.includes("after CoachMe verifies them"), { timeout: 6000 });
  unv = true;
} catch { /* not shown */ }
ok("unverified coach shows unbookable state", unv);
await ctx2.close();

console.log(`\n${pass} passed, ${fail} failed`);
if (errors.length) console.log("page errors:", [...new Set(errors)].slice(0, 5).join(" | "));
await browser.close();
process.exit(fail ? 1 : 0);
