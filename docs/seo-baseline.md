# SEO baseline — 2026-07-30

Measured **before** any of the SEO/AEO/CRO work, against production
(`https://koachme.ai`), at commit `a4675f8`. Every later phase compares
against these numbers.

Reproduce with:

```bash
node scripts/seo-audit.mjs https://koachme.ai
```

Lighthouse numbers came from Lighthouse 12.8.2 driving Edge headless against
production. Production, not localhost, on purpose: it is what Googlebot and
the AI crawlers actually fetch, and it is the only target that stays
comparable after deploys. Network variance means treat ±3 on performance as
noise; the SEO, accessibility, and best-practices scores are stable.

---

## The headline problem

The drill library is **24 drills across 7 sports with complete teaching
content** — 121 numbered steps, 72 mistake/fix pairs, ~3,700 words written by
a human. All of it lives inside `/app`, which is `noindex, nofollow` by
design and disallowed in `robots.txt`.

**Indexable pages that contain any of it today: zero.**

That content is the strongest search and answer-engine asset the product has,
and right now neither a search engine nor an AI assistant can see a word of
it.

## Lighthouse — `/` (landing)

| Category | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | **90** | **99** |
| Accessibility | **96** | **96** |
| Best practices | **100** | **100** |
| SEO | **100** | **100** |

### Core Web Vitals — `/`

| Metric | Mobile | Desktop | Good threshold |
| --- | ---: | ---: | ---: |
| First Contentful Paint | 1.2 s | 0.4 s | < 1.8 s |
| **Largest Contentful Paint** | **3.4 s** | 0.8 s | < 2.5 s |
| Total Blocking Time | 150 ms | 20 ms | < 200 ms |
| Cumulative Layout Shift | **0** | **0** | < 0.1 |
| Speed Index | 1.6 s | 0.7 s | < 3.4 s |
| Time to Interactive | 4.2 s | 0.8 s | — |

INP is not measurable in a lab run (it needs real interactions); TBT is the
lab proxy and is inside the good band on both.

**Mobile LCP of 3.4 s is the one number that is actually bad.** The LCP
element is the drill-demo screenshot in the hero — a `next/image` fill image.
Phase 3 targets under 2.0 s on the new pages; the landing page needs the same
attention, and it is the same root cause.

Lighthouse opportunities worth naming (mobile):

- `unused-javascript` — ~450 ms
- `legacy-javascript` — ~50 ms
- `color-contrast` — the only accessibility failure, and the only thing
  between 96 and 100

## Crawl state

| Thing | Value |
| --- | ---: |
| Indexable pages | **7** |
| URLs in sitemap | 6 |
| Drill pages indexable | **0** |
| Sport hub pages | **0** |
| `lastmod` values that are real | **0** (all six are the build timestamp) |
| `/llms.txt` | 404 |

### Every public route, as a crawler sees it

| Route | Status | Indexable | H1s | Canonical | JSON-LD |
| --- | ---: | ---: | ---: | --- | --- |
| `/` | 200 | yes | 1 | `https://koachme.ai` | Organization, WebSite, WebApplication, FAQPage |
| `/about` | 200 | yes | 1 | absolute | AboutPage |
| `/become-a-coach` | 200 | yes | **0** | absolute | — |
| `/contact` | 200 | yes | 1 | absolute | — |
| `/privacy` | 200 | yes | 1 | absolute | — |
| `/terms` | 200 | yes | 1 | absolute | — |
| `/coach` | 200 | **yes** | **0** | **none** | — |
| `/app` | 200 | no (`noindex, nofollow`) | 0 | none | — |
| `/admin/login` | 200 | no (`noindex, nofollow`) | 1 | none | — |

### Structured data present today

`Organization`, `WebSite`, `WebApplication`, `FAQPage` (landing);
`AboutPage` (about).

Absent: `VideoObject`, `HowTo`, `BreadcrumbList`, `ItemList` — i.e. every type
that would describe the drill library.

## Defects this baseline found

1. **`/coach` is indexable and has no canonical.** It is a product surface
   (per-device state, zero H1). `robots.txt` disallows it, but disallow is
   not `noindex` — a disallowed URL can still be indexed from an inbound
   link, and Google cannot see a `noindex` on a page it is forbidden to
   crawl. It is also absent from the sitemap. It should be `noindex` the way
   `/app` is.
2. **`lastmod` is the build timestamp**, identical on all six URLs. It
   carries no information, and a sitemap that claims everything changed on
   every deploy trains crawlers to ignore the field.
