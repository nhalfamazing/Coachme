# Offer copy — every place it appears

**Compiled 2026-07-30. Nothing in this document has been changed.** This is
an inventory for the monetization session, so the offer can be reconciled in
one pass instead of being found a surface at a time.

## The discrepancy

Every shipped surface says the same thing, and it is internally consistent:

> The AI drill library is **free for the first month, then $9 a month**.
> Subscriptions have not launched, so an ended free month locks the drill
> videos and **nobody is charged**.

The founding-member beta model — free during beta, early users keep founding
status — **has not shipped**. No surface mentions it. Reconciling the two is
deliberately out of scope for the 2026-07-30 SEO session; the risk of a
half-changed offer (a landing page promising one thing and terms promising
another) is worse than the current state, which at least agrees with itself.

Line numbers are as of commit `0ae6283`.

## Visible copy

| File | Lines | What it says |
| --- | --- | --- |
| [`src/app/(marketing)/page.tsx`](../src/app/(marketing)/page.tsx) | 185–186 | "First month free, then $9 a month. Everything else in KoachMe stays free." |
| [`src/components/marketing/faq-data.ts`](../src/components/marketing/faq-data.ts) | 12 | "The AI drill library is free for your first month, then $9 a month." |
| [`src/components/marketing/faq-data.ts`](../src/components/marketing/faq-data.ts) | 13 | "Subscriptions have not launched yet. When a free month ends today, drills simply lock until payments go live - nobody is charged." Also states coaches keep 90%. |
| [`src/app/(marketing)/terms/page.tsx`](../src/app/(marketing)/terms/page.tsx) | 84–87 | "The AI drill library is free for the first month of use, then $9 a month; until subscriptions launch, an ended free month locks the drill videos and nobody is charged." |
| [`src/app/(marketing)/drills/page.tsx`](../src/app/(marketing)/drills/page.tsx) | 114–118 | "…the whole library — free for the first month, and nobody is charged while subscriptions are still to launch." |
| [`src/app/(marketing)/drills/[sport]/page.tsx`](../src/app/(marketing)/drills/[sport]/page.tsx) | 117–121 | Same sentence, sport hub. |
| [`src/app/(marketing)/drills/[sport]/[drillSlug]/page.tsx`](../src/app/(marketing)/drills/[sport]/[drillSlug]/page.tsx) | 260–264 | Same sentence, drill page. Comment at 255–258 explicitly requires it to match the FAQ word for word. |
| [`src/app/(marketing)/pricing/page.tsx`](../src/app/(marketing)/pricing/page.tsx) | whole page | **Added 2026-07-30.** Takes every number from `src/lib/offer.ts` — no price is typed out in its prose. |
| [`src/lib/aeo.ts`](../src/lib/aeo.ts) | `pricingTldr`, `siteTldr` | Answer-first blocks. Also read their numbers from `OFFER`. |

## The numbers, in one place

[`src/lib/offer.ts`](../src/lib/offer.ts) (added 2026-07-30) holds
`proPriceUsd`, `trialDays`, `paymentsLive`, `coachTakeRatePercent` and the
free-feature list. `/pricing`, the pricing schema, and the answer-first
blocks all read from it, so changing the price there changes all of them.

**The seven prose surfaces above still spell "$9" out longhand** and are
untouched by design. `paymentsLive` is the switch that matters most: while
it is `false`, every surface must keep saying nobody is charged, and
`src/lib/aeo.test.ts` asserts that.

## Structured data

| File | Lines | What it claims |
| --- | --- | --- |
| [`src/components/marketing/json-ld.tsx`](../src/components/marketing/json-ld.tsx) | 55–73 | Two `Offer` nodes on `WebApplication`. |
| | 58–61 | `price: "0"` — "Free for athletes… AI drill library included free for the first month." |
| | 66–71 | `price: "9"`, `priceCurrency: "USD"`, `availability: PreOrder` — "AI drill library after the first free month, $9 per month." |

`PreOrder` is doing real work here: it is the honest availability for a price
that is advertised but not charged. If the offer becomes free-during-beta,
the $9 Offer node should be **removed**, not repriced — a `price: "0"` Offer
plus a PreOrder for a future price is a different claim from a $9 offer
nobody is billed for.

## In-app product surfaces

All in [`src/app/app/page.tsx`](../src/app/app/page.tsx), which is the
vendored `@ts-nocheck` prototype. Changing copy here is safe; changing the
gate logic is not, and is its own piece of work.

| Lines | What it is |
| --- | --- |
| 3002–3007 | The rule, as a comment: 30 days from the first drill opened, then $9/month, payments not live, nobody charged. |
| 3008–3010 | `DRILL_TRIAL_DAYS = 30`, `PRO_PRICE_LABEL = '$9/MO'` — the price string every badge below renders. |
| 3092 | Comment: the free month starts on first drill open, not on signup. |
| 3137–3148 | Always-visible trial badge: `FIRST MONTH FREE` / `FREE MONTH · N DAYS LEFT` / `PRO · $9/MO`. |
| 3297 | Per-drill card badge: `PRO · $9/MO` once expired. |
| 3687 | Lock screen headline: "YOUR FREE MONTH IS DONE". |
| 3690–3693 | Lock screen body: "AI drills are part of KoachMe Pro: $9 a month once payments launch. Until then drills stay locked and nobody is charged." |

## Notes for whoever changes this

- **Seven visible surfaces must move together.** The drill page carries a
  comment demanding its wording match the FAQ exactly; that constraint is
  the reason the copy is currently consistent, and it will break silently if
  one surface is updated alone.
- **`PRO_PRICE_LABEL` is the only price constant.** Everything else spells
  "$9" out in prose, so a find-and-replace on the constant changes the
  badges and none of the sentences.
- **Terms is a legal surface.** It should change in the same commit as the
  marketing copy, not after.
- **The trial clock is per profile per device**, stored under the historical
  `coachme_` key namespace (`coachme_drills_trial::<profileId>`). Never
  rename those keys — see [[koachme-rebrand]]: internals keep the coachme
  name permanently.
- Nothing here is in the sitemap, schema validation, or the drill manifest,
  so changing the copy has no SEO-structural consequence beyond the two
  `Offer` nodes above.
