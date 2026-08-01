import type { Metadata } from "next";
import Link from "next/link";
import { openGraph, twitter } from "@/lib/og";
import { pricingTldr } from "@/lib/aeo";
import { OFFER, costSentence, noticeSentence } from "@/lib/offer";
import { DRILLS } from "@/lib/drills";
import { libraryTotals } from "@/lib/drill-seo";
import { UpdatedStamp } from "@/components/marketing/updated-stamp";
import { PricingJsonLd } from "@/components/marketing/pricing-json-ld";
import { PRICING_UPDATED } from "@/lib/sitemap-data";

/* What KoachMe costs.
 *
 * WRITTEN FOR A PARENT READING CAREFULLY. This page used to say the drill
 * library was "$9 a month" — a price nobody was ever charged, on a site
 * whose whole positioning is that we do not fabricate anything. The fix is
 * not a better price. It is stating what is true: free during beta,
 * founding status for anyone who signs up, and an honest limit on what
 * that promise covers.
 *
 * NO PRICE APPEARS HERE, and none may be added until one is actually
 * charged. src/lib/offer.ts has no price field precisely so this page
 * cannot render one by accident.
 *
 * THE TWO CLAIMS THAT MUST NEVER QUIETLY DISAPPEAR: that features built
 * after beta may be paid, and the notice period. A grandfathering promise
 * without its limit printed next to it is the misleading version, and it
 * is the version a parent would be right to be annoyed about later.
 */

export const dynamic = "force-static";

const TITLE = "What does KoachMe cost?";
const SUMMARY =
  "KoachMe is free during beta and nobody is charged. Sign up now and you are a founding member: the features you use today stay free while your account is active.";

export const metadata: Metadata = {
  title: "Pricing",
  description: SUMMARY,
  alternates: { canonical: "/pricing" },
  openGraph: openGraph({ title: TITLE, description: SUMMARY, path: "/pricing" }),
  twitter: twitter({ title: TITLE, description: SUMMARY, path: "/pricing" }),
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
      <UpdatedStamp date={PRICING_UPDATED} />

      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{pricingTldr()}</p>
      </section>

      <h2 className="display" id="today">What does it cost today?</h2>
      <p>
        <strong>Nothing.</strong> {costSentence()} There is no card on file
        and no checkout, because neither has been built, and there is no
        trial clock that runs out and locks something.
      </p>
      <p>
        Reading every drill on this website is free too, with no signup and
        no email address — all {totals.drills} of them, across{" "}
        {totals.sports} sports, with their steps and their videos.{" "}
        <Link href="/drills">Browse the drill library</Link>.
      </p>

      <h2 className="display" id="founding">What is a founding member?</h2>
      <p>
        Anyone who signs up during beta. It costs nothing, and there is
        nothing to claim or apply for — creating a profile while KoachMe is
        in beta is all it takes.
      </p>

      {/* The comparison a parent actually needs: what free means right now
          versus what specifically survives after it stops being free for
          new users. The right column is the commitment; the left is just
          the current state. */}
      <div className="mk-pricing-cols">
        <section className="mk-pricing-col" aria-labelledby="col-beta">
          <span className="stamp stamp--flat" id="col-beta">
            Free during beta
          </span>
          <p className="body">Everyone, right now:</p>
          <ul className="mk-pricing-list">
            <li>All of KoachMe, with nothing held back</li>
            <li>Anything else we add before beta ends</li>
            <li>No card on file and no checkout</li>
            <li>No trial that expires</li>
          </ul>
        </section>

        <section className="mk-pricing-col mk-pricing-col--keep" aria-labelledby="col-founding">
          <span className="stamp stamp--flat stamp--lime" id="col-founding">
            Founding members keep
          </span>
          <p className="body">
            Free permanently, for as long as the account is active:
          </p>
          <ul className="mk-pricing-list">
            {OFFER.foundingBenefits.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <h2 className="display" id="limits">What is not covered?</h2>
      <p>
        <strong>{OFFER.foundingExcludes}</strong> Founding status protects
        the list above, not everything KoachMe might one day become. If we
        build something substantial after beta — a new tool, a new kind of
        coaching — it may cost money, and founding members would pay for it
        like anyone else.
      </p>
      <p>
        That is written here, in the same size type as the promise, on
        purpose. A grandfathering claim without its limit next to it is the
        version that makes someone feel tricked two years from now.
      </p>

      <h2 className="display" id="later">When does pricing launch?</h2>
      <p>
        We do not know, and no date is set. Pricing will launch for new
        users at some point. When it does, founding members keep what they
        already have, and new signups stop becoming founding members.
      </p>
      <p>
        <strong>{noticeSentence()}</strong> That is the only deadline on
        this page, because it is the only one that exists.
      </p>

      <h2 className="display" id="coaches">What do coaches pay?</h2>
      <p>
        Nothing to apply or to be listed. Coaches set their own hourly rates
        and keep {OFFER.coachTakeRatePercent}% of them when paid bookings
        launch.{" "}
        <Link href="/become-a-coach">Apply as a coach</Link>.
      </p>

      <h2 className="display" id="events">Do I have to pay for showcase events?</h2>
      <p>
        No. A KoachMe profile grows from the training an athlete already
        does, logged workout by workout. Showcase-style verification — the
        EVENT label — is one way to upgrade a stat later, not the price of
        entry.{" "}
        <Link href="/verification">How stats are verified</Link>.
      </p>

      <h2 className="display" id="start">How do I start?</h2>
      <p>
        Create a profile. It takes about a minute and needs no email
        address, because athletes sign in with a 3-word code instead.{" "}
        <Link href="/app?signup=1">Start free</Link>, or read{" "}
        <Link href="/terms">the terms</Link> first.
      </p>
    </main>
  );
}
