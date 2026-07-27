/* One-time mirror of the Drill Library assets (12 videos + posters) from
   Higgsfield's CloudFront CDN to our own Vercel Blob store.

   Usage:  node scripts/mirror-drills.mjs
   Needs:  BLOB_READ_WRITE_TOKEN in .env.local (or the environment).
   Node:   >= 22.18 (imports src/lib/drills.ts via native type stripping).

   Idempotent: assets whose pathname already exists in the store are
   skipped, so a second run uploads nothing. Only the URLs referenced in
   DRILLS are mirrored — nothing else from the CDN folder (no seedance or
   other unused variants) is touched.

   Prints a JSON report at the end: cdn URL -> blob URL mapping (posters
   are shared per sport on the CDN, so those map to one blob URL per
   drill), the store base URL to paste into DRILL_BLOB_BASE in
   src/lib/drills.ts, bytes uploaded, and any failures. */

import { fileURLToPath } from 'node:url';
import { put, list } from '@vercel/blob';
import { DRILLS } from '../src/lib/drills.ts';

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

// Every asset actually referenced by the app: 6 drills x (intro + demo)
// videos, plus one poster per drill (shared per sport at the source).
const assets = DRILLS.flatMap(d => [
  { cdn: d.intro.cdn, pathname: `drills/${d.id}/intro.mp4`, contentType: 'video/mp4' },
  { cdn: d.demo.cdn, pathname: `drills/${d.id}/demo.mp4`, contentType: 'video/mp4' },
  { cdn: d.poster.cdn, pathname: `drills/${d.id}/poster.png`, contentType: 'image/png' },
]);

// Existing pathnames in the store, so reruns skip completed uploads.
const existing = new Map();
let cursor;
do {
  const page = await list({ prefix: 'drills/', cursor, token });
  for (const blob of page.blobs) existing.set(blob.pathname, blob.url);
  cursor = page.cursor;
} while (cursor);

// Posters share a source URL across drills; download each source once.
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
    addMapping(asset.cdn, already);
    console.error(`skip   ${asset.pathname} (already in Blob)`);
    continue;
  }
  try {
    const body = await download(asset.cdn);
    const result = await put(asset.pathname, body, {
      access: 'public',
      addRandomSuffix: false,
      contentType: asset.contentType,
      token,
    });
    uploadedBytes += body.length;
    uploadedCount++;
    addMapping(asset.cdn, result.url);
    console.error(`upload ${asset.pathname} (${(body.length / 1e6).toFixed(1)} MB)`);
  } catch (err) {
    failures.push({ pathname: asset.pathname, cdn: asset.cdn, error: String(err) });
    console.error(`FAIL   ${asset.pathname}: ${err}`);
  }
}

function addMapping(cdn, blobUrl) {
  if (!mapping[cdn]) mapping[cdn] = blobUrl;
  else if (Array.isArray(mapping[cdn])) mapping[cdn].push(blobUrl);
  else mapping[cdn] = [mapping[cdn], blobUrl];
}

const anyUrl = Object.values(mapping).flat()[0];
const blobBase = anyUrl ? new URL(anyUrl).origin : null;

console.log(JSON.stringify({
  blobBase,
  uploadedCount,
  uploadedBytes,
  skippedCount,
  failures,
  mapping,
}, null, 2));

process.exit(failures.length ? 1 : 0);