3. **Three meta descriptions exceed 155 characters** and will be truncated:
   `/` (222), `/privacy` (166), `/about` (165).
4. **`/become-a-coach` has no H1.**
5. **The `vercel.app` → `koachme.ai` redirect is a 307, not a 301.** It is
   configured in Vercel's domain settings, not `next.config.ts`. A temporary
   redirect does not consolidate ranking signals.
6. **Canonical/sitemap trailing-slash mismatch on the homepage**: the
   canonical is `https://koachme.ai` and the sitemap says
   `https://koachme.ai/`.
7. **`www.koachme.ai` does not resolve.** Not a defect on its own — worth a
   deliberate decision rather than an accident.

## Content inventory available to expose

| | Count |
| --- | ---: |
| Drills | 24 |
| Sports | 7 |
| AI coaches | 7 |
| Drills with a written summary | 24 / 24 |
| Drills with numbered steps | 24 / 24 |
| Drills with mistake/fix pairs | 24 / 24 |
| Total numbered steps | 121 |
| Total mistake/fix pairs | 72 |
| Words of teaching content | ~3,700 |

Per sport: Soccer 6, Basketball 4, Baseball 4, Track 4, Football 2,
Volleyball 2, Softball 2.

Every drill also has a `trackedStat` of `null` — no stat keys have been
agreed yet, so nothing on a public page may claim a drill improves a
measurable number.

## Ceiling this sets

24 drill pages + 7 sport hubs + 1 library index = **32 new indexable pages**,
taking the site from 7 to 39. That is the number Phase 6 should be measured
against.

---

# After phases 1-3 — 2026-07-30

Same method, same target (`https://koachme.ai`), measured after
`4ae8bf3`. Reproduce with `node scripts/seo-audit.mjs https://koachme.ai`
and `node scripts/crawl-check.mjs https://koachme.ai`.

## Crawl state

| | Before | After |
| --- | ---: | ---: |
| Indexable pages | 7 | **38** |
| Drill pages indexable | 0 | **24** |
| Sport hubs | 0 | **7** |
| URLs in sitemap | 6 | **38** |
| Sitemap URLs with a real lastmod | 0 | **38** |
| Audit problems | 6 | **0** |
| Broken internal links | — | 0 |
| Orphan pages | — | 0 |
| Drills deeper than 3 clicks | — | 0 |
| JSON-LD types | 5 | **9** |
| AI crawlers named in robots.txt | 0 | **10** |

Structured data added: `VideoObject`, `HowTo`, `BreadcrumbList`, `ItemList`
(alongside the existing `Organization`, `WebSite`, `WebApplication`,
`FAQPage`, `AboutPage`).

All six baseline defects are closed except the `vercel.app` redirect, which
is half-closed: a 301 rule now exists in `next.config.ts`, but Vercel's
project-level 307 still answers first at the edge. Removing that
project-level redirect is a dashboard action.

## Lighthouse

| | Before (home) | After (home) | After (drill page) |
| --- | ---: | ---: | ---: |
| Mobile performance | 90 | 86 | 76 |
| Mobile SEO | 100 | **100** | **100** |
| Mobile accessibility | 96 | 96 | 96 |
| Mobile best practices | 100 | 100 | 100 |
| Mobile LCP | 3.4 s | 3.4 s | **4.3 s** |
| Mobile CLS | 0 | **0** | **0** |
| Desktop performance | 99 | **100** | **100** |
| Desktop LCP | 0.8 s | 0.7 s | **0.7 s** |

Mobile SEO is 100 on the library index, a sport hub and a drill page too.

## The LCP target was NOT met, and here is why

Phase 3 targeted mobile LCP under 2.0 s on the new pages. The drill page
measures **4.3 s**. That is a real miss, and worth being precise about
rather than explaining away.

Lighthouse's phase breakdown for that LCP:

| Phase | Time |
| --- | ---: |
| TTFB | 659 ms |
| Load delay | 0 ms |
| **Load time** | **22 ms** |
| **Render delay** | **3,653 ms** |

The LCP element is the video poster, and it arrives in 22 ms. Nothing is
slow to fetch. The 3.65 s is render delay — main-thread work, 1.7 s of it,
with 677 ms in script evaluation under Lighthouse's 4× CPU throttle.

The drill pages are not the cause. Every marketing route loads a byte-identical
set of chunks:

```
/drills/basketball/bb-crossover   858 KB across 11 chunks
/privacy                          858 KB across 11 chunks   (identical)
/                                 858 KB across 11 chunks   (+9 KB landing-only)
```

