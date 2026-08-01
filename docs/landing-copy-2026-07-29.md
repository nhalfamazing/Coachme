# Landing page copy - conversion rewrite (2026-07-29)

> **SUPERSEDED on 2026-08-01, on the offer only.** This document records
> the copy as written on 2026-07-29, when the site said the drill library
> was "first month free, then $9 a month". Nobody was ever charged that,
> and every surface has since been rewritten around the founding-member
> model: free during beta, no price stated anywhere. See
> [2026-07-31-offer-copy-reconcile.md](prompts/2026-07-31-offer-copy-reconcile.md)
> and [`src/lib/offer.ts`](../src/lib/offer.ts).
>
> The reasoning about H1s, structure, and voice still stands. **Every price
> claim below is out of date and must not be copied forward.** It is left
> intact rather than edited because a copy record that is quietly rewritten
> is not a record.

For Sophia's read. Every claim below is checked against the product as
it exists today; deviations from the session brief are marked ⚠ and
explained. Voice: second person to the parent, active verbs, sentence
case, ambition without toxicity. Zero fabricated data.

## H1 variants considered

1. **"The kids who start are the kids who train between practices."**
   The brief's direction. Full insight, great rhythm, but 11 words at
   46-92px uppercase display renders as a five-line wall on phones,
   and it leans comparative (kids vs. kids).
2. **"Starting spots are earned between practices."** ← SHIPPED
   Six words, one beat, "earned" carries the ambition without naming
   other kids. "Between practices" takes the lime highlight.
3. **"What happens between practices decides who starts."**
   Active verb, but the abstract subject ("what happens") is weaker
   than putting the starting spot first.

Variant 1 lives on as the opening line of the meta description, where
long-form phrasing belongs.

## 1. Hero (#hero)

- Stamp: FREE FOR ATHLETES · BUILT FAMILY-FIRST (kept)
- H1: Starting spots are earned **between practices**
- Sub: KoachMe gives your athlete a plan for the hours that separate
  players: pro-style drills at home, a stat sheet that proves the
  work, and real vetted coaches when you're ready.
