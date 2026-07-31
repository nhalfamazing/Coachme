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
   coach asset fails the whole build (drills reference coaches).

   TEACHING CONTENT: the optional summary/builds/equipment/space/steps/
   mistakes/trackedStat fields are copied through VERBATIM. This script
   never generates, infers, or backfills any of them — absent stays
   absent (emitted as null) so the UI renders no section rather than an
   invented one. Malformed content is a FATAL build error, not a
   silently-dropped field: bad teaching data must never reach a kid. */

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const BLOB_BASE = 'https://woooi7wpsmvhydy9.public.blob.vercel-storage.com';
const manifestPath = fileURLToPath(new URL('../data/drills-manifest.json', import.meta.url));
const outPath = fileURLToPath(new URL('../src/lib/drills.ts', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const isBlobUrl = (url) => typeof url === 'string' && new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------
   Slugs. The public URL segment for a drill, keyword-matching by
   design: /drills/softball/windmill-pitching, not /drills/softball/
   sb-windmill. The id stays the internal key for storage, Blob paths
   and every data structure — this is URLs only.

   A slug is IMMUTABLE once shipped. Renaming one is a dead page plus a
   lost ranking, so a title reword must NOT move a URL: the slug lives
   in the manifest as its own field rather than being derived from the
   name at build time. It was seeded from the name in kebab-case, and
   that is where the relationship ends.
   --------------------------------------------------------------- */
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slugErrors = [];
const seenSlugs = new Map();
for (const d of manifest.drills) {
  if (typeof d.slug !== 'string' || !d.slug) {
    slugErrors.push(`${d.id}: missing "slug" — every drill needs an explicit, permanent URL slug`);
    continue;
  }
  if (!SLUG_RE.test(d.slug)) {
    slugErrors.push(`${d.id}: slug "${d.slug}" must be lowercase kebab-case ([a-z0-9] separated by single hyphens)`);
  }
  // Uniqueness only has to hold within a sport, because the sport is its
  // own path segment. Checking the pair is what actually keeps two pages
  // from claiming one URL.
  const key = `${d.sport}/${d.slug}`;
  if (seenSlugs.has(key)) {
    slugErrors.push(`${d.id}: slug collides with ${seenSlugs.get(key)} — both resolve to /drills/${key}`);
  }
  seenSlugs.set(key, d.id);
  if (d.slug === d.id) {
    console.error(`WARN: drill ${d.id} slug equals its id; slugs should read as keywords, not internal keys.`);
  }
}
if (slugErrors.length) {
  console.error('FATAL: bad drill slugs in the manifest — a slug is a public URL, fix the data:');
  for (const e of slugErrors) console.error(`  ${e}`);
  process.exit(1);
}
// manifest.sports maps sport id -> { display, icon }; a drill sport with
// no entry still builds (title-cased, blank icon) but warns loudly.
const sportMeta = manifest.sports ?? {};
const sportDisplay = (id) => sportMeta[id]?.display ?? titleCase(id);

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

/* ---------------------------------------------------------------
   Teaching content: validate shape, never invent values.
   --------------------------------------------------------------- */
const contentErrors = [];
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isStrArray = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);

/** Read one optional field off a drill, validating it if present.
    Returns undefined when the field is absent — the caller emits null. */
function contentField(d, key, validate) {
  const v = d[key];
  if (v === undefined || v === null) return undefined;
  const problem = validate(v);
  if (problem) {
    contentErrors.push(`${d.id}.${key}: ${problem}`);
    return undefined;
  }
  return v;
}

function drillContent(d) {
  const steps = contentField(d, 'steps', (v) => {
    if (!Array.isArray(v) || v.length === 0) return 'must be a non-empty array';
    for (let i = 0; i < v.length; i++) {
      const s = v[i];
      if (!s || typeof s !== 'object') return `step ${i + 1} must be an object`;
      if (!Number.isInteger(s.n)) return `step ${i + 1} needs an integer n`;
      // Contiguous 1..N: the UI renders these as a stepper, and a gap
      // would read as a missing instruction.
      if (s.n !== i + 1) return `step at index ${i} has n=${s.n}, expected ${i + 1}`;
      if (!isStr(s.title)) return `step ${s.n} needs a title`;
      if (!isStr(s.detail)) return `step ${s.n} needs a detail`;
    }
    return null;
  });
  const mistakes = contentField(d, 'mistakes', (v) => {
    if (!Array.isArray(v) || v.length === 0) return 'must be a non-empty array';
    for (let i = 0; i < v.length; i++) {
      const m = v[i];
      if (!m || typeof m !== 'object') return `entry ${i + 1} must be an object`;
      // A mistake without its fix is worse than no entry: it names an
      // error and leaves the kid with no correction.
      if (!isStr(m.mistake)) return `entry ${i + 1} needs a mistake`;
      if (!isStr(m.fix)) return `entry ${i + 1} ("${m.mistake}") needs a fix`;
    }
    return null;
  });
  return {
    summary: contentField(d, 'summary', (v) => (isStr(v) ? null : 'must be a non-empty string')),
    builds: contentField(d, 'builds', (v) => (isStrArray(v) ? null : 'must be a non-empty array of strings')),
    equipment: contentField(d, 'equipment', (v) => (isStrArray(v) ? null : 'must be a non-empty array of strings')),
    space: contentField(d, 'space', (v) => (isStr(v) ? null : 'must be a non-empty string')),
    steps,
    mistakes,
    trackedStat: contentField(d, 'trackedStat', (v) => (isStr(v) ? null : 'must be a non-empty string or null')),
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
  included.push({ ...d, assets, content: drillContent(d) });
}

if (contentErrors.length) {
  console.error('FATAL: malformed teaching content in the manifest — fix the data, do not write around it:');
  for (const e of contentErrors) console.error(`  ${e}`);
  process.exit(1);
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

const sports = [...new Set(included.map(d => sportDisplay(d.sport)))];
for (const d of included) {
  if (!sportMeta[d.sport]) console.error(`WARN: drill ${d.id} sport "${d.sport}" has no manifest.sports entry (no chip icon).`);
}
const q = (s) => JSON.stringify(s);

/* Measured clip length, or null. Written by the ffprobe pass in
   mirror-drills.mjs. A drill that has never been probed, or whose probe
   failed, emits null and its VideoObject carries no duration at all —
   never a default, never an estimate. Anything present but not a positive
   number is a data error worth failing on rather than quietly dropping. */
const duration = (d) => {
  const v = d.durationSeconds;
  if (v === undefined || v === null) return 'null';
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
    console.error(`FATAL: drill ${d.id} has durationSeconds ${JSON.stringify(v)}; expected a positive number or null.`);
    process.exit(1);
  }
  return String(v);
};
/** Emit an optional content field: the value, or a bare null. Never a
    placeholder — the UI keys "render this section" off null. */
const qOpt = (v) => (v === undefined ? 'null' : JSON.stringify(v));
const qSteps = (steps) => (steps === undefined ? 'null' : `[\n${steps.map(s =>
  `      { n: ${s.n}, title: ${q(s.title)}, detail: ${q(s.detail)} }`).join(',\n')},\n    ]`);
const qMistakes = (mistakes) => (mistakes === undefined ? 'null' : `[\n${mistakes.map(m =>
  `      { mistake: ${q(m.mistake)}, fix: ${q(m.fix)} }`).join(',\n')},\n    ]`);

const drillEntries = included.map(d => `  {
    id: ${q(d.id)},
    slug: ${q(d.slug)},
    sport: ${q(sportDisplay(d.sport))},
    title: ${q(d.name)},
    cue: ${q(d.description)},
    level: ${q(d.level)},
    focus: ${q(d.focus)},
    coachId: ${q(d.coachId)},
    addedAt: ${q(d.addedAt)},
    intro: ${d.assets.intro ? `{ cdn: ${q(d.assets.intro.cdn)}, blob: ${q(d.assets.intro.blob)} }` : 'null'},
    demo: { cdn: ${q(d.assets.demo.cdn)}, blob: ${q(d.assets.demo.blob)} },
    poster: { cdn: ${q(d.assets.poster.cdn)}, blob: ${q(d.assets.poster.blob)} },
    durationSeconds: ${duration(d)},
    summary: ${qOpt(d.content.summary)},
    builds: ${qOpt(d.content.builds)},
    equipment: ${qOpt(d.content.equipment)},
    space: ${qOpt(d.content.space)},
    steps: ${qSteps(d.content.steps)},
    mistakes: ${qMistakes(d.content.mistakes)},
    trackedStat: ${qOpt(d.content.trackedStat)},
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
   missing assets are excluded by the generator.

   Teaching content (summary/builds/equipment/space/steps/mistakes/
   trackedStat) is human-written and copied verbatim from the manifest.
   null means not written yet — render nothing, never a placeholder. */

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

/** One numbered instruction in a drill's how-to. n is 1-based and
    contiguous; the generator refuses gaps. */
export interface DrillStep {
  n: number;
  title: string;
  detail: string;
}

/** A common error paired with its correction. Never one without the
    other — naming a mistake with no fix leaves the athlete stuck. */
export interface DrillMistake {
  mistake: string;
  fix: string;
}

export interface Drill {
  /** Internal key. Storage, Blob paths and every data structure use this,
      and it never appears in a public URL. */
  id: string;
  /** Public URL segment: /drills/<sport>/<slug>. Keyword-matching, seeded
      from the title in kebab-case, and IMMUTABLE once shipped — retitling a
      drill must not move its URL. Changing one is a redirect decision, not
      an edit. */
  slug: string;
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
  /** Measured length of the demo clip in seconds, from ffprobe (see
      scripts/mirror-drills.mjs). null = never successfully measured, in
      which case VideoObject emits NO duration. Never estimated: a wrong
      length in structured data is repeated as fact by search results and
      AI assistants. */
  durationSeconds: number | null;

  /* ---- Teaching content. Human-written, copied verbatim from the
     manifest, NEVER generated. null means "not written yet": render
     nothing at all, never an empty section and never a placeholder. ---- */

  /** 2-3 plain sentences describing what the drill is. */
  summary: string | null;
  /** Short phrases naming what the drill develops ("soft hands"). */
  builds: string[] | null;
  /** Gear needed, or ["none"]. */
  equipment: string[] | null;
  /** Where it can be done: driveway | backyard | gym | field. */
  space: string | null;
  /** The numbered how-to. */
  steps: DrillStep[] | null;
  /** Common errors and their corrections. */
  mistakes: DrillMistake[] | null;
  /** Key of the athlete stat-sheet entry this drill improves, linking a
      drill to a measurable number. null until a real stat is agreed for
      the drill — the personal-best panel stays hidden while it is null. */
  trackedStat: string | null;
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

/** Display metadata for every sport the manifest supports, keyed by
    display name — includes sports with no drills yet. Chips render only
    sports present in DRILLS; icons come from here. */
export const SPORT_META: Record<string, { icon: string }> = {
${Object.values(sportMeta).map(m => `  ${q(m.display)}: { icon: ${q(m.icon)} },`).join('\n')}
};

export function coachFor(drill: Drill): DrillCoach {
  // The generator guarantees every coachId resolves.
  return COACHES.find(c => c.id === drill.coachId)!;
}
`;

writeFileSync(outPath, out);
/* Content coverage: which drills are still missing which teaching
   fields, so "what do we still need to write" is a build output rather
   than something anyone has to eyeball. */
const CONTENT_FIELDS = ['summary', 'builds', 'equipment', 'space', 'steps', 'mistakes', 'trackedStat'];
const missingContent = {};
for (const d of included) {
  const missing = CONTENT_FIELDS.filter(f => d.content[f] === undefined);
  if (missing.length) missingContent[d.id] = missing;
}

console.log(JSON.stringify({
  drills: included.length,
  excluded,
  coaches: coaches.length,
  sports,
  missingContent,
}, null, 2));
process.exit(excluded.length ? 2 : 0);
