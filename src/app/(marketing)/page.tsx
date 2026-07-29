import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReturningUserBanner } from "@/components/marketing/returning-user";
import { FaqList } from "@/components/marketing/faq";
import { LandingJsonLd } from "@/components/marketing/json-ld";
import { CtaLink } from "@/components/marketing/cta-link";
import { DrillSample } from "@/components/marketing/drill-sample";
import { HeroVideo } from "@/components/marketing/hero-video";
import { FieldGeo } from "@/components/marketing/field-lines";
import { DRILLS, DRILL_BLOB_BASE, SPORTS as TICKER_SPORTS, coachFor, type Drill } from "@/lib/drills";

// The hero mockup plays the crossover demo (a silent rep - no speech
// wasted on a muted loop). scripts/make-hero-clip.mjs maintains the
// lightweight WebM variant this references.
const HERO_DRILL = DRILLS.find(d => d.id === "bb-crossover") ?? null;

// One sample per sport for variety (basketball, football, soccer).
// Preferred picks by id, falling back to the sport's first drill so the
// section survives a manifest reshuffle; count in the CTA is computed.
function sampleDrill(sport: Drill["sport"], preferredId: string): Drill | null {
  const ofSport = DRILLS.filter(d => d.sport === sport);
  return ofSport.find(d => d.id === preferredId) ?? ofSport[0] ?? null;
}
const SAMPLE_DRILLS = [
  sampleDrill("Basketball", "bb-crossover"),
  sampleDrill("Football", "fb-catch-triangle"),
  sampleDrill("Soccer", "so-first-touch"),
].filter((d): d is Drill => d !== null);

export const metadata: Metadata = {
  title: "KoachMe - A real training profile for young athletes",
  description:
    "KoachMe gives young athletes a free training profile: log workouts, build honestly labeled stats, watch drills, and connect with real coaches. No email needed, kids log in with a 3-word code.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KoachMe - A real training profile for young athletes",
    description:
      "Log workouts, build honestly labeled stats, and connect with real coaches. Free for athletes, no email needed.",
    url: "/",
  },
};

// INTEGRITY RULE for this page: zero fabricated data. No invented
// testimonials, user counts, ratings, coach names, or press mentions.
// Screenshots are real product views with a clearly sample profile.

