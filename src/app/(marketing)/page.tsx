import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReturningUserBanner } from "@/components/marketing/returning-user";
import { FaqList } from "@/components/marketing/faq";
import { LandingJsonLd } from "@/components/marketing/json-ld";
import { CtaLink } from "@/components/marketing/cta-link";
import { DrillSample } from "@/components/marketing/drill-sample";
import { ProgressProof } from "@/components/marketing/progress-proof";
import { SectionViews } from "@/components/marketing/section-views";
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

// Second row, for parents of daughters. Picked by exact id and NOT via
// sampleDrill: "features a girl athlete" is a property of the specific
// clip, not of the sport, so there is no safe fallback. If one of these
// ever leaves the manifest the card drops out rather than silently
// substituting a clip nobody has looked at. Each was reviewed frame by
// frame before being listed here.
//   tr-bounding      Koach Zuri    track
//   vb-forearm-pass  Koach Sol     volleyball
//   so-juggling      Koach Nia     soccer
//   sb-windmill      Koach Marisol softball
// Flag football is NOT here: the library has no flag-football drill.
// The two Football drills are tackle drills (three-point stance) demoed
// by Koach Farm, so neither fits this row. Add a flag-football clip to
// the manifest and it can join by id.
const GIRLS_DRILL_IDS = ["tr-bounding", "vb-forearm-pass", "so-juggling", "sb-windmill"];
const GIRLS_DRILLS = GIRLS_DRILL_IDS
  .map(id => DRILLS.find(d => d.id === id) ?? null)
  .filter((d): d is Drill => d !== null);

// Real sport count, derived from the manifest - never hand-written.
const SPORT_COUNT = new Set(DRILLS.map(d => d.sport)).size;

export const metadata: Metadata = {
  // Root layout template appends "- KoachMe"; no brand prefix here or
  // the tab reads "KoachMe - ... - KoachMe".
  title: "Training between practices for young athletes",
  description:
    "The kids who start are the kids who train between practices. KoachMe gives your athlete pro-style drills at home, a stat sheet that proves the work, and vetted coaches when you're ready. Free for athletes, no email needed.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KoachMe - Training between practices for young athletes",
    description:
      "Pro-style drills at home, a stat sheet that proves the work, and vetted coaches when you're ready. Free for athletes, no email needed.",
    url: "/",
  },
};

// INTEGRITY RULE for this page: zero fabricated data. No invented
// testimonials, user counts, ratings, coach names, or press mentions.
// Screenshots are real product views with a clearly sample profile.

// Founder note: we have no testimonials and will not invent them. What
// we do have is a dad and his 8-year-old building this in Miami - but
// the story is Rasheid's to tell, not ours to write. The section stays
// hidden until he replaces null with his own 2-3 sentences.
const FOUNDER_NOTE: string | null = null; // [FOUNDER_NOTE]

