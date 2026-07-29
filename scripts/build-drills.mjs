/* Generate src/lib/drills.ts from data/drills-manifest.json.

   Usage:  node scripts/build-drills.mjs        (or: pnpm build:drills)

   The manifest is the library's source of truth; drills.ts is build
   output (typed, committed, reviewed like any code). Pipeline:
     1. pnpm mirror:drills   - upload any CDN-sourced assets to Blob
     2. pnpm posters:drills  - first-frame posters where posterUrl null
     3. pnpm build:drills    - this script

   SHIPPING GATE: every asset URL the generated file will serve is
   HEAD-checked against the Blob store here. A drill with ANY missing
   asset is EXCLUDED from the generated file (with a loud warning) — we
   never ship hotlinked CDN URLs and never ship dead players. A missing
   coach asset fails the whole build (drills reference coaches). */

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const BLOB_BASE = 'https://woooi7wpsmvhydy9.public.blob.vercel-storage.com';
const manifestPath = fileURLToPath(new URL('../data/drills-manifest.json', import.meta.url));
const outPath = fileURLToPath(new URL('../src/lib/drills.ts', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const isBlobUrl = (url) => typeof url === 'string' && new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/* Resolve the served (blob) and provenance (cdn) URL for each asset. */
function drillAssets(d) {
  const blobFor = (kind, ext) => `${BLOB_BASE}/drills/${d.id}/${kind}.${ext}`;
  return {
    // Single-clip drills omit clips.intro entirely; they ship intro: null
    // and the player renders demo-only.
    intro: !d.clips.intro ? null : {
      blob: isBlobUrl(d.clips.intro) ? d.clips.intro : blobFor('intro', 'mp4'),
      cdn: d.sourceCdn?.intro ?? (isBlobUrl(d.clips.intro) ? '' : d.clips.intro),
    },
    demo: {
      blob: isBlobUrl(d.clips.demo) ? d.clips.demo : blobFor('demo', 'mp4'),
      cdn: d.sourceCdn?.demo ?? (isBlobUrl(d.clips.demo) ? '' : d.clips.demo),
    },
    poster: {
      blob: d.posterUrl && isBlobUrl(d.posterUrl) ? d.posterUrl : blobFor('poster', 'png'),
      // posterUrl null means the poster is a generated first frame of the
      // demo clip; provenance is that clip.
      cdn: d.posterUrl ?? (d.sourceCdn?.demo ?? d.clips.demo),
    },
  };
}

const included = [];
const excluded = [];
for (const d of manifest.drills) {
  const assets = drillAssets(d);
  const checks = await Promise.all(
    Object.entries(assets)
      .filter(([, a]) => a !== null)
      .map(async ([kind, a]) => ({ kind, ok: await headOk(a.blob), url: a.blob })),
  );
  const missing = checks.filter(c => !c.ok);
  if (missing.length) {
    excluded.push({ id: d.id, missing: missing.map(m => `${m.kind}: ${m.url}`) });
    console.error(`EXCLUDE ${d.id} — missing on Blob: ${missing.map(m => m.kind).join(', ')}`);
    continue;
  }
  included.push({ ...d, assets });
}

const coaches = [];
for (const c of manifest.coaches) {
  const portrait = {
    blob: isBlobUrl(c.portraitUrl) ? c.portraitUrl : `${BLOB_BASE}/coaches/${c.id}/portrait.png`,
    cdn: isBlobUrl(c.portraitUrl) ? '' : c.portraitUrl,
  };
  const portraitVideo = c.portraitVideoUrl
    ? {
        blob: isBlobUrl(c.portraitVideoUrl) ? c.portraitVideoUrl : `${BLOB_BASE}/coaches/${c.id}/portrait.mp4`,
        cdn: isBlobUrl(c.portraitVideoUrl) ? '' : c.portraitVideoUrl,
      }
    : null;
  if (!(await headOk(portrait.blob)) || (portraitVideo && !(await headOk(portraitVideo.blob)))) {
    console.error(`FATAL: coach asset missing on Blob for ${c.id}. Run pnpm mirror:drills first.`);
    process.exit(1);
  }
  coaches.push({ ...c, portrait, portraitVideo });
}

// Drills must reference a known coach; a typo'd coachId is a build error.
const coachIds = new Set(coaches.map(c => c.id));
for (const d of included) {
  if (!coachIds.has(d.coachId)) {
    console.error(`FATAL: drill ${d.id} references unknown coachId ${d.coachId}.`);
    process.exit(1);
  }
}

const sports = [...new Set(included.map(d => titleCase(d.sport)))];
const q = (s) => JSON.stringify(s);

const drillEntries = included.map(d => `  {
    id: ${q(d.id)},
    sport: ${q(titleCase(d.sport))},
    title: ${q(d.name)},
    cue: ${q(d.description)},
    level: ${q(d.level)},
    focus: ${q(d.focus)},
    coachId: ${q(d.coachId)},
    addedAt: ${q(d.addedAt)},
    intro: ${d.assets.intro ? `{ cdn: ${q(d.assets.intro.cdn)}, blob: ${q(d.assets.intro.blob)} }` : 'null'},
    demo: { cdn: ${q(d.assets.demo.cdn)}, blob: ${q(d.assets.demo.blob)} },
    poster: { cdn: ${q(d.assets.poster.cdn)}, blob: ${q(d.assets.poster.blob)} },
  }`).join(',\n');

const coachEntries = coaches.map(c => `  {
    id: ${q(c.id)},
    name: ${q(c.name)},
    style: ${q(c.style)},
    portrait: { cdn: ${q(c.portrait.cdn)}, blob: ${q(c.portrait.blob)} },
    portraitVideo: ${c.portraitVideo ? `{ cdn: ${q(c.portraitVideo.cdn)}, blob: ${q(c.portraitVideo.blob)} }` : 'null'},
  }`).join(',\n');

const out = `/* GENERATED FILE — do not edit by hand.
   Source: data/drills-manifest.json
   Regenerate: pnpm build:drills   (see scripts/build-drills.mjs)

   Drill Library: AI-generated coach clips, clearly labeled as AI in
   every surface that renders them. Each asset carries two URLs:
   - cdn:  original Higgsfield CloudFront source, kept for provenance /
           re-mirroring ONLY ('' when the source went straight to Blob).
           Never serve these — they rotate and die without warning.
   - blob: our mirrored copy on Vercel Blob. This is what the app serves.
   Every blob URL below was HEAD-verified at generation time; drills with
   missing assets are excluded by the generator. */

export type DrillSport = ${sports.map(q).join(' | ')};

export interface DrillAsset {
  /** Original CDN source — provenance only, never served. */
  cdn: string;
  /** Our mirrored copy on Vercel Blob — what the app serves. */
  blob: string;
}

export interface DrillCoach {
  id: string;
  name: string;
  /** One-line character description, straight from the manifest. */
  style: string;
  portrait: DrillAsset;
  portraitVideo: DrillAsset | null;
}

export interface Drill {
  id: string;
  sport: DrillSport;
  title: string;
  cue: string;
  level: string;
  focus: string;
  coachId: string;
  /** ISO date the drill entered the library; drives the NEW tag. */
  addedAt: string;
  /** null = single-clip drill: no coach intro, the demo is the whole clip. */
  intro: DrillAsset | null;
  demo: DrillAsset;
  poster: DrillAsset;
}

export const DRILL_BLOB_BASE = ${q(BLOB_BASE)};

export const COACHES: DrillCoach[] = [
${coachEntries},
];

export const DRILLS: Drill[] = [
${drillEntries},
];

/** Sports in manifest order; counts derive from DRILLS at the callsite. */
export const SPORTS: DrillSport[] = [${sports.map(q).join(', ')}];

export function coachFor(drill: Drill): DrillCoach {
  // The generator guarantees every coachId resolves.
  return COACHES.find(c => c.id === drill.coachId)!;
}
`;

writeFileSync(outPath, out);
console.log(JSON.stringify({
  drills: included.length,
  excluded,
  coaches: coaches.length,
  sports,
}, null, 2));
process.exit(excluded.length ? 2 : 0);
