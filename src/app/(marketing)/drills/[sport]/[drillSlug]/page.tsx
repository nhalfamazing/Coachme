import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DRILLS, coachFor } from "@/lib/drills";
import {
  drillDescription, drillHeading, drillPath, drillTitle, drillTldr,
  drillsInSport, findDrill, humanList, relatedForPublic, sportPath, sportSlug,
} from "@/lib/drill-seo";
import { DrillJsonLd, aiVideoDisclosure } from "@/components/marketing/drill-json-ld";

/* The PUBLIC twin of the in-app drill detail view.
 *
 * Same content model (data/drills-manifest.json via src/lib/drills.ts),
 * different shell: no app chrome, no sign-in, no Pro gate. Everything a
 * crawler or an AI assistant needs is in the server-rendered HTML — there is
 * no client component on this page and no data fetched after load, because
 * anything that only appears after hydration is not reliably indexable.
 *
 * A field that is null renders NO section. That rule is the whole reason the
 * page can be trusted: it never fills a gap with a plausible sentence about
 * sports technique.
 *
 * The video uses preload="none" with a poster, which means zero JavaScript,
 * zero bytes of mp4 before somebody presses play, and a stable box that
 * cannot shift the layout.
 */

export const dynamic = "force-static";

/** Every drill page is known at build time. */
export function generateStaticParams() {
  return DRILLS.map(d => ({ sport: sportSlug(d.sport), drillSlug: d.id }));
}

type Params = Promise<{ sport: string; drillSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sport, drillSlug } = await params;
  const drill = findDrill(sport, drillSlug);
  if (!drill) return { title: "Drill not found", robots: { index: false, follow: false } };
  const path = drillPath(drill);
  return {
    title: drillTitle(drill),
    description: drillDescription(drill),
    alternates: { canonical: path },
    openGraph: {
      type: "video.other",
      title: drillHeading(drill),
      description: drillDescription(drill),
      url: path,
      images: [{ url: drill.poster.blob, width: 1200, height: 630, alt: `${drill.title} drill demonstration` }],
    },
  };
}

