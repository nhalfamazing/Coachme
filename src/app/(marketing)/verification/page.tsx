import type { Metadata } from "next";
import Link from "next/link";
import { openGraph, twitter } from "@/lib/og";
import { verificationTldr } from "@/lib/aeo";
import {
  VERIFICATION_TIERS, liveTiers, plannedTierNames, verificationQa,
} from "@/lib/verification";
import { UpdatedStamp } from "@/components/marketing/updated-stamp";
import { VerificationJsonLd } from "@/components/marketing/verification-json-ld";
import { VERIFICATION_PUBLISHED } from "@/lib/sitemap-data";

/* The verification standard, published in full.
 *
 * This page exists because nobody else in youth sports publishes one. A
 * parent comparing platforms, or an AI assistant asked "how does KoachMe
 * verify stats", should find a complete answer here rather than a marketing
 * gesture toward trust.
 *
 * It is also the page most able to embarrass us if it overstates what
 * works. Three of the four tiers are not issuable yet, and the page says so
 * in its own section rather than in a footnote. A standard that describes
 * aspirations as though they were controls is not a standard.
 *
 * Headings are questions on purpose: they are what a parent types, and what
 * an assistant matches against. The Q&A comes from verificationQa() and is
 * rendered here AND as this page's FAQPage schema, which is the only way
 * the two stay identical.
 */

export const dynamic = "force-static";

const TITLE = "How KoachMe verifies athlete stats";
const DESCRIPTION =
  "KoachMe labels every athlete stat SELF, TRAINER, FACILITY or EVENT, showing exactly how it was verified. The full standard, including what is not live yet.";

export const metadata: Metadata = {
  title: "How stats are verified",
  description: DESCRIPTION,
  alternates: { canonical: "/verification" },
  openGraph: openGraph({
    title: TITLE,
    description: "Every stat is labeled SELF, TRAINER, FACILITY or EVENT. The full verification standard.",
    path: "/verification",
  }),
  twitter: twitter({
    title: TITLE,
    description: "Every stat is labeled SELF, TRAINER, FACILITY or EVENT. The full verification standard.",
    path: "/verification",
  }),
};

export default function VerificationPage() {
  const qa = verificationQa();
  const byId = (id: string) => qa.find(q => q.id === id)!;

  return (
    <main className="mk-wrap mk-prose mk-verify">
      <VerificationJsonLd />

      <nav className="mk-crumbs mono" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Verification</span>
      </nav>

      <p className="mk-prose-meta mono">The KoachMe verification standard</p>
      <h1 className="display">{TITLE}</h1>
      <UpdatedStamp date={VERIFICATION_PUBLISHED} />

      {/* Answer-first: the paragraph an assistant can lift and still be
          right about every tier, including the ones that are not live. */}
      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{verificationTldr()}</p>
      </section>

      {/* --- the four labels --- */}
      <h2 className="display" id={byId("labels").id}>{byId("labels").question}</h2>
      {byId("labels").answer.map(p => <p key={p}>{p}</p>)}

      {/* Supplementary detail, not part of the FAQ schema: who applies each
          label and what evidence it takes. */}
      <dl className="mk-verify-ladder">
        {VERIFICATION_TIERS.map(tier => (
          <div key={tier.key} className="mk-verify-tier">
            <dt>
              <span className={`stamp stamp--flat${tier.live ? "" : " stamp--clay"}`}>{tier.key}</span>
              {!tier.live && <span className="mono mk-verify-soon">not issued yet</span>}
            </dt>
            <dd>
              <p className="mk-verify-def"><strong>{tier.definition}</strong></p>
              <p className="mono mk-verify-meta">Applied by: {tier.who}</p>
              <p className="mono mk-verify-meta">Evidence: {tier.evidence}</p>
            </dd>
          </div>
        ))}
      </dl>

      {/* --- what is actually live --- */}
      <h2 className="display" id={byId("today").id}>{byId("today").question}</h2>
      {byId("today").answer.map(p => <p key={p}>{p}</p>)}

      {/* --- why --- */}
      <h2 className="display" id={byId("why").id}>{byId("why").question}</h2>
      {byId("why").answer.map(p => <p key={p}>{p}</p>)}

      {/* --- coaches --- */}
      <h2 className="display" id={byId("coaches").id}>{byId("coaches").question}</h2>
      {byId("coaches").answer.map(p => <p key={p}>{p}</p>)}

      {/* --- the honesty section. Custom markup, so not in the schema. --- */}
      <h2 className="display" id="not">What does KoachMe not verify?</h2>
      <ul>
        <li>
          <strong>Anything labeled SELF.</strong> That is the point of the
          label. A SELF stat has been entered, not checked.
        </li>
        <li>
          <strong>Drill demonstration videos.</strong> They are AI-generated,
          labeled as such on every surface that shows them, and they
          demonstrate a movement rather than record a real
          athlete&apos;s performance.
        </li>
        <li>
          <strong>Anything a stat does not claim.</strong> A verified sprint
          time says a sprint was timed. It does not rank an athlete, project
          them, or promise a coach will agree about them.
        </li>
      </ul>

      <h2 className="display" id="start">How does an athlete start building a verified profile?</h2>
      <p>
        Create a profile and start logging. The stats begin as{" "}
        {liveTiers().map(t => t.key).join(", ")}, the training log begins
        immediately, and the record is real from the first entry. When{" "}
        {plannedTierNames()} arrive, they attach to the profile that is
        already there.
      </p>
      <p>
        <Link href="/app?signup=1">Create a free athlete profile</Link>, or{" "}
        <Link href="/become-a-coach">apply as a coach</Link> if you want to
        be one of the people who can sign a number off.
      </p>
    </main>
  );
}
