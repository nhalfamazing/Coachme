/* Generate poster stills for drills that have no poster source.

   Usage:  node scripts/make-posters.mjs        (or: pnpm posters:drills)
   Needs:  BLOB_READ_WRITE_TOKEN, playwright chromium (dev deps).

   For every manifest drill with posterUrl null: load the drill's demo
   clip (already mirrored to Blob) in headless chromium, seek past the
   first frames, capture a video frame to canvas, and upload the PNG to
   drills/{id}/poster.png. The poster is real footage from the drill's
   own AI-generated demo clip — no stock imagery, nothing invented.

   Idempotent: drills whose poster.png already exists in the store are
   skipped. Exit 1 if any poster fails. */

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { put, list } from '@vercel/blob';
import { chromium } from 'playwright';

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
} catch { /* token may be in the environment */ }

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN is not set. Aborting.');
  process.exit(1);
}

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/drills-manifest.json', import.meta.url)), 'utf8'),
);
const isBlobUrl = (url) => typeof url === 'string' && new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');

const existing = new Set();
let cursor;
do {
  const page = await list({ prefix: 'drills/', cursor, token });
  for (const blob of page.blobs) existing.add(blob.pathname);
  cursor = page.cursor;
} while (cursor);

const targets = manifest.drills.filter(d => !d.posterUrl && !existing.has(`drills/${d.id}/poster.png`));
if (targets.length === 0) {
  console.log(JSON.stringify({ generated: 0, note: 'all posters present' }));
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
let generated = 0;

for (const d of targets) {
  const demoUrl = d.clips.demo && isBlobUrl(d.clips.demo)
    ? d.clips.demo
    : `https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/${d.id}/demo.mp4`;
  try {
    const dataUrl = await page.evaluate(async (src) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.src = src;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error('video load failed'));
        setTimeout(() => reject(new Error('video load timeout')), 30000);
      });
      // Seek past the very first frames (often dark or mid-fade).
      video.currentTime = Math.min(0.8, (video.duration || 1) / 4);
      await new Promise((resolve, reject) => {
        video.onseeked = resolve;
        setTimeout(() => reject(new Error('seek timeout')), 15000);
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return canvas.toDataURL('image/png');
    }, demoUrl);

    const body = Buffer.from(dataUrl.split(',')[1], 'base64');
    await put(`drills/${d.id}/poster.png`, body, {
      access: 'public', addRandomSuffix: false, contentType: 'image/png', token,
    });
    generated++;
    console.error(`poster drills/${d.id}/poster.png (${(body.length / 1e6).toFixed(1)} MB, from demo frame)`);
  } catch (err) {
    failures.push({ id: d.id, error: String(err) });
    console.error(`FAIL   ${d.id}: ${err}`);
  }
}

await browser.close();
console.log(JSON.stringify({ generated, failures }, null, 2));
process.exit(failures.length ? 1 : 0);
