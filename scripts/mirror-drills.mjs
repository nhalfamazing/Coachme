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

   Prints a JSON report: source -> blob mapping, bytes uploaded, failures.
   Exit 1 on any failure — a failed mirror EXCLUDES that drill from
   shipping (build-drills.mjs enforces this; we never serve CDN links). */

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
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

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/drills-manifest.json', import.meta.url)), 'utf8'),
);

const isBlobUrl = (url) => typeof url === 'string' && new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');

// Every asset the manifest wants on Blob but does not already have there.
const assets = [];
for (const d of manifest.drills) {
  for (const kind of ['intro', 'demo']) {
    const src = d.clips[kind];
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

console.log(JSON.stringify({
  uploadedCount,
  uploadedMB: +(uploadedBytes / 1e6).toFixed(1),
  skippedCount,
  failures,
  mapping,
}, null, 2));

process.exit(failures.length ? 1 : 0);
