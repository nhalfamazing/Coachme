# Phase D — AEO, CRO, and final verification

**Date:** 2026-07-30
**Status:** In progress. This is the deferred Phase D from
[2026-07-30-seo-followup.md](2026-07-30-seo-followup.md), re-supplied as its
own spec. It supersedes the original phases 4–6 text archived in
[2026-07-30-seo-aeo-cro.md](2026-07-30-seo-aeo-cro.md).

---

## Prompt, verbatim

PHASE D: AEO, CRO, and final verification. Save this to docs/prompts/ first.

PHASE D1: AEO LAYER
1. /llms.txt at root, following the llms.txt convention: H1 title, blockquote summary of what KoachMe is, then sectioned links to the drill library index, each sport hub, pricing, safety, verification, and about, each with a one-line description.
2. AI TL;DR blocks on the landing page, /pricing, and the safety section. Same rules as the drill page TL;DRs already shipped: neutral, factual, 60-90 words, extractable, assembled from real data, no marketing voice.
3. Entity clarity: strengthen Organization schema with foundingDate and location. sameAs only for profiles Rasheid confirms exist - do not invent. Add a plain "What is KoachMe?" answer block on /about that an AI can quote verbatim and be correct.
4. New page /verification explaining the SELF / TRAINER / FACILITY / EVENT ladder in full. Nobody else in youth sports publishes a verification standard - this is our most distinctive and most citable content. Answer-first, comprehensive, single page.
5. The audit found 0 question-format headings. Convert statement headings to the questions parents actually ask on public pages, where it does not hurt the design.
6. FAQPage schema must match visible copy exactly. Expand to cover: what KoachMe is, what it costs, how coaches are verified, how kids log in without email, what the AI drills are, what ages it serves, whether athletes can message each other.
Commit: "feat: llms.txt, TLDR blocks, entity schema, verification page"

PHASE D2: CRO
1. A drill page visitor is a high-intent stranger who searched one specific drill. Their CTA is not "sign up" - it is "there are 5 more softball drills like this one." Build a sport-aware CTA naming the real computed count for that sport, leading to signup with the sport preselected, landing them on a drill they can log immediately.
2. Success for a drill page is first_drill_played, NOT signup. Primary conversion goal, verbatim: "Athlete activation: a profile created and at least one drill logged in the same session (signup_completed + first_drill_played). Signup alone is a vanity metric while nothing is charged; logging is what predicts return. Secondary goal: coach application submitted (coach_apply_completed), since supply is the bottleneck in a two-sided marketplace with no trainers yet, and one coach serves many athletes."
3. Funnel events into existing analytics, no new vendor: drill_page_viewed (sport, drill id, referrer type), drill_video_played, drill_page_cta_click, landing_section_viewed, cta_click with section id, signup_started, signup_step_completed with step number, signup_completed, first_drill_played, first_workout_logged.
4. Persistent low-key coach CTA in the footer of every public drill and hub page. Coaches searching for drills are supply we want. One line, not a banner.
5. A/B seam: config-driven variants for hero headline and primary CTA copy, defaulting to one variant, no third-party tool. Mechanism only, no test running.
Commit: "feat: search-visitor CRO and funnel instrumentation"

PHASE D3: VERIFY AND SHIP
1. Lighthouse mobile and desktop on /, /drills, one sport hub, one drill page. SEO 100. Performance must not regress against docs/seo-baseline.md.
2. Validate every schema type in the Schema.org validator. Zero errors.
3. Rerun scripts/crawl-check.mjs: no orphans, no broken links, every drill within 3 clicks.
4. Verify /llms.txt and the IndexNow key file both return 200 on koachme.ai.
5. Integrity sweep: no fabricated content or dates, every AI asset labeled in both visible copy and schema, no HowTo schema on any drill lacking real steps.
6. Push. Rasheid then submits the sitemap in Search Console and Bing Webmaster Tools.
7. REPORT: before/after against baseline, new indexable page count, schema types shipped, funnel events wired, and the top three things you would do next.

HARD RULES: zero fabricated content, AI disclosure in copy and schema, /app disallowed, /coach noindex and crawlable, koachme.ai canonical, never print secrets, .env.local gitignore check per commit.

---

## Open conflicts, noted before starting

These were flagged at the end of the previous session and are unresolved in
this spec. Recorded here so the resolution is visible later rather than
inferred from a diff.

1. **`/pricing` does not exist.** D1.1 links to it from llms.txt and D1.2
   wants a TL;DR block on it. Creating it means writing offer copy — and
   Phase F of the previous session froze offer copy pending the monetization
   session. Resolution taken: build `/pricing`, but source every offer
   sentence from the SAME constant the FAQ already uses, so the page adds a
   surface without adding a claim or a new wording to reconcile. Added to
   `docs/offer-copy-inventory.md`.

2. **The safety "section"** named in D1.2 is a landing-page section, not a
   route. TL;DR goes there.

3. **`sameAs` stays empty.** Rasheid confirmed on 2026-07-30 that no KoachMe
   social profiles exist. D1.3 explicitly allows this.

4. **The SELF / TRAINER / FACILITY / EVENT ladder** (D1.4) must be described
   from what the product actually implements. Anything not implemented is
   described as not yet available rather than as a live tier.
