# SEO follow-up — slugs, bundle split, video duration, post-audit addendum

**Date:** 2026-07-30
**Executed:** Phases A, B, C, E, F.
**Deferred:** Phase D (SEO phases 4–6) — pulled from this session mid-flight;
the spec is being re-supplied separately. The original text of those phases is
preserved in [2026-07-30-seo-aeo-cro.md](2026-07-30-seo-aeo-cro.md).

---

## Prompt, verbatim

SESSION: SEO follow-up. Phases 0-3 shipped and verified. This fixes two things from your report, then continues to Phases 4-6 plus the post-audit addendum.

PHASE A: SLUGS — DO THIS FIRST, IT GETS MORE EXPENSIVE EVERY DAY
Overruling your call. Slugs become keyword-matching, derived from the drill name, not the id.
1. Add "slug" to each drill in the manifest. Derive from the drill NAME in kebab-case, dropping any sport prefix. The sport is already in the path, so "bb-" is the word basketball repeated.
   bb-mikan -> mikan-drill
   bb-crossover -> crossover
   bb-two-ball -> two-ball-dribbling
   bb-form-shooting -> form-shooting
   fb-catch-triangle -> catch-triangle
   fb-stance-start -> three-point-stance
   tr-a-skip -> a-skip
   tr-bounding -> bounding
   tr-sprint-start -> sprint-start
   tr-arm-drive -> arm-drive
   sb-windmill -> windmill-pitching
   sb-soft-toss -> soft-toss
   vb-forearm-pass -> forearm-passing
   vb-setting -> overhead-setting
   Apply the same pattern to the remaining soccer and baseball drills.
2. Drill id stays the internal key. Nothing about storage, data, or Blob paths changes. This is URLs only.
3. 301 every old /drills/[sport]/[oldId] URL to its new slug. Permanent, no chains.
4. Update the URL-pinning test to the new slugs. From this commit forward slugs are IMMUTABLE - a title reword does not move a URL.
5. Regenerate the sitemap and confirm 38 URLs with the new paths.
Commit: "feat: keyword-matching drill slugs with 301s from old paths"

PHASE B: THE REAL LCP FIX - BUNDLE, NOT MEDIA
Your diagnosis was right and mine was wrong: poster at 22ms, 3.65s render delay, 858KB identical on every marketing route including /privacy. Do not optimize the poster.
1. Find what puts app code in the marketing bundle. Likely suspects: a client component or provider in the root layout, or something importing the large @ts-nocheck prototype files into a shared chunk. Report what you find before changing it.
2. Split marketing from app with App Router route groups: (marketing) and (app), each with its own layout. The marketing layout loads only what marketing pages need. Move providers that only the app requires out of the root layout.
3. Target: marketing routes ship under 150KB of JS. Drill pages are static content and should approach zero client JS beyond the tap-to-play island.
4. Re-measure mobile LCP on a drill page, the landing page, and /privacy. Report all three before and after.
5. If the blocker turns out to be inside the big prototype files, do NOT refactor them in this session. Report exactly what is needed and stop - that is its own night's work.
Commit: "perf: split marketing and app bundles"

PHASE C: VIDEO DURATION
You omitted duration from VideoObject because we do not measure the clips. Correct call, and now fixable: extract real duration with ffprobe in the mirror script, store it in the manifest, and emit it in VideoObject. If ffprobe is unavailable, leave the field absent rather than guessing. Still no embedUrl - there is no player page.
Commit: "feat: real video duration in manifest and schema"

PHASE D: SEO PHASES 4-6
Execute Phase 4 (AEO layer), Phase 5 (CRO), and Phase 6 (verify and ship) from the original prompt as written.

PHASE E: POST-AUDIT ADDENDUM ITEMS
1. og:image is missing entirely - the biggest social gap. Create 1200x630 from brand assets, absolute URL on koachme.ai, default plus per-page (drill posters, sport cards).
2. og:description is 139 chars and truncates on mobile - rewrite to 125 or under. Add og:type and og:site_name, both currently missing.
3. Visible "Updated [date]" on drill pages, hubs, and /verification, from real manifest data. Matching dateModified and datePublished in schema. Never a build timestamp.
4. IndexNow: host the key file at the site root so it resolves at https://koachme.ai/6f6d5aaa2a50f9e821042cd69e3ec899.txt containing exactly that key. Verify it against the dashboard first - if it does not match, stop and ask. Add post-deploy submission for changed URLs.
5. Organization sameAs is empty, flagged HIGH by the audit. Add entries ONLY for profiles Rasheid confirms exist. Do not invent URLs. If none exist, leave it empty and say so.
Commit per item.

PHASE F: OFFER COPY - FLAG ONLY, DO NOT CHANGE
All surfaces now say "free first month." The founding-member beta model has not shipped. Do not reconcile it in this session. List every file and line where offer copy appears so the monetization session can change them in one pass.

HARD RULES unchanged: zero fabricated content or dates, AI disclosure in copy and schema, /app disallowed, /coach noindex and crawlable, koachme.ai canonical, never print secrets, .env.local gitignore check per commit.

---

## Mid-session correction

Sent after Phase A was already underway:

> Correction: skip Phase D for now, I'll paste that spec separately. Continue with Phases A, B, C, E, F as written - all self-contained.
>
> Also, add this so it stops happening: create docs/prompts/ in the repo. Save this session's full prompt there as a dated markdown file, and from now on save every session prompt there before executing it. Commit it as the first commit of each session. That way /clear never loses a spec.
