# SEO, AEO and CRO — original plan, phases 0–6

**Date:** 2026-07-30
**Status:** Phases 0–3 shipped (commits `9d147f4` … `4ae8bf3`). Phases 4–6 open.

## Provenance — read this before trusting the text below

This session prompt predates the `docs/prompts/` convention, so it was never
saved. It was **recovered on 2026-07-30 from the Claude Code session
transcript** at:

```
C:\Users\noahr\.claude\projects\C--Users-noahr\93d03f07-08a4-4e33-ba8f-456b82cfbf6c.jsonl
```

(user message, promptId `1bdc847f-4992-445d-b2fa-a61896b0e065`, beginning
"SESSION: SEO, AEO, and CRO.")

**Phases 4, 5, 6 and the hard-rules block below are verbatim.** Phases 0–3
were *not* recovered into this file — they are already shipped, and their
outcome is documented in [../seo-baseline.md](../seo-baseline.md). They remain
in the transcript above if anyone needs them.

That transcript is a local, machine-specific file with no backup. Treat it as
already lost; this file is the copy that survives.

---

## PHASE 4: AEO LAYER

1. /llms.txt at root: curated markdown index following the llms.txt convention - H1 title, blockquote summary of what KoachMe is, then sectioned links to the drill library index, each sport hub, pricing, safety, verification, and about, each with a one-line description.
2. AI TL;DR blocks on the landing page, /pricing, and the safety section. Same rules: neutral, factual, 60-90 words, extractable, no marketing voice.
3. Entity clarity: strengthen Organization schema with foundingDate, location, and sameAs links to real profiles only. Leave sameAs empty if none exist - do not invent profiles. Add a plain "What is KoachMe?" answer block on /about that an AI can quote verbatim and be correct.
4. New page /verification explaining the SELF / TRAINER / FACILITY / EVENT ladder in full. Nobody else in youth sports publishes a verification standard - this is our most distinctive and most citable content. Answer-first, comprehensive, single page.
5. Question-based headings across public pages where it does not damage the design.
6. FAQPage schema must match visible copy exactly. Expand to cover: what KoachMe is, what it costs during beta, how coaches are verified, how kids log in without email, what the AI drills are, what ages it serves, whether athletes can message each other.

Commit: "feat: llms.txt, TLDR blocks, entity and FAQ schema, verification page"

## PHASE 5: CRO

1. The drill page visitor is a high-intent stranger who arrived from a search for one specific drill. Their CTA is not "sign up" - it is "there are 5 more softball drills like this one, free while we're in beta." Build a sport-aware CTA that names the real count for that sport and leads to signup with the sport preselected.
2. Full funnel events into the EXISTING analytics, feeding the admin dashboard already built - do not add a vendor: drill_page_viewed (with sport, drill id, referrer type), drill_video_played, drill_page_cta_click, landing_section_viewed, cta_click with section id, signup_started, signup_step_completed with step number, signup_completed, first_drill_played, first_workout_logged.
3. Add a search-acquisition panel to the admin dashboard: which drill pages drive signups, which sports convert best, which pages get traffic but no conversion.
4. A/B seam: config-driven variants for the hero headline and primary CTA copy, defaulting to one variant, no third-party tool. Mechanism only, no test running.
5. Offer copy must match reality everywhere: KoachMe is free during beta and early users keep founding status. Do not advertise a price we are not currently charging. Add Offer schema to the WebApplication node reflecting the actual current offer, not a future one.

Commit: "feat: search-visitor CRO and funnel instrumentation"

## PHASE 6: VERIFY AND SHIP

1. Lighthouse mobile and desktop on /, /drills, one sport hub, one drill page. SEO must be 100. Performance must not regress against docs/seo-baseline.md.
2. Validate every schema type in Google Rich Results Test and the Schema.org validator. Zero errors.
3. Crawl locally: no orphan pages, no broken internal links, every drill within 3 clicks of home.
4. Verify /llms.txt and /robots.txt serve correctly on koachme.ai.
5. Integrity sweep: no fabricated content, every AI asset labeled in both visible copy and schema, no HowTo schema on any drill lacking real steps, no page advertising a price we do not charge.
6. Push. Then Rasheid submits the sitemap in Google Search Console and Bing Webmaster Tools.
7. REPORT: before/after table against baseline, count of new indexable pages, schema types shipped, funnel events wired, and the top three things you would do next.

## HARD RULES (all phases)

zero fabricated content, AI disclosure in visible copy AND schema, /app stays noindexed, slugs immutable, all counts computed, koachme.ai canonical everywhere, no storage/schema/route renames, never print secrets, .env.local gitignore check per commit.

---

## Known conflicts with later instructions

Anything here is superseded where a later session says so. Live conflicts as
of 2026-07-30:

- **Phase 5.5 (offer copy)** says to reconcile all surfaces to "free during
  beta / founding status". The 2026-07-30 follow-up session's **Phase F**
  overrides this: the founding-member model has not shipped, offer copy is
  frozen, and the surfaces are only to be *inventoried*. Phase F wins.
- **Phase 4.1 and 4.2** reference `/pricing` and a safety section as link
  targets. Neither exists as a route today.
- **"slugs immutable"** was read in the phase 0–3 session as "the slug is the
  drill id". The follow-up session's Phase A overrules that: slugs are
  keyword-matching and derived from the drill name, with 301s from the old
  id-based paths. Immutability applies from that commit forward.