The new pages contain no client component and ship no JavaScript of their
own. They inherit the app-wide bundle that `/privacy` — a page that predates
this work — already carried, which is the same reason the baseline home page
sat at 3.4 s. The drill page reads worse than home only because its LCP
element is a video poster further down the layout, so it waits longer behind
the same main thread.

**Fixing this means reducing the shared client bundle**, which is a
site-wide piece of work rather than a tweak inside these pages, and it would
lift the landing page by the same amount. Nothing inside Phase 3's scope
moves it: the image is already right-sized and fetched in 22 ms, so
preloading or shrinking the poster would optimise something that is not the
bottleneck.

Desktop, where there is no CPU throttling, lands at 100 / 0.7 s on both the
landing page and a drill page — which is consistent with the diagnosis.

---

# Phase B — mobile LCP, 2026-07-30

## What was measured, and what changed

The addendum's prime suspect was the autoplaying hero video. That was
correct, and it was a real contributor — but it was not the whole cost.

Before, mobile `/`:

| Phase | Time |
| --- | ---: |
| TTFB | 686 ms |
| Load delay | 551 ms |
| Load time | 309 ms |
| Render delay | 1,809 ms |

The LCP element is the hero poster. Its load was being delayed 551 ms and
slowed 309 ms because the 1.4 MB hero WebM was downloading alongside it.

After deferring the video past window load on desktop and removing mobile
autoplay entirely:

| Phase | Before | After |
| --- | ---: | ---: |
| Load delay | 551 ms | **0 ms** |
| Load time | 309 ms | **0 ms** |
| Video bytes fetched on mobile | 399 KB | **815 bytes** |
| Render delay | 1,809 ms | 2,500–3,800 ms |

The video's interference is gone completely. What remains is render delay.

## The target was not met, and single runs cannot tell you why

Three consecutive Lighthouse runs against the same production build:

| Run | Performance | LCP | TBT |
| ---: | ---: | ---: | ---: |
| 1 | 87 | 3,307 ms | 282 ms |
| 2 | 93 | **2,518 ms** | 241 ms |
| 3 | 76 | 4,416 ms | 302 ms |
| **Median** | **87** | **3,307 ms** | **282 ms** |

A 1.9-second spread on an identical build. Any single number in this range
is measurement noise as much as signal, so the earlier "4.5 s" reading was
not a regression and the "3.4 s" baseline was not a stable floor either.

Median mobile LCP is **3,307 ms against a 2,500 ms target**. The best run
landed at 2,518 ms — 18 ms over.

## What is actually left

With load delay and load time both at 0 ms, the LCP image is available
almost immediately and the page still cannot paint it. That is main-thread
work during hydration, on Lighthouse's 4× CPU throttle.

Ruled out by measurement, not assumption:

- **Not the video** — 815 bytes now fetched on mobile.
- **Not layout dependency** — `.mk-hero-video` has a fixed
  `aspect-ratio: 390/844` inside a fixed `min(340px, 82vw)` container, so
  the poster's box never depends on the text above it. CLS stays 0.
- **Not app code leaking into the marketing bundle** — every chunk was
  fetched and searched for app-only identifiers (`POSITIONS_BY_SPORT`,
  `drillTrialState`, `lucide`, `supabase`, and others). No matches: all
  858 KB is React and Next runtime.

  > **Correction, 2026-07-30 (see "Phase B, take two" below).** The first
  > half of that is right and the last sentence is wrong. It is not app
  > code — but it is not all framework either. About 30% of it was the
  > Sentry browser SDK. The search only looked for identifiers belonging to
  > *our* code, so a third-party dependency was never a candidate, and
  > "no app code found" got written up as "therefore framework". Absence of
  > the thing you searched for is not presence of the thing you assumed.

The remaining lever is shipping less framework JavaScript to pages that are
almost entirely static — removing client components from the marketing tree
(`CtaLink`, `SectionViews`, `FaqList`, `ReturningUserBanner`, `HeroVideo`).
That is a deliberate refactor with a CRO cost, since `CtaLink` is what
Phase 5 wants for funnel tracking, and it should be decided rather than
slipped in at the end of a performance pass.

Desktop remains 100 / 0.7 s throughout.

---

# Phase B, take two — the bundle, 2026-07-30

The Phase B brief named two suspects: a client component or provider in the
root layout, and the large `@ts-nocheck` prototype files leaking into a
shared chunk. Neither is the cause. Both were ruled out by measurement:

