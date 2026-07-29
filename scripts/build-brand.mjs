/* KoachMe brand asset pipeline. Repeatable: drop a new master logo at
   public/brand/koachme-logo.webp and re-run.

   Usage:  node scripts/build-brand.mjs   (pnpm build:brand)

   Source: horizontal lockup on solid black - shield monogram (lime
   outline, white K + lime M) plus KOACHME wordmark. The source has NO
   alpha and lives on black; we deliberately keep the black background
   everywhere (knocking out black leaves halo edges on a JPEG-like
   source). Light surfaces get the dark-chip treatment in the UI instead.

   Outputs:
   public/brand/lockup.png            tight-cropped full logo
   public/brand/mark.png              shield monogram, square
   public/brand/icon-192.png          PWA icon
   public/brand/icon-512.png          PWA icon
   public/brand/icon-512-maskable.png PWA maskable (mark in 80% safe zone)
   public/brand/og-image.png          1200x630 social card
   src/app/favicon.ico                16+32+48 ICO (Next file convention)
   src/app/apple-icon.png             180x180 (Next file convention) */

import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const BG = '#0A0A0B';
const SRC = root('public/brand/koachme-logo.webp');

/* Solid-canvas helper: content resized to fit a box, centered on BG. */
async function onCanvas(input, canvasW, canvasH, contentFrac) {
  const content = await sharp(input)
    .resize(Math.round(canvasW * contentFrac), Math.round(canvasH * contentFrac), {
      fit: 'inside',
    })
    .toBuffer();
  return sharp({
    create: { width: canvasW, height: canvasH, channels: 3, background: BG },
  })
    .composite([{ input: content, gravity: 'center' }])
    .png()
    .toBuffer();
}

/* 1. Tight lockup: trim the black border, then a small breathing edge.
   The master has a small decorative sparkle near the bottom-right
   corner that would stretch the trim box; black out the bottom quarter
   (the logo band sits in the middle of the canvas) before trimming. */
const srcMeta = await sharp(SRC).metadata();
const maskH = Math.round(srcMeta.height * 0.25);
const masked = await sharp(SRC)
  .composite([{
    input: {
      create: { width: srcMeta.width, height: maskH, channels: 3, background: '#000000' },
    },
    top: srcMeta.height - maskH,
    left: 0,
  }])
  .toBuffer();
const trimmed = await sharp(masked)
  .trim({ background: '#000000', threshold: 30 })
  .toBuffer();
const lockup = await sharp(trimmed)
  .extend({ top: 16, bottom: 16, left: 16, right: 16, background: BG })
  .png()
  .toBuffer();
writeFileSync(root('public/brand/lockup.png'), lockup);
const lockupMeta = await sharp(lockup).metadata();

/* 2. Mark: the shield is the leftmost element. Take the left ~30% of the
   trimmed lockup (shield + part of the gap), re-trim to the shield
   itself, then square it on BG. */
const tMeta = await sharp(trimmed).metadata();
const leftSlice = await sharp(trimmed)
  .extract({ left: 0, top: 0, width: Math.round(tMeta.width * 0.3), height: tMeta.height })
  .trim({ background: '#000000', threshold: 30 })
  .toBuffer();
const sMeta = await sharp(leftSlice).metadata();
const side = Math.max(sMeta.width, sMeta.height) + 32;
const mark = await sharp({
  create: { width: side, height: side, channels: 3, background: BG },
})
  .composite([{ input: leftSlice, gravity: 'center' }])
  .png()
  .toBuffer();
writeFileSync(root('public/brand/mark.png'), mark);

/* 3. Icons. Maskable keeps the mark inside the central 80% safe zone. */
writeFileSync(root('public/brand/icon-192.png'), await onCanvas(mark, 192, 192, 0.86));
writeFileSync(root('public/brand/icon-512.png'), await onCanvas(mark, 512, 512, 0.86));
writeFileSync(root('public/brand/icon-512-maskable.png'), await onCanvas(mark, 512, 512, 0.62));
writeFileSync(root('src/app/apple-icon.png'), await onCanvas(mark, 180, 180, 0.8));

const icoSizes = await Promise.all(
  [16, 32, 48].map((s) => onCanvas(mark, s, s, 0.94)),
);
writeFileSync(root('src/app/favicon.ico'), await pngToIco(icoSizes));

/* 4. OG card: lockup centered on brand black. */
const ogContent = await sharp(lockup)
  .resize(960, 420, { fit: 'inside' })
  .toBuffer();
const og = await sharp({
  create: { width: 1200, height: 630, channels: 3, background: BG },
})
  .composite([{ input: ogContent, gravity: 'center' }])
  .png()
  .toBuffer();
writeFileSync(root('public/brand/og-image.png'), og);

console.log(JSON.stringify({
  lockup: `${lockupMeta.width}x${lockupMeta.height}`,
  mark: `${side}x${side}`,
  outputs: ['lockup.png', 'mark.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'og-image.png', 'src/app/favicon.ico', 'src/app/apple-icon.png'],
}, null, 2));
