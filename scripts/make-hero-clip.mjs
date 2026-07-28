/* Build the lightweight hero clip for the landing page.

   Usage:  node scripts/make-hero-clip.mjs
   Needs:  BLOB_READ_WRITE_TOKEN, playwright chromium.

   Re-encodes drills/bb-crossover/demo.mp4 (H.264, ~6 MB) into a ~1 MB
   480p VP8 WebM at drills/bb-crossover/hero.webm. The machine's only
   ffmpeg (playwright's) has no H.264 decoder, so the transcode happens
   inside headless chromium: play the clip, draw frames to a canvas,
   record canvas.captureStream() with MediaRecorder. Realtime (runs for
   the clip's duration). The landing hero picks WebM via canPlayType and
   falls back to the original mp4 on browsers without VP8 (older iOS).

   Idempotent: skips if hero.webm already exists in the store. */

import { fileURLToPath } from 'node:url';
import { put, head } from '@vercel/blob';
import { chromium } from 'playwright';

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
} catch { /* token may be in the environment */ }

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN is not set. Aborting.');
  process.exit(1);
}

const SRC = 'https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/drills/bb-crossover/demo.mp4';
const DEST = 'drills/bb-crossover/hero.webm';

const already = await head(DEST, { token }).catch(() => null);
if (already) {
  console.log(JSON.stringify({ skipped: true, url: already.url }));
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');

const base64 = await page.evaluate(async (src) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.src = src;
  await new Promise((res, rej) => {
    video.onloadeddata = res;
    video.onerror = () => rej(new Error('source load failed'));
    setTimeout(() => rej(new Error('source load timeout')), 30000);
  });

  const scale = 480 / video.videoHeight;
  const canvas = document.createElement('canvas');
  // Even dimensions keep encoders happy.
  canvas.width = Math.round((video.videoWidth * scale) / 2) * 2;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp8',
    videoBitsPerSecond: 900_000,
  });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((res) => { rec.onstop = res; });

  let raf;
  const draw = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    raf = requestAnimationFrame(draw);
  };

  rec.start(250);
  draw();
  video.play();
  await new Promise((res) => { video.onended = res; });
  cancelAnimationFrame(raf);
  rec.stop();
  await done;

  const blob = new Blob(chunks, { type: 'video/webm' });
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}, SRC);

await browser.close();

const body = Buffer.from(base64, 'base64');
if (body.length < 100_000) {
  console.error(`Transcode produced a suspiciously small file (${body.length} bytes). Not uploading.`);
  process.exit(1);
}
const result = await put(DEST, body, {
  access: 'public', addRandomSuffix: false, contentType: 'video/webm', token,
});
console.log(JSON.stringify({ uploadedMB: +(body.length / 1e6).toFixed(2), url: result.url }));