- `src/app/layout.tsx` holds fonts and `<Analytics />`. There are no
  providers in it, so there are none to move out of it.
- The `(marketing)` route group and its own layout already shipped in
  Phase 3. The split the brief asks for largely exists.
- No app identifier appears in any marketing chunk.

## What it actually was

`src/instrumentation-client.ts` opened with
`import * as Sentry from "@sentry/nextjs"`. The `if (dsn)` guard beneath it
stopped `init()` from *running*; it could not stop the SDK from being
*bundled*, because a static import is unconditional. It decides what ships,
not what runs.

So the Sentry browser SDK was in the chunk every route shares — the landing
page, a drill page, and the privacy policy alike.

**And it was doing nothing.** `NEXT_PUBLIC_SENTRY_DSN` is unset in every env
file, and no Sentry ingest URL appears in any chunk deployed to
`koachme.ai`. Every visitor downloaded and parsed the SDK so that it could
decline to initialise.

Measured by building both ways (`node scripts/bundle-report.mjs`):

| `/privacy` | Brotli | Parsed |
| --- | ---: | ---: |
| Static import (before) | 193.5 KB | 752.8 KB |
| No Sentry at all | 132.0 KB | 528.4 KB |
| **Dynamic import (shipped)** | **134.6 KB** | **533.6 KB** |
| Saving | **58.9 KB** | **219.2 KB** |

The dynamic import lands 2.6 KB above full removal — the Sentry build
plugin's own shim — and keeps the capability: set a DSN and tracking returns
on its own, in its own chunk, asynchronously, without blocking first paint.

## Two corrections to the earlier numbers

**The 858 KB figure counted a bundle modern browsers never fetch.** 110 KB
of it is Next's core-js polyfill chunk, served `noModule`. The real
modern-browser payload was 752.8 KB parsed. `scripts/bundle-report.mjs`
now reports the two separately.

**Compressed vs uncompressed was never stated.** `next start` serves
uncompressed; Vercel serves brotli. Comparing one against the other is how
a bundle appears to triple overnight. The table above gives both.

## JavaScript per route, after

| Route | Brotli | Parsed |
| --- | ---: | ---: |
| `/` | 138.3 KB | 544.1 KB |
| `/privacy` | 134.6 KB | 533.6 KB |
| `/drills` | 134.6 KB | 533.6 KB |
| `/drills/softball` | 134.6 KB | 533.6 KB |
| `/drills/softball/windmill-pitching` | 134.6 KB | 533.6 KB |
| `/app` | 184.8 KB | 785.3 KB |
| `/coach` | 151.3 KB | 614.4 KB |

The under-150 KB target is met on the wire, which is the number that costs a
visitor time. It is not met uncompressed and cannot be: react-dom alone is
222 KB parsed, and the App Router runtime ships on every route whether a
page uses it or not.

The drill pages carry **no page-specific client JavaScript at all** — the
same ten chunks as `/privacy`, and not one more. The tap-to-play video is a
plain `<video controls preload="none">`, so the "island" costs zero bytes.

## Mobile LCP, before and after

Localhost production builds, same machine, same script, median of three
runs each. Localhost has no network latency, so treat the *delta* as the
result and the absolute numbers as harness-specific.

| Route | LCP before | LCP after | TBT before | TBT after | Perf before | Perf after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 4,745 ms | **4,364 ms** | 212 ms | **196 ms** | 78 | **81** |
| `/privacy` | 3,967 ms | **3,516 ms** | 180 ms | **157 ms** | 85 | **89** |
| drill page | 4,436 ms | **3,798 ms** | 201 ms | **118 ms** | 82 | **88** |

Every metric moved the right way on every route, which is the part worth
trusting. Individual runs still spread by more than a second (the drill page
measured 3,177 / 4,461 / 4,436 before), so no single figure here is
meaningful on its own, and the honest read is "consistent direction, noisy
magnitude". CLS stayed 0 everywhere.

**LCP is still above the 2,500 ms target on this harness.** The remaining
cost is the App Router runtime hydrating pages that have nothing to
hydrate. Cutting further means removing the marketing tree's client
components (`CtaLink`, `SectionViews`, `FaqList`, `ReturningUserBanner`,
`HeroVideo`) — and `CtaLink` is exactly what Phase 5 wants for funnel
tracking, so that trade is a product decision, not a performance cleanup.

Re-measure against production after this deploys; the numbers there are the
ones that count.