export default function LandingPage() {
  return (
    <main className="mk-grain">
      <LandingJsonLd />
      {/* "founder" is in the list but hidden behind FOUNDER_NOTE; the
          observer skips ids that are not in the DOM. */}
      <SectionViews ids={["hero", "progress", "drills", "receipts", "coaches", "safety", "founder", "faq", "closing"]} />
      <ReturningUserBanner />

      {/* ---------------- hero: the gap ---------------- */}
      {/* Restraint pass cut: the hero had field geometry too - the video
          mockup, stamp, and display type are enough. One layer max. */}
      <section className="mk-hero mk-section--layered" id="hero">
        <div className="mk-wrap mk-hero-in">
          <div className="mk-hero-copy">
            <p className="stamp">Free for athletes · Built family-first</p>
            <div style={{ height: 18 }} />
            <h1 className="mk-hero-title display">
              Starting spots are earned <span>between practices</span>
            </h1>
            <p className="mk-hero-sub body">
              KoachMe gives your athlete a plan for the hours that separate
              players: pro-style drills at home, a stat sheet that proves
              the work, and real vetted coaches when you&apos;re ready.
            </p>
            <div className="mk-hero-ctas">
              <CtaLink href="/app?signup=1" cta="hero_start_free" className="mk-btn mk-btn--primary body">
                Start free - no email needed
              </CtaLink>
              <CtaLink href="#progress" cta="hero_see_how" className="mk-btn mk-btn--ghost body">
                See how it works
              </CtaLink>
            </div>
            <p className="mk-hero-note body">
              Works on any phone, nothing to install. About a minute to start.
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

      {/* ---------------- progress proof ---------------- */}
      <section className="mk-section mk-section--lift mk-section--layered" id="progress" aria-labelledby="progress-h">
        <FieldGeo sport="basketball" opacity={0.05} style={{ right: -160, top: -30 }} />
        <div className="mk-wrap">
          <p className="stamp">Seeing it work</p>
          <h2 className="mk-h2 display" id="progress-h">
            Progress <span style={{ color: "#C5FF3D" }}>you can see</span>
          </h2>
          <p className="mk-lead body">
            Your athlete logs training, their numbers move, and you both
            watch it happen. Streaks and XP keep them coming back on the
            days motivation doesn&apos;t.
          </p>
          <ProgressProof />
        </div>
      </section>

      {/* ---------------- train tonight: drills ---------------- */}
      <section className="mk-section mk-section--layered" id="drills" aria-labelledby="drills-h">
        {/* Giant numeral: the REAL drill count (computed, never written). */}
        <span className="mk-numeral" aria-hidden="true" style={{ right: -20, top: -30 }}>{DRILLS.length}</span>
        <div className="mk-wrap">
          <p className="stamp">Train tonight</p>
          <h2 className="mk-h2 display" id="drills-h">
            Structure for the living room, <span style={{ color: "#C5FF3D" }}>the driveway, the backyard</span>
          </h2>
          <p className="mk-lead body">
            {DRILLS.length} drills across {SPORT_COUNT} sports, taught step
            by step: a spoken intro, then a slow demo rep your athlete can
            copy tonight. First month free, then $9 a month. Everything
            else in KoachMe stays free.
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

          {/* Second row: the same structure in the sports a lot of girls
              play. Sits above the AI disclosure on purpose so the one
              disclosure covers both rows. */}
          {GIRLS_DRILLS.length > 0 && (
            <>
              <div className="mk-drills-subhead">
                <p className="stamp">For your daughter</p>
                <p className="mk-drills-subline body">
                  Track, volleyball, soccer and softball, taught the same
                  way: every rep in this row is demoed by one of the
                  library&apos;s women AI coaches.
                </p>
              </div>
              <div className="mk-drills mk-drills--quad">
                {GIRLS_DRILLS.map(d => (
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
            </>
          )}

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

      {/* ---------------- receipts: the verified stat sheet ---------------- */}
      <section className="mk-section mk-section--lift mk-section--layered" id="receipts" aria-labelledby="receipts-h">
        <div className="mk-wrap">
          <p className="stamp">The receipts</p>
          <h2 className="mk-h2 display" id="receipts-h">
            Every kid at tryouts says they&apos;re fast.{" "}
            <span style={{ color: "#C5FF3D" }}>Yours will have proof.</span>
          </h2>
          <p className="mk-lead body">
            Every stat on a KoachMe card carries a label that says how it
            was verified. No number pretends to be more than it is - and
            that is exactly why the verified ones mean something.
          </p>
          <div className="mk-receipts">
            <div className="mk-ladder body">
              <div className="mk-ladder-step">
                <span className="stamp stamp--flat">Self</span>
                <p>
                  Your athlete logged it themselves. It says so, honestly,
                  right on the card.
                </p>
              </div>
              <div className="mk-ladder-step">
                <span className="stamp stamp--flat stamp--clay">Trainer</span>
                <p>A coach watched it happen and signed off.</p>
              </div>
              <div className="mk-ladder-step">
                <span className="stamp stamp--flat stamp--clay">Facility</span>
                <p>A training facility measured it with their own equipment.</p>
              </div>
              <div className="mk-ladder-step">
                <span className="stamp stamp--flat stamp--clay">Event</span>
                <p>Recorded at an organized event, on the record.</p>
              </div>
              <p className="mk-ladder-note">
                Today most stats say SELF, and say it plainly. Climbing the
                ladder is what KoachMe is building - verification by real
                trainers, facilities, and events.
              </p>
            </div>
            <div className="mk-shot mk-halftone mk-receipts-shot">
              <Image
                src="/marketing/profile.png"
                alt="A KoachMe athlete profile: sample athlete card with level bar, training streak, and stats each labeled SELF for self-reported"
                width={390}
                height={844}
                sizes="(min-width: 641px) 330px, 88vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- when you're ready: real coaches ---------------- */}
      <section className="mk-section mk-section--layered" id="coaches" aria-labelledby="coach-h">
        {/* Giant numeral: the real 90% coach take. */}
        <span className="mk-numeral" aria-hidden="true" style={{ right: -40, bottom: -60 }}>90</span>
        <div className="mk-wrap">
          <p className="stamp">When you&apos;re ready</p>
          <h2 className="mk-h2 display" id="coach-h">
            Vetted coaches, <span style={{ color: "#C5FF3D" }}>on your terms</span>
          </h2>
          <p className="mk-lead body">
            The training log and the stat sheet cost nothing, forever.
            When your family wants a real coach in the picture, here is
            how that works.
          </p>
          <div className="mk-grid mk-grid--3">
            <div className="mk-card">
              <h3 className="display">Vetted before they&apos;re listed</h3>
              <p className="body">
                Every coach applies with their real identity, credentials,
                and rate. Nobody is listed without applying and being
                reviewed, and only verified coaches can be booked.
              </p>
            </div>
            <div className="mk-card">
              <h3 className="display">You see how we checked</h3>
              <p className="body">
                Each profile shows the coach&apos;s credentials and its real
                verification state - including pending, while review is
                still underway. We would rather show a pending badge than
                pretend a review happened.
              </p>
            </div>
            <div className="mk-card">
              <h3 className="display">10%, not 40%</h3>
              <p className="body">
                Coaches set their own rates and keep 90%. KoachMe&apos;s
                platform fee is 10%, where coaching marketplaces commonly
                take around 40%. Fair pay is how you keep good coaches.
              </p>
            </div>
          </div>
          <div className="mk-hero-ctas" style={{ justifyContent: "flex-start", marginTop: 28 }}>
            <CtaLink href="/app" cta="coaches_browse" className="mk-btn mk-btn--primary body">
              Browse coaches
            </CtaLink>
            <CtaLink href="/become-a-coach" cta="coaches_apply" className="mk-btn mk-btn--ghost body">
              Apply as a coach
            </CtaLink>
          </div>
        </div>
      </section>

      {/* ---------------- family-first safety ---------------- */}
      <section className="mk-section mk-section--lift mk-section--layered" id="safety" aria-labelledby="safety-h">
        <FieldGeo sport="soccer" opacity={0.04} style={{ left: -170, top: 20 }} />
        <div className="mk-wrap">
          <p className="stamp">Family-first</p>
          <h2 className="mk-h2 display" id="safety-h">
            Built like a parent was in the room.{" "}
            <span style={{ color: "#C5FF3D" }}>Because one was.</span>
          </h2>
          <p className="mk-lead body">
            Safety on KoachMe is not a settings page you have to find. It
            is how the platform works by default.
          </p>
          <div className="mk-truth body">
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Messages are monitored</strong>
                <p>
                  Every message runs through safety filters before it sends.
                  Sharing phone numbers, addresses, or off-platform contact
                  is blocked automatically, and athletes can only message
                  coaches - there are no athlete-to-athlete DMs.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Sessions keep parents in the loop</strong>
                <p>
                  Booking a session prompts your athlete to tell a parent or
                  guardian the plan, and in-person sessions carry
                  public-training-location guidance built in.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>Report and block, everywhere</strong>
                <p>
                  Every conversation and coach profile carries report and
                  block controls, and reports land in our review queue.
                </p>
              </div>
            </div>
            <div className="mk-truth-item">
              <span className="mk-tick" aria-hidden="true">✓</span>
              <div>
                <strong>AI is always labeled</strong>
                <p>
                  AI-generated content carries an AI label wherever it
                  appears, and kids log in with a 3-word code instead of an
                  email. No ads, no data selling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- founder note (hidden until written) ---------------- */}
      {FOUNDER_NOTE && (
        <section className="mk-section mk-section--layered" id="founder" aria-labelledby="founder-h">
          <div className="mk-wrap">
            <p className="stamp">From the founder</p>
            <h2 className="mk-h2 display" id="founder-h">
              Built by a dad and his 8-year-old
            </h2>
            <p className="mk-lead body">{FOUNDER_NOTE}</p>
          </div>
        </section>
      )}

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

      {/* ---------------- closing CTA ---------------- */}
      <section className="mk-final" id="closing">
        <div className="mk-wrap">
          <h2 className="mk-h2 display">
            The next practice<br />
            <span className="display-speed" style={{ color: "#C5FF3D" }}>is tonight.</span>
          </h2>
          <p className="mk-lead body" style={{ margin: "0 auto 8px" }}>
            Free for athletes, 60 seconds to start, no email needed.
          </p>
          {/* Desktop override on mk-hero-ctas is flex-start; the single
              closing button should sit centered under the centered H2. */}
          <div className="mk-hero-ctas" style={{ marginTop: 24, justifyContent: "center" }}>
            <CtaLink href="/app?signup=1" cta="closing_start_free" className="mk-btn mk-btn--primary body">
              Start free - no email needed
            </CtaLink>
          </div>
        </div>
      </section>
    </main>
  );
}