export default function LandingPage() {
  return (
    <main className="mk-grain">
      <LandingJsonLd />
      <ReturningUserBanner />

      {/* ---------------- hero ---------------- */}
      {/* Restraint pass cut: the hero had field geometry too - the video
          mockup, stamp, and display type are enough. One layer max. */}
      <section className="mk-hero mk-section--layered">
        <div className="mk-wrap mk-hero-in">
          <div className="mk-hero-copy">
            <p className="stamp">Free for athletes · Built family-first</p>
            <div style={{ height: 18 }} />
            <h1 className="mk-hero-title display">
              A real training profile for your <span>young athlete</span>
            </h1>
            <p className="mk-hero-sub body">
              KoachMe is where kids log their training, build a stat sheet
              that says how each number was verified, and connect with real
              coaches. No email needed. Free for athletes.
            </p>
            <div className="mk-hero-ctas">
              <CtaLink href="/app?signup=1" cta="hero_get_started" className="mk-btn mk-btn--primary body">
                Get started free
              </CtaLink>
              <CtaLink href="/become-a-coach" cta="hero_im_a_coach" className="mk-btn mk-btn--ghost body">
                I&apos;m a coach
              </CtaLink>
            </div>
            <p className="mk-hero-note body">
              Takes about two minutes. Works on any phone, nothing to install.
            </p>
          </div>
          <div className="mk-hero-shot">
            <div className="mk-shot mk-shot--tilt">
              {HERO_DRILL ? (
                <HeroVideo
                  webmUrl={`${DRILL_BLOB_BASE}/drills/${HERO_DRILL.id}/hero.webm`}
                  mp4Url={HERO_DRILL.demo.blob}
                  posterUrl={HERO_DRILL.poster.blob}
                />
              ) : (
                <Image
                  src="/marketing/profile.png"
                  alt="A KoachMe athlete profile: sample athlete card with level bar, training streak, and stats each labeled SELF for self-reported"
                  width={390}
                  height={844}
                  priority
                  sizes="(min-width: 1024px) 360px, 82vw"
                />
              )}
            </div>
            <p className="mk-caption body">AI-generated drill demo, muted</p>
          </div>
        </div>
      </section>

      {/* ---------------- sports ticker ---------------- */}
      <div className="mk-ticker" aria-hidden="true">
        <div className="mk-ticker-track">
          {[0, 1, 2, 3].flatMap(rep =>
            TICKER_SPORTS.map(s => (
              <span key={`${rep}-${s}`} className="mk-ticker-item">{s}</span>
            )),
          )}
        </div>
      </div>

      {/* ---------------- problem ---------------- */}
      <section className="mk-section mk-section--lift mk-section--layered" aria-labelledby="problem-h">
        <FieldGeo sport="football" opacity={0.05} style={{ right: -160, top: -30 }} />
        <div className="mk-wrap">
          <p className="stamp">The problem</p>
          <h2 className="mk-h2 display" id="problem-h">
            Talent is everywhere. <span style={{ color: "#C5FF3D" }}>Proof is not.</span>
          </h2>
          <p className="mk-lead body">
            Families put real work into youth sports and get very little
            record of it. Three things keep going wrong.
          </p>
          <div className="mk-grid mk-grid--3">
            <div className="mk-card">
              <h3 className="display">Finding a coach is guesswork</h3>
              <p className="body">
                Most families find private coaches through word of mouth and
                hope. Credentials are hard to check and quality is hard to
                compare from the outside.
              </p>
            </div>
            <div className="mk-card">
              <h3 className="display">Showcases sell snapshots</h3>
              <p className="body">
                A single showcase event can cost hundreds of dollars, and it
                captures one day. One bad day at the plate should not be the
                whole story of an athlete.
              </p>
            </div>
            <div className="mk-card">
              <h3 className="display">Progress lives nowhere</h3>
              <p className="body">
                Workouts end up in notebooks, group chats, and memory. When a
                coach or a program asks what an athlete has been doing, there
                is no clean answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="mk-section" id="how-it-works" aria-labelledby="hiw-h">
        <div className="mk-wrap">
          <p className="stamp">How it works</p>
          <h2 className="mk-h2 display" id="hiw-h">
            For athletes
          </h2>
          <p className="mk-lead body">
            Three steps, and the first one takes about two minutes.
          </p>
          <div className="mk-steps">
            <div className="mk-step">
              <div className="mk-step-num mono">1</div>
              <h3 className="display">Create your card</h3>
              <p className="body">
                Name, sport, position, city. That is the whole form. No email
                and no password: your athlete gets a 3-word code that logs
                them in on any device.
              </p>
              <div className="mk-shot mk-halftone">
                <Image
                  src="/marketing/signup.png"
                  alt="The KoachMe signup form asking only for a first and last name"
                  width={390}
                  height={844}
                  sizes="(min-width: 641px) 330px, 88vw"
                />
              </div>
            </div>
            <div className="mk-step">
              <div className="mk-step-num mono">2</div>
              <h3 className="display">Train and log</h3>
              <p className="body">
                Log workouts in seconds and build streaks. The stat sheet
                grows with them, and self-reported numbers are labeled
                honestly until a coach verifies them.
              </p>
              <div className="mk-shot mk-halftone">
                <Image
                  src="/marketing/log-workout.png"
                  alt="Logging a workout in KoachMe: workout type, duration in minutes, and intensity from light to all-out"
                  width={390}
                  height={844}
                  sizes="(min-width: 641px) 330px, 88vw"
                />
              </div>
            </div>
            <div className="mk-step">
              <div className="mk-step-num mono">3</div>
              <h3 className="display">Connect with coaches</h3>
              <p className="body">
                Browse coaches as they join, watch labeled drill demos, and
                message a coach directly when your family is ready.
              </p>
              <div className="mk-shot mk-halftone">
                <Image
                  src="/marketing/drills.png"
                  alt="A KoachMe drill open in the app: Tee Work coach intro and slow demo videos, with the disclosure label saying the coach is AI-generated"
                  width={390}
                  height={844}
                  sizes="(min-width: 641px) 330px, 88vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- feature truth grid ---------------- */}
      <section className="mk-section mk-section--lift" aria-labelledby="features-h">
        <div className="mk-wrap">
          <p className="stamp">What&apos;s inside</p>
          <h2 className="mk-h2 display" id="features-h">
            Built honest, on purpose
          </h2>
          <p className="mk-lead body">
            Everything in KoachMe is labeled with what it really is. That is
            the product.
          </p>
          <div className="mk-grid mk-grid--2">
            <div className="mk-card">
              <span className="stamp stamp--flat">Workouts</span>
              <h3 className="display">Tracking and streaks</h3>
              <p className="body">
                Type, minutes, intensity, notes. Logging takes seconds, and
                streaks plus weekly counts keep kids coming back to the work.
              </p>
            </div>
            <div className="mk-card">
              <span className="stamp stamp--flat">Self / Trainer / Facility / Event</span>
              <h3 className="display">Verified stat levels</h3>
              <p className="body">
                Every stat carries a label saying how it was verified. Today
                most numbers are self-reported and say SELF right on the
                card. Real verification by trainers, facilities, and events
                is the backbone we are building toward.
              </p>
            </div>
            <div className="mk-card">
              <span className="stamp stamp--flat">AI Coach · labeled</span>
              <h3 className="display">Drill library</h3>
              <p className="body">
                Short drills with a coach intro and a slow demo to copy.
                Today&apos;s demos are AI-generated and carry an AI COACH
                label right on the card, because transparency is trust. Real
                verified coaches review drills as we grow.
              </p>
            </div>
            <div className="mk-card">
              <span className="stamp stamp--flat">Messaging</span>
              <h3 className="display">Talk to real coaches</h3>
              <p className="body">
                Athletes message coaches directly on the platform. There are
                no athlete-to-athlete DMs, and coaches join by application.
              </p>
            </div>
            <div className="mk-card">
              <span className="stamp stamp--flat">No email needed</span>
              <h3 className="display">The 3-word code</h3>
              <p className="body">
                Kids log in with three words like alex-tiger-moon. No email,
                no password, works across devices, and one less account tied
                to a child. Kid-safe by design.
              </p>
            </div>
            <div className="mk-card">
              <span className="stamp stamp--flat">For coaches</span>
              <h3 className="display">A real console</h3>
              <p className="body">
                Coaches get their own console: roster, athlete cards with
                honest stats, messages, and a public profile with their rate
                and training modes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- AI drill samples ---------------- */}
      <section className="mk-section mk-section--layered" aria-labelledby="drills-h">
        {/* Giant numeral: the REAL drill count (computed, never written). */}
        <span className="mk-numeral" aria-hidden="true" style={{ right: -20, top: -30 }}>{DRILLS.length}</span>
        <div className="mk-wrap">
          <p className="stamp">Drill library</p>
          <h2 className="mk-h2 display" id="drills-h">
            Try our AI drill library free for a month
          </h2>
          <p className="mk-lead body">
            Short coach clips your athlete can copy today: a spoken intro,
            then a slow demo rep. The first month is free, then the drill
            library is $9 a month. Everything else in KoachMe stays free.
          </p>
          <div className="mk-drills">
            {SAMPLE_DRILLS.map(d => (
              <DrillSample
                key={d.id}
                id={d.id}
                title={d.title}
                sport={d.sport}
                posterUrl={d.poster.blob}
                videoUrl={d.demo.blob}
                coachName={coachFor(d).name}
              />
            ))}
          </div>
          {/* Load-bearing transparency line: the AI content is a proof
              point, not fine print. Keep it visible without interaction. */}
          <p className="mk-drill-disclosure body">
            {/* Clay = trust moment: the disclosure is a verification stamp. */}
            <span className="stamp stamp--clay">AI demo</span>
            These drills are AI-generated demonstrations, clearly labeled in
            the app. Real coaches are real people - always.
          </p>
          <div className="mk-drills-cta">
            <CtaLink href="/app" cta="drills_browse_all" className="mk-btn mk-btn--primary body">
              Browse all {DRILLS.length} drills, first month free
            </CtaLink>
          </div>
        </div>
      </section>

      {/* ---------------- honest traction ---------------- */}
      <section className="mk-section mk-section--layered" aria-labelledby="today-h">
        <FieldGeo sport="track" opacity={0.05} style={{ left: -180, bottom: -20 }} />
        <div className="mk-wrap">
          <p className="stamp">Where we are today</p>
          <h2 className="mk-h2 display" id="today-h">
            Young product. Real rules.
          </h2>
          <p className="mk-lead body">
            KoachMe is early, and we would rather tell you that plainly than
            dress it up. Here is what is true right now.
          </p>
          <div className="mk-truth body">
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Free for athletes</strong>
                <p>
                  Profile, workout logging, stats, feed, messaging, and
                  session booking cost nothing. The AI drill library is
                  free for the first month, then $9 a month.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Coaches keep 90%</strong>
                <p>
                  Coaches set their own rates. When paid bookings launch,
                  coaches keep 90% of what they charge.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Zero fake anything</strong>
                <p>
                  No invented coaches, no padded numbers, no fabricated
                  reviews anywhere in the product or on this page. If a stat
                  is on KoachMe, someone really did the work.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Built family-first</strong>
                <p>
                  Made by a family in Miami. No ads, no data selling, no
                  email required from kids, and AI content is always labeled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- coaches strip ---------------- */}
      <section className="mk-section mk-section--lift mk-section--layered" id="coaches" aria-labelledby="coach-h">
        {/* Giant numeral: the real 90% coach take. */}
        <span className="mk-numeral" aria-hidden="true" style={{ right: -40, bottom: -60 }}>90</span>
        <div className="mk-wrap">
          <p className="stamp">For coaches</p>
          <h2 className="mk-h2 display" id="coach-h">
            Coach on your terms
          </h2>
          <p className="mk-lead body">
            Apply in about five minutes: sport, specialty, rate, and how you
            train, in person, live online, or async video review. Athletes in
            your sport can find and message you, and you keep 90% of your
            rate.
          </p>
          <div className="mk-hero-ctas" style={{ justifyContent: "flex-start" }}>
            <CtaLink href="/become-a-coach" cta="coach_strip_apply" className="mk-btn mk-btn--primary body">
              Apply as a coach
            </CtaLink>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mk-section mk-section--layered" id="faq" aria-labelledby="faq-h">
        <FieldGeo sport="baseball" opacity={0.04} style={{ right: -150, top: 60 }} />
        <div className="mk-wrap">
          <p className="stamp">FAQ</p>
          <h2 className="mk-h2 display" id="faq-h">
            Questions parents actually ask
          </h2>
          <FaqList />
        </div>
      </section>

      {/* ---------------- final CTA ---------------- */}
      <section className="mk-final">
        <div className="mk-wrap">
          <h2 className="mk-h2 display">
            Start the profile.<br />
            <span className="display-speed" style={{ color: "#C5FF3D" }}>Let the work talk.</span>
          </h2>
          <div className="mk-hero-ctas" style={{ marginTop: 24 }}>
            <CtaLink href="/app?signup=1" cta="final_get_started" className="mk-btn mk-btn--primary body">
              Get started free
            </CtaLink>
            <CtaLink href="/become-a-coach" cta="final_im_a_coach" className="mk-btn mk-btn--ghost body">
              I&apos;m a coach
            </CtaLink>
          </div>
        </div>
      </section>
    </main>
  );
}
