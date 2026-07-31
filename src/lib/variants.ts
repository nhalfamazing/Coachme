/* A/B seam for landing copy. MECHANISM ONLY — no test is running.
 *
 * WHAT THIS IS: a place for headline and CTA copy to have alternatives, and
 * one switch that chooses between them. Everything reads through
 * `activeVariant()`, so starting a test later is a config change rather than
 * a hunt through JSX for hardcoded strings.
 *
 * WHAT THIS IS NOT: a testing tool. There is no bucketing, no persistence,
 * no third-party script, and no measurement beyond the cta_click events the
 * page already sends. Adding those before anyone has decided what to test
 * would be building an answer to an unasked question — and a bucketing
 * mechanism that nobody validates is worse than none, because it silently
 * splits traffic.
 *
 * WHY IT IS SERVER-SIDE AND CONSTANT: the variant is resolved at build time
 * and the same for everybody. That keeps the pages fully static, keeps the
 * marketing bundle where Phase B left it, and means no visitor ever sees a
 * flash of the control copy before JavaScript swaps it — which is the
 * failure mode that makes client-side A/B tools hurt Core Web Vitals.
 *
 * TO RUN A TEST: pick a variant key here (or wire NEXT_PUBLIC_COPY_VARIANT
 * in Vercel to switch between deploys), then compare cta_click by `cta`
 * slot. To do it properly per-visitor, that is a real piece of work: it
 * needs a bucketing cookie set at the edge, and the variant reported on
 * every funnel event so the two sides can be told apart.
 */

export interface CopyVariant {
  /** Landing H1. The `emphasis` half renders in the accent colour. */
  heroTitle: { lead: string; emphasis: string };
  /** Primary CTA label, used in the hero and the closing section. */
  primaryCta: string;
}

/* Every variant must be TRUE. A/B testing is not permission to test a
   claim we cannot support — these differ in emphasis and length, not in
   what they promise. */
export const COPY_VARIANTS = {
  /** Shipped copy. The control. */
  control: {
    heroTitle: { lead: "Starting spots are earned", emphasis: "between practices" },
    primaryCta: "Start free - no email needed",
  },
  /** Leads with the artifact rather than the ambition. */
  proof: {
    heroTitle: { lead: "The work your athlete does", emphasis: "finally adds up" },
    primaryCta: "Start free - about a minute",
  },
} as const satisfies Record<string, CopyVariant>;

export type VariantKey = keyof typeof COPY_VARIANTS;

export const DEFAULT_VARIANT: VariantKey = "control";

/** The variant this build renders. An unknown or unset env value falls back
 *  to the control rather than throwing: a typo in a dashboard should not
 *  take the landing page down. */
export function activeVariantKey(): VariantKey {
  const wanted = process.env.NEXT_PUBLIC_COPY_VARIANT;
  return wanted && wanted in COPY_VARIANTS ? (wanted as VariantKey) : DEFAULT_VARIANT;
}

export function activeVariant(): CopyVariant {
  return COPY_VARIANTS[activeVariantKey()];
}