- CTA: **Start free - no email needed** (/app?signup=1) ·
  ghost: **See how it works** (#progress)
- Note: Works on any phone, nothing to install. About a minute to start.
- Phone mockup + muted autoplay AI-demo video, AI DEMO stamp: kept.

## 2. Progress proof (#progress)

- Stamp: SEEING IT WORK / H2: Progress **you can see**
- Lead: Your athlete logs training, their numbers move, and you both
  watch it happen. Streaks and XP keep them coming back on the days
  motivation doesn't.
- Chart card: SAMPLE DATA stamp; free throws made / 25 across 8 weeks
  (11 → 19), streak/XP chips. All numbers are illustrative and
  stamped as sample; we have no real user data and show none.

## 3. Train tonight (#drills)

- Stamp: TRAIN TONIGHT / H2: Structure for the living room, **the
  driveway, the backyard**
- Lead: 24 drills across 7 sports, taught step by step: a spoken
  intro, then a slow demo rep your athlete can copy tonight. First
  month free, then $9 a month. Everything else in KoachMe stays free.
- ⚠ Brief said "Free forever" for drills. The drill library is first
  month free then $9/month (KoachMe Pro) per the app, terms, and
  JSON-LD - "free forever" would be a false claim, so the honest
  pricing ships instead. Both counts are computed from the manifest.
- 3 sample videos + AI DEMO disclosure: kept exactly.
- CTA: Browse all 24 drills, first month free (/app)

### 3b. Second row - "For your daughter" (added 2026-07-29)

- Stamp: FOR YOUR DAUGHTER
- Line: Track, volleyball, soccer and softball, taught the same way:
  every rep in this row is demoed by one of the library's women AI
  coaches.
- 4 videos: Bounding (Track / Koach Zuri), Forearm passing
  (Volleyball / Koach Sol), Juggling (Soccer / Koach Nia), Windmill
  pitching (Softball / Koach Marisol).
- ⚠ Requested sports were track, volleyball, soccer and FLAG FOOTBALL.
  The library has no flag-football drill - the two Football drills are
  tackle drills (three-point stance) demoed by Koach Farm, a man, so
  neither fits this row. Softball ships in the fourth slot instead.
  When a flag-football clip exists, add its id to GIRLS_DRILL_IDS in
  page.tsx and it joins the row.
- ⚠ The row says "women AI coaches", not "women coaches" - these are
  AI-generated characters and the page must never imply real staff.
  Each of the four clips was reviewed frame by frame to confirm it
  shows a female athlete; the picks are by exact drill id with NO
  fallback, so a manifest change drops a card rather than silently
  swapping in an unreviewed clip.
- Sits above the existing AI DEMO disclosure so one disclosure covers
  both rows. Cards are the same tap-to-play component: still zero mp4
  bytes on page load.

## 4. Receipts (#receipts)

- Stamp: THE RECEIPTS / H2: Every kid at tryouts says they're fast.
  **Yours will have proof.**
- Lead: Every stat on a KoachMe card carries a label that says how it
  was verified. No number pretends to be more than it is - and that
  is exactly why the verified ones mean something.
- Ladder (real product labels, not the brief's 3-level sketch):
  - SELF - Your athlete logged it themselves. It says so, honestly,
    right on the card.
  - TRAINER - A coach watched it happen and signed off.
  - FACILITY - A training facility measured it with their own equipment.
  - EVENT - Recorded at an organized event, on the record.
  - Note: Today most stats say SELF, and say it plainly. Climbing the
    ladder is what KoachMe is building - verification by real
    trainers, facilities, and events.
- ⚠ Brief's ladder was self → coach → event; the product's is the
  4-level SELF/TRAINER/FACILITY/EVENT, so the real one ships.
- Visual: real profile screenshot (sample athlete, SELF stamps).
  No numeral here; the climbing stat lives in #progress.

## 5. When you're ready (#coaches)

- Stamp: WHEN YOU'RE READY / H2: Vetted coaches, **on your terms**
- Lead: The training log and the stat sheet cost nothing, forever.
  When your family wants a real coach in the picture, here is how
  that works.
- Beats:
  - Vetted before they're listed - Every coach applies with their
    real identity, credentials, and rate. Nobody is listed without
    applying and being reviewed, and only verified coaches can be
    booked.
  - You see how we checked - Each profile shows the coach's
    credentials and its real verification state - including pending,
    while review is still underway. We would rather show a pending
    badge than pretend a review happened.
  - 10%, not 40% - Coaches set their own rates and keep 90%.
    KoachMe's platform fee is 10%, where coaching marketplaces
    commonly take around 40%. Fair pay is how you keep good coaches.
- ⚠ Brief said "every coach identity-verified before they appear."
  The coach roster is currently empty and full credential/background
  review is still being built (the FAQ says so), so the copy promises
  the system - review before listing, visible verification state,
  booking gated on verified - not a finished roster.
- CTAs: Browse coaches (/app) · Apply as a coach (/become-a-coach)
- Giant numeral: 90 (real coach take).

## 6. Family-first safety (#safety)

- Stamp: FAMILY-FIRST / H2: Built like a parent was in the room.
  **Because one was.**
- Lead: Safety on KoachMe is not a settings page you have to find.
  It is how the platform works by default.
- Beats (each backed by shipped code):
  - Messages are monitored - safety filters run before send;
    phone/address/off-platform sharing auto-blocked; athletes can
    only message coaches, no athlete-to-athlete DMs.
  - Sessions keep parents in the loop - booking prompts the athlete
    to tell a parent/guardian the plan; in-person sessions carry
    public-training-location guidance.
  - Report and block, everywhere - on every conversation and coach
    profile; reports land in the review queue.
  - AI is always labeled - plus 3-word code login, no ads, no data
    selling.

## 7. Founder note (#founder) - HIDDEN

Ships behind a flag (`FOUNDER_NOTE = null` in page.tsx). The heading
"Built by a dad and his 8-year-old" renders only when Rasheid replaces
null with his own 2-3 sentences. Nothing was written for him.

## 8. Closing CTA (#closing)

- H2: The next practice **is tonight.**
- Sub: Free for athletes, 60 seconds to start, no email needed.
- Single lime CTA: Start free - no email needed (/app?signup=1)

## FAQ (top 4 retuned to parent objections)

1. Is it really free? (honest $0 + drill pricing + nobody charged yet)
2. Who are the coaches? (application, review, pending shown honestly)
3. How do you keep kids safe? (filters, parent-in-loop, report/block,
   AI labels, no ads/data selling)
4. Does my kid need their own device? (no - any browser, 3-word code)
5-11. Existing questions kept: 3-word login, data collected, AI coach,
   stat labels, message strangers, ages, showcase events.

JSON-LD FAQPage is generated from the same FAQ_ITEMS array - verified
in-browser that the structured data matches the visible copy 1:1.

## Analytics (existing Vercel Analytics only)

- `section_viewed` {id} - fires once per pageload per section at 20%
  visibility: hero, progress, drills, receipts, coaches, safety,
  founder (when shown), faq, closing.
- `landing_cta_click` {cta}: header_get_started, hero_start_free,
  hero_see_how, drills_browse_all, coaches_browse, coaches_apply,
  closing_start_free.
- Downstream funnel events (signup_started etc.) unchanged.
