# Reconcile offer copy — founding member model

**Status:** All phases 0-6 executed and pushed on 2026-08-01. Saved before execution.

---

SESSION: reconcile offer copy. Eight visible surfaces and two Offer schema nodes currently advertise $9/month for something nobody is charged for. That is a factual inaccuracy in structured data that Google and AI engines are actively reading, on a site whose positioning is that we do not fabricate anything. Fix it, and establish the founding-member model. Commit per phase. Save this prompt to docs/prompts/ first.

THE OFFER, DEFINITIVE:
- KoachMe is free during beta. Nobody is charged anything today.
- Anyone who signs up during beta becomes a FOUNDING MEMBER.
- Founding members keep these permanently free, for as long as the account is active: athlete profile, unlimited workout and drill logging, core stat tracking, streaks and XP, full access to the drill library as it exists at the end of beta, coach discovery, messaging, and booking.
- Founding members are NOT promised free access to features built after beta ends. New premium features may be paid. Say this plainly rather than burying it.
- Pricing will launch for new users later. No date is set. We commit to 30 days notice before any pricing change affects anyone.
- Do not state a price anywhere. We have not decided one. Remove every "$9" and "first month free" claim.

PHASE 0: DIAGNOSTIC FIRST (report before changing anything)
1. Does profiles have a plan column? Does src/lib/entitlements.ts exist? The monetization session that specified them may never have run.
2. Read docs/offer-copy-inventory.md and confirm all eight surfaces plus two Offer nodes still match it. Report anything that has drifted.
3. Report what exists before building. Do not assume.

PHASE 1: OFFER AS DATA
1. Extend src/lib/offer.ts to be the single source of truth: beta status, the founding-member benefit list as an array, the notice-period commitment, and a boolean PRICING_LAUNCHED defaulting false.
2. NO price fields. Not zero, not null, not "TBD" - absent. A price we have not decided cannot be represented as data without something rendering it.
3. Every offer claim on the site reads from this module. If a string in a component says anything about cost, it is a bug.
Commit: "feat: offer model as single source of truth"

PHASE 2: SCHEMA — DO THIS BEFORE THE COPY
The two Offer nodes advertising $9/month are the most urgent item: search engines and AI assistants are reading a false price right now.
1. Replace both with an Offer node stating price 0, priceCurrency USD, availability InStock, and a description naming the beta. Only claim what is true today.
2. Add no future pricing to schema. Structured data describes what is, not what might be.
3. Verify with scripts/schema-check.mjs - zero problems.
Commit: "fix: Offer schema no longer advertises a price we do not charge"

PHASE 3: COPY PASS
Rewrite all eight surfaces from docs/offer-copy-inventory.md. Voice rules unchanged: short, natural, sentence case, no em dashes, no AI-sounding openers.
1. Hero stamp: "FREE FOR ATHLETES" becomes "FREE DURING BETA" or similar - propose two options, show both in the report.
2. Drills section: currently "first month free, then $9 a month". Replace with the beta reality and the founding benefit. No price.
3. Coaches section: "cost nothing, forever" is unqualified and now misleading. Scope it to what is actually permanent.
4. /pricing page: rebuild around the founding model. A clear two-column layout - what is free during beta, what founding members keep permanently - plus the honest note that features built later may be paid, and the 30-days-notice commitment. This page must survive a parent reading it carefully.
5. FAQ: rewrite "Is it really free?" honestly. Add "What is a founding member?", "Will you ever charge me?", and "What happens when beta ends?". FAQPage schema must match visible copy verbatim - rerun scripts/faq-schema-check.mjs.
6. Urgency is allowed ONLY where true. Permitted: founding status ends when pricing launches; the 30-day notice commitment. FORBIDDEN: countdown timers, invented member counts, invented deadlines, "limited spots", scarcity language of any kind that is not literally true.
Commit: "copy: founding member offer across all surfaces"

PHASE 4: FOUNDING MEMBER MECHANICS
1. If profiles lacks a plan column, add it - additive migration, self-apply. Default 'founding' while PRICING_LAUNCHED is false.
2. Every existing profile is backfilled to 'founding'. They signed up under earlier promises and we keep them.
3. Visible FOUNDING MEMBER stamp on the athlete profile, using the existing stamp component.
4. Final signup step states the founding benefit in one plain sentence a kid can read, alongside the existing beta AI notice if that has shipped.
5. NO payment code. No Stripe, no checkout, no card capture. Not this session.
Commit: "feat: founding member status"

PHASE 5: LEGAL COPY - FLAG, DO NOT WRITE
1. A grandfathering promise is a commitment we are making to families. /terms and /privacy are still DRAFT-flagged and unreviewed.
2. Draft the paragraph terms would need to reflect the founding promise and the notice period, put it in docs/terms-additions-draft.md, and mark it clearly as needing legal review. Do NOT publish it to /terms.
3. Report this as blocking before any real money is charged.
Commit: "docs: draft terms language for founding promise"

PHASE 6: VERIFY
1. Grep the entire codebase for "$9", "9 a month", "first month", "per month", "/mo", "forever". Every hit must either be gone or be verifiably true. Report each survivor with its justification.
2. Rerun schema-check.mjs and faq-schema-check.mjs - zero problems.
3. Build clean, screenshots 390/1440 of landing, /pricing, signup final step, profile with the stamp.
4. Confirm no page states a price and no page contains manufactured urgency.
5. Push. REPORT: every copy change as before and after for Rasheid and Sophia to read, the two hero stamp options, and anything you found that contradicts the offer model.

HARD RULES: no price stated anywhere, no fabricated urgency or counts, existing users grandfathered, AI disclosures untouched, no payment code, additive migrations only, never print secrets, .env.local gitignore check per commit.

---

## Mid-session corrections

### Community feed added to the founding benefits (asked in Phase 0, answered)

The founding-member list in the prompt above omits the community feed, but
`OFFER.athleteFree` already listed "Posting to the community feed", the FAQ
said posting costs nothing, and the in-app lock screen promised
"PROFILE · WORKOUTS · FEED · MESSAGES · SESSIONS STAY FREE". Writing the
list exactly as specified would have quietly withdrawn something existing
users were already promised — the same class of problem this session exists
to fix.

**Decision: include the feed** in the permanent founding benefits.

### The in-app drill trial gate contradicts the offer (found in Phase 0)

`src/app/app/page.tsx` locks the drill library 30 days after the first drill
is opened and shows "YOUR FREE MONTH IS DONE … $9 a month once payments
launch". Founding members are promised the full drill library free, so the
lock cannot stand. Scope decision: keep all the trial machinery, but treat
the trial as never expiring while `PRICING_LAUNCHED` is false. One condition
at the source, no gate rewrite.

