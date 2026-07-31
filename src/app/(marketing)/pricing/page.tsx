import type { Metadata } from "next";
import Link from "next/link";
import { openGraph, twitter } from "@/lib/og";
import { pricingTldr } from "@/lib/aeo";
import { OFFER, proPriceLabel } from "@/lib/offer";
import { DRILLS } from "@/lib/drills";
import { libraryTotals } from "@/lib/drill-seo";
import { UpdatedStamp } from "@/components/marketing/updated-stamp";
import { PricingJsonLd } from "@/components/marketing/pricing-json-ld";
import { PRICING_PUBLISHED } from "@/lib/sitemap-data";

/* What KoachMe costs.
 *
 * OFFER COPY IS FROZEN (see docs/offer-copy-inventory.md): the
 * founding-member beta model has not shipped, and this session must not
 * reconcile it. So this page states exactly what the seven existing
 * surfaces already state, and it takes every NUMBER from src/lib/offer.ts
 * rather than typing "$9" out again. When the monetization session changes
 * the offer, this page follows from one constant instead of needing its own
 * pass.
 *
 * The one claim that must never quietly disappear: while OFFER.paymentsLive
 * is false, every surface says nobody is charged. We advertise a price we
 * do not collect, and that is only honest if we keep saying so.
 */

export const dynamic = "force-static";

const TITLE = "What does KoachMe cost?";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    `A KoachMe athlete profile is free forever. The AI drill library is free for the first month, then ${proPriceLabel} a month — and subscriptions have not launched, so nobody is charged yet.`,
  alternates: { canonical: "/pricing" },
  openGraph: openGraph({
    title: TITLE,
    description: `A free athlete profile forever. The drill library is ${proPriceLabel} a month after a free first month.`,
    path: "/pricing",
  }),
  twitter: twitter({
    title: TITLE,
    description: `A free athlete profile forever. The drill library is ${proPriceLabel} a month after a free first month.`,
    path: "/pricing",
  }),
};

export default function PricingPage() {
  const totals = libraryTotals(DRILLS);

  return (
    <main className="mk-wrap mk-prose mk-pricing">
      <PricingJsonLd />

      <nav className="mk-crumbs mono" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Pricing</span>
      </nav>

      <p className="mk-prose-meta mono">Pricing</p>
      <h1 className="display">{TITLE}</h1>
      <UpdatedStamp date={PRICING_PUBLISHED} />

      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{pricingTldr()}</p>
      </section>

      <h2 className="display" id="free">What is free?</h2>
      <p>
        An athlete profile, permanently. These all cost nothing and are not
        part of any subscription:
      </p>
      <ul className="mk-pricing-list">
        {OFFER.athleteFree.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        Reading every drill on this website is also free, with no signup and
        no email address — all {totals.drills} of them, across{" "}
        {totals.sports} sports, with their steps and their videos.{" "}
        <Link href="/drills">Browse the drill library</Link>.
      </p>

      <h2 className="display" id="paid">What costs money?</h2>
      <p>
        One thing: the AI drill library <em>inside the app</em>, which is
        free for the first {OFFER.trialDays} days from the first drill a
        profile opens, then {proPriceLabel} a month.
      </p>
      {!OFFER.paymentsLive && (
        <p>
          <strong>Subscriptions have not launched.</strong> When a free month
          ends today, the drill videos simply lock and nobody is charged.
          There is no card on file, because there is nowhere to put one yet.
        </p>
      )}

      <h2 className="display" id="coaches">What do coaches pay?</h2>
      <p>
        Nothing to apply or to be listed. Coaches set their own hourly rates
        and keep {OFFER.coachTakeRatePercent}% of them when paid bookings
        launch.{" "}
        <Link href="/become-a-coach">Apply as a coach</Link>.
      </p>

      <h2 className="display" id="events">Do I have to pay for showcase events?</h2>
      <p>
        No. A KoachMe profile is free and grows from the training an athlete
        already does, logged workout by workout. Showcase-style verification
        — the EVENT label — is one way to upgrade a stat later, not the price
        of entry.{" "}
        <Link href="/verification">How stats are verified</Link>.
      </p>

      <h2 className="display" id="start">How do I start?</h2>
      <p>
        Create a profile. It takes about a minute and needs no email address,
        because athletes sign in with a 3-word code instead.{" "}
        <Link href="/app?signup=1">Start free</Link>, or read{" "}
        <Link href="/terms">the terms</Link> first.
      </p>
    </main>
  );
}
