import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DRILLS } from "@/lib/drills";
import {
  drillPath, drillsInSport, findSport, libraryTotals, sportDescription,
  sportPath, sportSlug, sportTitle, sportTldr, sportsWithDrills,
} from "@/lib/drill-seo";
import { BreadcrumbJsonLd, DrillListJsonLd } from "@/components/marketing/drill-json-ld";

/* One sport's drill library. Server-rendered, every count read from the
   data — there is no number on this page that a human typed. */

export const dynamic = "force-static";

export function generateStaticParams() {
  return sportsWithDrills().map(s => ({ sport: sportSlug(s) }));
}

type Params = Promise<{ sport: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sport: param } = await params;
  const sport = findSport(param);
  if (!sport) return { title: "Sport not found", robots: { index: false, follow: false } };
  return {
    title: sportTitle(sport),
    description: sportDescription(sport),
    alternates: { canonical: sportPath(sport) },
    openGraph: {
      title: `${sport} drills for young athletes`,
      description: sportDescription(sport),
      url: sportPath(sport),
    },
  };
}

export default async function SportHubPage({ params }: { params: Params }) {
  const { sport: param } = await params;
  const sport = findSport(param);
  if (!sport) notFound();

  const drills = drillsInSport(sport);
  const totals = libraryTotals(drills);

  return (
    <main className="mk-wrap mk-hub">
      <DrillListJsonLd
        name={`${sport} drills`}
        description={sportDescription(sport)}
        path={sportPath(sport)}
        drills={drills}
      />
      <BreadcrumbJsonLd trail={[{ name: "Drills", path: "/drills" }, { name: sport, path: sportPath(sport) }]} />

      <nav className="mk-crumbs mono" aria-label="Breadcrumb">
        <Link href="/drills">Drills</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{sport}</span>
      </nav>

      <h1 className="display mk-hub-h1">{sport} drills for young athletes</h1>

      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{sportTldr(sport)}</p>
      </section>

      <section aria-labelledby="list-heading">
        <h2 className="display mk-drillpage-sec-h" id="list-heading">
          {totals.drills} {sport.toLowerCase()} {totals.drills === 1 ? "drill" : "drills"}
        </h2>
        <ul className="mk-hub-grid">
          {drills.map(d => (
            <li key={d.id}>
              <Link href={drillPath(d)} className="mk-hub-card">
                <Image
                  src={d.poster.blob} alt="" width={480} height={240}
                  className="mk-hub-img" sizes="(min-width: 720px) 300px, 90vw"
                />
                <span className="display mk-hub-title">{d.title}</span>
                <span className="mono mk-hub-meta">
                  {d.focus} · {d.steps?.length ?? 0} steps
                </span>
                {d.summary ? <span className="body mk-hub-summary">{d.summary}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mk-drillpage-cta" aria-labelledby="cta-heading">
        <h2 className="display" id="cta-heading">Train {sport.toLowerCase()} between practices</h2>
        <p className="body">
          Every drill here is free to read and watch. Inside the app your
          athlete also gets a training log, a stat sheet that shows how each
          number was verified, and the whole library — free for the first
          month, and nobody is charged while subscriptions are still to
          launch. No email needed to start.
        </p>
        <div className="mk-drillpage-cta-row">
          <Link href={`/app?signup=1&sport=${sportSlug(sport)}`} className="mk-btn mk-btn--primary body">
            Start training free
          </Link>
          <Link href="/drills" className="mk-btn mk-btn--ghost body">
            All {DRILLS.length} drills
          </Link>
        </div>
      </section>
    </main>
  );
}
