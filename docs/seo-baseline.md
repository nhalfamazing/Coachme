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
