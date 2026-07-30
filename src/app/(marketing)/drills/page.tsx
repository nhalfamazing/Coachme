import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { DRILLS, SPORT_META } from "@/lib/drills";
import {
  drillPath, drillsInSport, libraryTldr, libraryTotals,
  sportPath, sportsWithDrills,
} from "@/lib/drill-seo";
import { BreadcrumbJsonLd, DrillListJsonLd } from "@/components/marketing/drill-json-ld";
import { openGraph, twitter } from "@/lib/og";

/* The library index. Every sport, every count, computed from the data. */

export const dynamic = "force-static";

const totals = libraryTotals();

export const metadata: Metadata = {
  title: `Free sports drills for young athletes`,
  description:
    `${totals.drills} free drills across ${totals.sports} sports, each with numbered steps, `
    + `common mistakes and an AI-generated demo video. No signup needed.`,
  alternates: { canonical: "/drills" },
  openGraph: openGraph({
    title: "The KoachMe drill library",
    description: `${totals.drills} free drills across ${totals.sports} sports, with steps and AI-generated demos.`,
    path: "/drills",
  }),
  twitter: twitter({
    title: "The KoachMe drill library",
    description: `${totals.drills} free drills across ${totals.sports} sports, with steps and AI-generated demos.`,
    path: "/drills",
  }),
};

export default function DrillLibraryPage() {
  const sports = sportsWithDrills();
  // Newest first, so the index shows the library growing.
  const newest = [...DRILLS].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, 6);

  return (
    <main className="mk-wrap mk-hub">
      <DrillListJsonLd
        name="The KoachMe drill library"
        description={`${totals.drills} free drills across ${totals.sports} sports.`}
        path="/drills"
        drills={DRILLS}
      />
      <BreadcrumbJsonLd trail={[{ name: "Drills", path: "/drills" }]} />

      <nav className="mk-crumbs mono" aria-label="Breadcrumb">
        <span aria-current="page">Drills</span>
      </nav>

      <h1 className="display mk-hub-h1">Free sports drills for young athletes</h1>

      <section className="mk-tldr" aria-labelledby="tldr-heading">
        <span className="stamp stamp--flat" id="tldr-heading">In short</span>
        <p className="body">{libraryTldr()}</p>
      </section>

      <section aria-labelledby="sports-heading">
        <h2 className="display mk-drillpage-sec-h" id="sports-heading">
          {totals.sports} sports
        </h2>
        <ul className="mk-sports">
          {sports.map(s => {
            const count = drillsInSport(s).length;
            return (
              <li key={s}>
                <Link href={sportPath(s)} className="mk-sport-card">
                  <span className="mk-sport-icon" aria-hidden="true">{SPORT_META[s]?.icon ?? ""}</span>
                  <span className="display mk-sport-name">{s}</span>
                  <span className="mono mk-sport-count">
                    {count} {count === 1 ? "drill" : "drills"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="newest-heading">
        <h2 className="display mk-drillpage-sec-h" id="newest-heading">Newest drills</h2>
        <ul className="mk-hub-grid">
          {newest.map(d => (
            <li key={d.id}>
              <Link href={drillPath(d)} className="mk-hub-card">
                <Image
                  src={d.poster.blob} alt="" width={480} height={240}
                  className="mk-hub-img" sizes="(min-width: 720px) 300px, 90vw"
                />
                <span className="display mk-hub-title">{d.title}</span>
                <span className="mono mk-hub-meta">{d.sport} · {d.focus}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mk-drillpage-cta" aria-labelledby="cta-heading">
        <h2 className="display" id="cta-heading">
          {totals.drills} drills, {totals.steps} steps, nothing behind a signup
        </h2>
        <p className="body">
          Read every drill here for free. Inside the app your athlete also
          gets a training log, a stat sheet that shows how each number was
          verified, and the whole library — free for the first month, and
          nobody is charged while subscriptions are still to launch. No email
          needed to start.
        </p>
        <div className="mk-drillpage-cta-row">
          <Link href="/app?signup=1" className="mk-btn mk-btn--primary body">
            Start training free
          </Link>
          <Link href="/about" className="mk-btn mk-btn--ghost body">
            What is KoachMe?
          </Link>
        </div>
      </section>

      <p className="mk-drillpage-report body">
        Every demonstration video on these pages is AI-generated and labeled
        as such. <Link href="/contact">Something look wrong?</Link>
      </p>
    </main>
  );
}