export default async function DrillPage({ params }: { params: Params }) {
  const { sport, drillSlug } = await params;
  const drill = findDrill(sport, drillSlug);
  if (!drill) notFound();

  const coach = coachFor(drill);
  const related = relatedForPublic(drill, 3);
  const sportCount = drillsInSport(drill.sport).length;
  const tldr = drillTldr(drill);
  // Poster through the image optimizer: the <video poster> attribute takes a
  // URL, so the next/image component cannot be used here.
  const poster = `/_next/image?url=${encodeURIComponent(drill.poster.blob)}&w=1200&q=75`;

  return (
    <main className="mk-wrap mk-drillpage">
      <DrillJsonLd drill={drill} coach={coach} />

      <nav className="mk-crumbs mono" aria-label="Breadcrumb">
        <Link href="/drills">Drills</Link>
        <span aria-hidden="true">/</span>
        <Link href={sportPath(drill.sport)}>{drill.sport}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{drill.title}</span>
      </nav>

      <h1 className="display mk-drillpage-h1">{drillHeading(drill)}</h1>

      {/* Answer-first: the paragraph an assistant can lift and still be
          right. Assembled from manifest fields, never written freehand. */}
      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{tldr}</p>
      </section>

      <section className="mk-drillpage-video" aria-label={`${drill.title} demonstration`}>
        {/* preload="none": the poster shows, the mp4 is not fetched until
            somebody presses play. No autoplay, no signup, no paywall. */}
        <video
          className="mk-video"
          poster={poster}
          preload="none"
          controls
          playsInline
          width={1280}
          height={720}
        >
          <source src={drill.demo.blob} type="video/mp4" />
          Your browser cannot play this video.
        </video>

        {/* Visible without any interaction, right beside the video. */}
        <p className="mk-ai-note body">
          <span className="stamp stamp--clay">AI demo</span>
          <span>{aiVideoDisclosure(coach.name)} Real verified coaches review every drill before launch.</span>
        </p>
      </section>

      {drill.builds?.length ? (
        <section className="mk-drillpage-sec" aria-labelledby="builds-heading">
          <h2 className="display" id="builds-heading">What this builds</h2>
          <ul className="mk-chips" aria-label="Skills this drill develops">
            {drill.builds.map(b => (
              <li key={b} className="stamp stamp--lime stamp--flat">{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mk-drillpage-sec" aria-labelledby="facts-heading">
        <h2 className="display" id="facts-heading">Quick facts</h2>
        <dl className="mk-facts">
          <div>
            <dt className="wide">Sport</dt>
            <dd className="mono">{drill.sport}</dd>
          </div>
          <div>
            <dt className="wide">Level</dt>
            <dd className="mono">{drill.level}</dd>
          </div>
          {drill.equipment?.length ? (
            <div>
              <dt className="wide">Equipment</dt>
              <dd className="mono">
                {drill.equipment.length === 1 && drill.equipment[0].toLowerCase() === "none"
                  ? "None"
                  : humanList(drill.equipment)}
              </dd>
            </div>
          ) : null}
          {drill.space ? (
            <div>
              <dt className="wide">Space needed</dt>
              <dd className="mono">{drill.space}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* The primary indexable content: real text, server-rendered, not
          behind a tab or an accordion. */}
      {drill.steps?.length ? (
        <section className="mk-drillpage-sec" aria-labelledby="howto-heading">
          <h2 className="display" id="howto-heading">How to do it</h2>
          <ol className="mk-howto">
            {drill.steps.map(s => (
              <li key={s.n} id={`step-${s.n}`} className="mk-howto-item">
                <span className="mono mk-howto-n" aria-hidden="true">{String(s.n).padStart(2, "0")}</span>
                <div>
                  <h3 className="display mk-howto-title">{s.title}</h3>
                  <p className="body mk-howto-detail">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {drill.mistakes?.length ? (
        <section className="mk-drillpage-sec" aria-labelledby="mistakes-heading">
          <h2 className="display" id="mistakes-heading">Common mistakes</h2>
          <ul className="mk-mistakes">
            {drill.mistakes.map(m => (
              <li key={m.mistake} className="mk-mistake">
                <div className="mk-mistake-side">
                  <span className="wide mk-mistake-label">Mistake</span>
                  <p className="body">{m.mistake}</p>
                </div>
                {/* The fix carries the weight — it is the half that helps. */}
                <div className="mk-mistake-side mk-mistake-side--fix">
                  <span className="wide mk-mistake-label mk-mistake-label--fix">Fix</span>
                  <p className="body">{m.fix}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mk-drillpage-sec" aria-labelledby="coach-heading">
        <h2 className="display" id="coach-heading">Who demonstrates this</h2>
        <div className="mk-coach">
          <Image
            src={coach.portrait.blob}
            alt={`${coach.name}, an AI-generated coach character`}
            width={64} height={64} className="mk-coach-img"
          />
          <div>
            <p className="display mk-coach-name">
              {coach.name} <span className="stamp stamp--clay">AI coach</span>
            </p>
            <p className="body mk-coach-style">{coach.style}</p>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="mk-drillpage-sec" aria-labelledby="related-heading">
          <h2 className="display" id="related-heading">Related drills</h2>
          <ul className="mk-related">
            {related.map(r => (
              <li key={r.id}>
                <Link href={drillPath(r)} className="mk-related-card">
                  <Image
                    src={r.poster.blob} alt="" width={480} height={240}
                    className="mk-related-img" sizes="(min-width: 720px) 300px, 90vw"
                  />
                  <span className="display mk-related-title">{r.title}</span>
                  <span className="mono mk-related-meta">{r.sport} · {r.focus}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Written for a stranger who arrived from a search for this one
          drill and has never heard of us. The number is real. */}
      <section className="mk-drillpage-cta" aria-labelledby="cta-heading">
        <h2 className="display" id="cta-heading">
          There {sportCount === 1 ? "is" : "are"} {sportCount} {drill.sport.toLowerCase()}{" "}
          {sportCount === 1 ? "drill" : "drills"} like this one
        </h2>
        <p className="body">
          Free while we are in beta. Your athlete gets the full drill library,
          a training log that tracks what they actually did, and a stat sheet
          that shows how it was verified. No email needed to start.
        </p>
        <div className="mk-drillpage-cta-row">
          <Link href={`/app?signup=1&sport=${sportSlug(drill.sport)}`} className="mk-btn mk-btn--primary body">
            Start training free
          </Link>
          <Link href={sportPath(drill.sport)} className="mk-btn mk-btn--ghost body">
            All {drill.sport.toLowerCase()} drills
          </Link>
        </div>
      </section>

      {/* Quiet, and deliberately a link rather than a form: an
          unauthenticated report endpoint on a public page is a spam vector. */}
      <p className="mk-drillpage-report body">
        <Link href="/contact">Something look wrong with this drill?</Link>
      </p>
    </main>
  );
}
