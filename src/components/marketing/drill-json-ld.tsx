/* Structured data for the public drill pages.
 *
 * INTEGRITY RULES, which matter more here than anywhere else on the site
 * because structured data is read by machines that cannot sanity-check it:
 *
 *   - Nothing is estimated. `duration` is emitted only for clips ffprobe has
 *     actually measured (see scripts/mirror-drills.mjs); a drill with no
 *     measurement emits no duration at all. We still have no dedicated
 *     player URL, so still no `embedUrl`. A wrong value would be worse than
 *     an absent one: Google penalises structured data that contradicts the
 *     page, and an AI assistant would repeat the number as fact.
 *   - uploadDate is the real addedAt from the manifest.
 *   - The AI disclosure is IN the VideoObject description, not only in the
 *     visible copy. If that costs a rich result, we take the hit — a parent
 *     seeing a video snippet should not have to click through to find out a
 *     machine made it.
 *   - HowTo is emitted ONLY when the drill actually has steps.
 */

import type { Drill, DrillCoach } from "@/lib/drills";
import { SITE_URL } from "@/lib/site";
import { hasHowTo } from "@/lib/drill-content";
import { secondsToIso8601 } from "@/lib/duration";
import { collectionDates, drillDates } from "@/lib/content-dates";
import { drillHeading, drillPath, sportPath } from "@/lib/drill-seo";

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const abs = (path: string) => `${SITE_URL}${path}`;

/** The AI disclosure, in the words that go to machines. */
export function aiVideoDisclosure(coachName: string): string {
  return `This demonstration video is AI-generated: ${coachName} is an AI character, not a real coach.`;
}

export function DrillJsonLd({ drill, coach }: { drill: Drill; coach: DrillCoach }) {
  const url = abs(drillPath(drill));
  const duration = secondsToIso8601(drill.durationSeconds);
  const dates = drillDates(drill);

  const description = [
    drill.summary ?? `${drill.title} is a ${drill.sport.toLowerCase()} drill.`,
    aiVideoDisclosure(coach.name),
  ].join(" ");

  const video: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: drillHeading(drill),
    description,
    thumbnailUrl: [drill.poster.blob],
    // All three are the real date the drill entered the library, never a
    // build timestamp, and they match the visible "Updated" line on the
    // page. modified equals published because we do not track edits after
    // a drill lands — saying otherwise would claim a change we cannot
    // evidence.
    uploadDate: drill.addedAt,
    datePublished: dates.published,
    dateModified: dates.modified,
    contentUrl: drill.demo.blob,
    url,
    isFamilyFriendly: true,
    inLanguage: "en",
    // Only when ffprobe actually measured this clip. Spread rather than set
    // to undefined: JSON.stringify would drop an undefined value anyway, but
    // an explicit omission is the behaviour we want to be able to read.
    ...(duration ? { duration } : {}),
    // No `embedUrl`: there is no standalone player page to point at.
    publisher: {
      "@type": "Organization",
      name: "KoachMe",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: abs("/brand/mark.png") },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Drills", item: abs("/drills") },
      { "@type": "ListItem", position: 2, name: drill.sport, item: abs(sportPath(drill.sport)) },
      { "@type": "ListItem", position: 3, name: drill.title, item: url },
    ],
  };

  // Only when there are real steps to describe. Same predicate the in-app
  // view uses to decide whether a HOW TO tab exists at all, so the schema
  // and the page can never disagree about whether instructions exist.
  const howTo = hasHowTo(drill) && drill.steps?.length
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: drillHeading(drill),
        description,
        datePublished: dates.published,
        dateModified: dates.modified,
        ...(drill.equipment?.length && drill.equipment[0].toLowerCase() !== "none"
          ? { supply: drill.equipment.map(item => ({ "@type": "HowToSupply", name: item })) }
          : {}),
        step: drill.steps.map(s => ({
          "@type": "HowToStep",
          position: s.n,
          name: s.title,
          text: s.detail,
          url: `${url}#step-${s.n}`,
        })),
      }
    : null;

  return (
    <>
      <Script data={video} />
      <Script data={breadcrumb} />
      {howTo && <Script data={howTo} />}
    </>
  );
}

/** ItemList for a sport hub or the library index. */
export function DrillListJsonLd({
  name, description, path, drills,
}: {
  name: string;
  description: string;
  path: string;
  drills: Drill[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: abs(path),
    numberOfItems: drills.length,
    itemListElement: drills.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: drillHeading(d),
      url: abs(drillPath(d)),
    })),
  };

  /* ItemList is an Intangible, so it cannot carry datePublished or
     dateModified — those belong to CreativeWork. The page itself is the
     CreativeWork, so the dates go on a WebPage node rather than being
     bolted onto ItemList where a validator would reject them.

     A hub is genuinely published when its oldest drill landed and
     genuinely modified when its newest one did: adding a drill really does
     change the hub. Both are manifest dates, matching the visible
     "Updated" line. */
  const dates = collectionDates(drills);

  return (
    <>
      <Script data={data} />
      {dates && (
        <Script
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name,
            description,
            url: abs(path),
            datePublished: dates.published,
            dateModified: dates.modified,
            inLanguage: "en",
          }}
        />
      )}
    </>
  );
}

export function BreadcrumbJsonLd({ trail }: { trail: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path),
    })),
  };
  return <Script data={data} />;
}
