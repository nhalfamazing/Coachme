import type { Metadata } from "next";
import Link from "next/link";
import { AboutJsonLd } from "@/components/marketing/json-ld";

export const metadata: Metadata = {
  title: "About",
  description:
    "KoachMe is a family-built platform from Miami giving young athletes an honest training profile: real logged work, honestly labeled stats and AI content.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About KoachMe",
    description:
      "A father and son project from Miami: an honest training profile for young athletes.",
    url: "/about",
  },
};

// ============================================================
// RASHEID: this page intentionally ships with placeholders for all
// founder identity: [FOUNDER_NAME], [FOUNDER_STORY], [FOUNDER_PHOTO].
// Publishing anything about a minor founder (name, age, photo, school,
// team) is a real decision with real tradeoffs, and it is yours to
// make, not an AI's. The page reads fine without them until then.
// ============================================================

export default function AboutPage() {
  return (
    <main className="mk-wrap mk-prose">
      <AboutJsonLd />
      <p className="mk-prose-meta mono">About KoachMe</p>
      <h1 className="display">Built at our kitchen table</h1>

      <p>
        KoachMe is a father and son project from Miami. It started the way a
        lot of family projects start: with a problem we kept running into and
        no good answer for it.
      </p>
      <p>
        {/* [FOUNDER_STORY]: the personal version of this story, in the
            founder's own words, goes here when the family decides what to
            share. Until then this page sticks to what the product itself
            can vouch for. */}
        Youth sports asks families for a lot: early mornings, long drives,
        real money. What it gives back is mostly memories and a few
        highlights on someone's phone. The actual work, the hundreds of
        workouts, the slow climb of a sprint time or an exit velo, mostly
        evaporates. We wanted a place where that work adds up to something a
        kid can point at and say: this is mine, I did this.
      </p>

      <h2 className="display">What we believe</h2>
      <ul>
        <li>
          <strong>Real numbers only.</strong> Nothing in KoachMe is invented:
          no fake coaches, no padded stats, no fabricated reviews. Every stat
          is labeled with how it was verified, and self-reported means
          self-reported, right on the card.
        </li>
        <li>
          <strong>AI is labeled, always.</strong> Our drill demos are
          AI-generated today, and every one of them says so where you watch
          it. If something on KoachMe is not a real person, we tell you.
        </li>
        <li>
          <strong>Kids are not accounts.</strong> Athletes sign in with a
          3-word code instead of an email address. We collect the minimum a
          sports profile needs, and the privacy policy lists all of it in
          plain language.
        </li>
        <li>
          <strong>Coaches deserve a fair deal.</strong> Coaches set their own
          rates and keep 90% when paid bookings launch. The platform should
          work for the people doing the coaching.
        </li>
      </ul>

      <h2 className="display">Where we are</h2>
      <p>
        KoachMe is young and we say so on the front page. The athlete side is
        free and working today: profiles, workout logging, streaks, drills,
        and messaging. Coach verification is being built in the open, with
        honest pending states instead of pretend badges.
      </p>
      <p>
        If that sounds like something your family or your athletes would use,
        we would love to have you.{" "}
        <Link href="/app">Create a free athlete profile</Link> or{" "}
        <Link href="/become-a-coach">apply as a coach</Link>.
      </p>
    </main>
  );
}
