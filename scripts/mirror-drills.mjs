/* Mirror Drill Library assets from data/drills-manifest.json to our
   Vercel Blob store.

   Usage:  node scripts/mirror-drills.mjs        (or: pnpm mirror:drills)
   Needs:  BLOB_READ_WRITE_TOKEN in .env.local (or the environment).

   Reads the manifest (the library's source of truth) and uploads every
   referenced asset that is not already served from our Blob store:
   - drill clips  -> drills/{drillId}/{intro|demo}.mp4
   - drill poster -> drills/{drillId}/poster.png   (when posterUrl is a CDN url)
   - coach images -> coaches/{coachId}/portrait.png
   - coach video  -> coaches/{coachId}/portrait.mp4 (when present)

   Idempotent two ways: manifest URLs already on the Blob store are
   skipped outright, and CDN URLs whose target pathname already exists in
   the store are skipped via the pathname listing. Sources shared by
   several targets download once.

   Also measures each demo clip's DURATION with ffprobe and writes it back
   into the manifest, so VideoObject can state a real length. See the
   duration pass at the bottom of this file.

   Prints a JSON report: source -> blob mapping, bytes uploaded, failures.
   Exit 1 on any failure — a failed mirror EXCLUDES that drill from
   shipping (build-drills.mjs enforces this; we never serve CDN links). */

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { put, list } from '@vercel/blob';

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
} catch {
  /* no .env.local — the token may still be in the environment */
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN is not set (checked .env.local and the environment). Aborting.');
  process.exit(1);
}

const manifestPath = fileURLToPath(new URL('../data/drills-manifest.json', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const isBlobUrl = (url) => typeof url === 'string' && new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');

// Every asset the manifest wants on Blob but does not already have there.
const assets = [];
for (const d of manifest.drills) {
  for (const kind of ['intro', 'demo']) {
    const src = d.clips[kind];
    // Single-clip drills have no intro; only mirror clips the manifest names.
    if (!src) continue;
    if (!isBlobUrl(src)) assets.push({ src, pathname: `drills/${d.id}/${kind}.mp4`, contentType: 'video/mp4' });
  }
  if (d.posterUrl && !isBlobUrl(d.posterUrl)) {
    assets.push({ src: d.posterUrl, pathname: `drills/${d.id}/poster.png`, contentType: 'image/png' });
  }
}
for (const c of manifest.coaches) {
  if (c.portraitUrl && !isBlobUrl(c.portraitUrl)) {
    assets.push({ src: c.portraitUrl, pathname: `coaches/${c.id}/portrait.png`, contentType: 'image/png' });
  }
  if (c.portraitVideoUrl && !isBlobUrl(c.portraitVideoUrl)) {
    assets.push({ src: c.portraitVideoUrl, pathname: `coaches/${c.id}/portrait.mp4`, contentType: 'video/mp4' });
  }
}

// Existing pathnames in the store, so reruns skip completed uploads.
const existing = new Map();
for (const prefix of ['drills/', 'coaches/']) {
  let cursor;
  do {
    const page = await list({ prefix, cursor, token });
    for (const blob of page.blobs) existing.set(blob.pathname, blob.url);
    cursor = page.cursor;
  } while (cursor);
}

// Sources shared by several targets (per-sport posters) download once.
const downloads = new Map();
async function download(url) {
  if (!downloads.has(url)) {
    downloads.set(url, (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    })());
  }
  return downloads.get(url);
}

const mapping = {};
const failures = [];
let uploadedBytes = 0;
let uploadedCount = 0;
let skippedCount = 0;

for (const asset of assets) {
  const already = existing.get(asset.pathname);
  if (already) {
    skippedCount++;
    mapping[asset.pathname] = already;
    console.error(`skip   ${asset.pathname} (already in Blob)`);
    continue;
  }
  try {
    const body = await download(asset.src);
    const result = await put(asset.pathname, body, {
      access: 'public',
      addRandomSuffix: false,
      contentType: asset.contentType,
      token,
    });
    uploadedBytes += body.length;
    uploadedCount++;
    mapping[asset.pathname] = result.url;
    console.error(`upload ${asset.pathname} (${(body.length / 1e6).toFixed(1)} MB)`);
  } catch (err) {
    failures.push({ pathname: asset.pathname, src: asset.src, error: String(err) });
    console.error(`FAIL   ${asset.pathname}: ${err}`);
  }
}

/* ---------------------------------------------------------------
   Duration pass.

   VideoObject should state how long a clip is, and until now it stated
   nothing, because nothing measured it. ffprobe reads the duration out of
   the container's own header — it is a measurement, not an estimate.

   It probes the URL directly rather than downloading: ffprobe issues range
   requests and reads only the header, so this costs kilobytes per clip
   rather than megabytes.

   This runs over EVERY drill, not just newly-mirrored ones. The upload pass
   above skips assets already in Blob, and every asset is already there, so
   scoping durations to new uploads would measure nothing forever.

   IF FFPROBE IS NOT INSTALLED, NOTHING IS WRITTEN. The field stays absent
   and VideoObject omits duration. That is the correct outcome: an absent
   duration costs a rich-result feature, while a guessed one puts a false
   number in a search result and in every AI answer that quotes it.
   --------------------------------------------------------------- */

function ffprobeVersion() {
  const r = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return (r.stdout ?? '').split('\n')[0].trim();
}

/** Measured length of the clip at `url`, or null if it cannot be read. */
function probeDuration(url) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    url,
  ], { encoding: 'utf8', timeout: 60_000 });
  if (r.error || r.status !== 0) return null;
  const value = Number.parseFloat((r.stdout ?? '').trim());
  // ffprobe reports "N/A" for containers with no duration in the header.
  return Number.isFinite(value) && value > 0 ? value : null;
}

const durations = { probed: 0, unchanged: 0, failed: [], skipped: null };
const ffprobe = ffprobeVersion();

if (!ffprobe) {
  durations.skipped = 'ffprobe not found on PATH — durations left absent rather than guessed';
  console.error(`WARN: ${durations.skipped}`);
} else {
  console.error(`durations: using ${ffprobe}`);
  let changed = false;
  for (const d of manifest.drills) {
    // The demo clip is what VideoObject describes, so it is what we measure.
    const url = d.clips?.demo;
    if (!url) continue;
    const seconds = probeDuration(url);
    if (seconds === null) {
      durations.failed.push(d.id);
      console.error(`FAIL   duration ${d.id}`);
      continue;
    }
    const rounded = +seconds.toFixed(3);
    if (d.durationSeconds === rounded) {
      durations.unchanged++;
      continue;
    }
    d.durationSeconds = rounded;
    durations.probed++;
    changed = true;
    console.error(`probe  ${d.id} ${rounded}s`);
  }
  if (changed) {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.error(`durations: manifest updated (${durations.probed} changed)`);
  }
}

console.log(JSON.stringify({
  uploadedCount,
  uploadedMB: +(uploadedBytes / 1e6).toFixed(1),
  skippedCount,
  failures,
  durations,
  mapping,
}, null, 2));

// A missing ffprobe is not a mirror failure: the assets are fine, we simply
// could not measure them. Only real upload or probe failures fail the run.
//
// exitCode rather than process.exit(): exiting while undici still holds
// open sockets trips a libuv assertion on Windows that overwrites the exit
// code, so a clean run could report failure.
process.exitCode = failures.length || durations.failed.length ? 1 : 0;
