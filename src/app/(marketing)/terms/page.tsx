import type { Metadata } from "next";
import Link from "next/link";
import { openGraph, twitter } from "@/lib/og";
import { OFFER } from "@/lib/offer";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "KoachMe's terms in plain language: who the platform is for, how coaches are expected to behave, content rules, and what KoachMe does not promise.",
  alternates: { canonical: "/terms" },
  openGraph: openGraph({
    title: "KoachMe terms of use",
    description: "Who KoachMe is for, how coaches are expected to behave, and how accounts work.",
    path: "/terms",
  }),
  twitter: twitter({
    title: "KoachMe terms of use",
    description: "Who KoachMe is for, how coaches are expected to behave, and how accounts work.",
    path: "/terms",
  }),
};

// DRAFT: plain-language terms matching actual current practice. Requires
// review by a qualified lawyer before being relied on.

export default function TermsPage() {
  return (
    <main className="mk-wrap mk-prose">
      <p className="mk-prose-meta mono">Terms of use · Last updated July 28, 2026</p>
      <h1 className="display">Terms, in plain language</h1>

      <p className="mk-notice body">
        Draft: these terms were written in plain language to match how
        KoachMe actually works today and have not yet been reviewed by a
        lawyer. Legal review happens before KoachMe leaves its early phase.
      </p>

      <h2 className="display">Who KoachMe is for</h2>
      <p>
        KoachMe is for athletes ages 6 to 25, their families, and the coaches
        who train them. If an athlete is a minor, a parent or guardian should
        set up the profile with them and stay involved in how they use it,
        including messaging.
      </p>

      <h2 className="display">Honest numbers</h2>
      <p>
        The product only works if the numbers are real. Log workouts you
        actually did and stats you actually hit. Self-reported stats are
        labeled SELF until a coach, facility, or event verifies them, and
        misrepresenting verified stats is grounds for removal.
      </p>

      <h2 className="display">Coach conduct</h2>
      <p>
        Coaches on KoachMe work with minors, and we expect them to act like
        it. That means honest credentials on their application, professional
        communication, and no contact that a parent would object to. Coaches
        start as pending while verification is built out; claiming to be
        verified when you are not will get you removed.
      </p>

      <h2 className="display">Content rules</h2>
      <ul>
        <li>No harassment, bullying, or hate in posts or messages</li>
        <li>No impersonating another person, coach, or organization</li>
        <li>No spam or advertising in the community feed</li>
        <li>Nothing sexual, violent, or otherwise inappropriate for a platform used by children</li>
      </ul>
      <p>
        We can remove content or profiles that break these rules.
      </p>

      <h2 className="display">What KoachMe does not promise</h2>
      <p>
        KoachMe does not promise scholarships, recruitment, playing time, or
        athletic results. We give athletes a place to record real work and
        connect with coaches; what happens on the field is up to them.
        Drill demos labeled AI COACH are AI-generated instructional content,
        not personalized coaching advice.
      </p>

      <h2 className="display">The service today</h2>
      <p>
        KoachMe is early-stage software provided as is, and it is in beta.
        Everything in it is free today and nobody is charged: there is no
        card on file, no checkout, and no trial that expires. No price has
        been set. Features may change, and we may update these terms as the
        product grows; the date at the top reflects the latest version.
      </p>
      <p>
        Pricing will launch for new users at some point, with no date set.
        Accounts created during beta are founding accounts, and we intend
        that they keep the features listed on{" "}
        <Link href="/pricing">the pricing page</Link> free for as long as
        the account is active. Features built after beta ends may be paid,
        including for founding accounts. We will give at least{" "}
        {OFFER.noticeDays} days notice before any pricing change affects
        anyone.
      </p>

      <h2 className="display">Contact</h2>
      <p>Questions about these terms: [CONTACT_EMAIL].</p>
    </main>
  );
}
