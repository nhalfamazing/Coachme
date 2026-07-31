/* What JavaScript does each route actually ship?

   Usage:  node scripts/bundle-report.mjs [baseUrl] [--json]
           node scripts/bundle-report.mjs http://localhost:3000

   Next 16 stopped printing "First Load JS" in the build output, and that
   number was never the one that mattered anyway: it counts what the build
   associates with a route, not what a browser downloads. This fetches the
   rendered HTML, collects every <script src> and modulepreload the document
   asks for, and measures them the way a browser would — compressed transfer
   size, which is what costs time, alongside the uncompressed size, which is
   what costs main-thread parse and execute.

   It also reports which chunks are SHARED across every route. A chunk that
   appears on /privacy and on a drill page is, by definition, not paying for
   anything either page needs — that is the number to drive down. */

import { gzipSync, brotliCompressSync } from 'node:zlib';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const asJson = process.argv.includes('--json');

const ROUTES = [
  '/',
  '/privacy',
  '/about',
  '/drills',
  '/drills/softball',
  '/drills/softball/windmill-pitching',
  '/app',
  '/coach',
];

const KB = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Every script the document asks for, split by whether a modern browser
    actually fetches it.

    `noModule` scripts (Next's core-js polyfill bundle, ~110 KB) are
    downloaded ONLY by browsers that do not support ES modules. Counting
    them in the headline number overstates the real payload by more than
    the entire marketing budget, so they are reported separately rather
    than folded in. */
function scriptUrls(html) {
  const modern = new Set();
  const legacy = new Set();
  // Match the whole tag, not just what precedes src — Next emits
  // `<script src="…" noModule="">`, so testing only the leading attributes
  // silently classifies the 110 KB polyfill bundle as a modern payload.
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    (/\bnomodule\b/i.test(m[0]) ? legacy : modern).add(m[1]);
  }
  // Chunks the document preloads are fetched on the same page load and are
  // part of the cost, even though they are not <script src> tags.
  for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) modern.add(m[1]);
  const isJs = (u) => u.endsWith('.js') || u.includes('.js?');
  return { modern: [...modern].filter(isJs), legacy: [...legacy].filter(isJs) };
}

const sizeCache = new Map();
async function measure(url) {
  if (sizeCache.has(url)) return sizeCache.get(url);
  const abs = url.startsWith('http') ? url : `${base}${url}`;
  const res = await fetch(abs);
  const raw = Buffer.from(await res.arrayBuffer());
  /* `next start` serves these uncompressed; Vercel's edge does not. Gzip
     locally so the number means the same thing in both places — comparing a
     local raw size against a production transfer size is how a bundle looks
     like it tripled overnight. Brotli is what Vercel actually negotiates
     with any current browser, so that is the honest transfer figure. */
  const entry = {
    url,
    parsed: raw.length,
    gzip: gzipSync(raw).length,
    brotli: brotliCompressSync(raw).length,
  };
  sizeCache.set(url, entry);
  return entry;
}

const results = [];
for (const route of ROUTES) {
  const res = await fetch(`${base}${route}`);
  if (!res.ok) {
    results.push({ route, error: `HTTP ${res.status}` });
    continue;
  }
  const html = await res.text();
  const { modern, legacy } = scriptUrls(html);
  const chunks = await Promise.all(modern.map(measure));
  const legacyChunks = await Promise.all(legacy.map(measure));
  const sum = (list, k) => list.reduce((n, c) => n + c[k], 0);
  results.push({
    route,
    html: Buffer.byteLength(html),
    chunks: chunks.length,
    parsed: sum(chunks, 'parsed'),
    gzip: sum(chunks, 'gzip'),
    brotli: sum(chunks, 'brotli'),
    legacyParsed: sum(legacyChunks, 'parsed'),
    urls: modern,
  });
}

const ok = results.filter(r => !r.error);
// A chunk present on every single route is pure shared weight.
const everywhere = ok.length
  ? ok[0].urls.filter(u => ok.every(r => r.urls.includes(u)))
  : [];
const sharedOf = (k) => everywhere.reduce((n, u) => n + sizeCache.get(u)[k], 0);

if (asJson) {
  console.log(JSON.stringify({ base, results, everywhere }, null, 2));
} else {
  console.log(`\nJavaScript per route — ${base}`);
  console.log('(modern browsers only; noModule polyfills reported separately)\n');
  console.log(`${'ROUTE'.padEnd(38)} ${'CHUNKS'.padStart(6)} ${'BROTLI'.padStart(9)} ${'GZIP'.padStart(9)} ${'PARSED'.padStart(9)}`);
  console.log('-'.repeat(76));
  for (const r of results) {
    if (r.error) { console.log(`${r.route.padEnd(38)} ${r.error}`); continue; }
    console.log(`${r.route.padEnd(38)} ${String(r.chunks).padStart(6)} ${KB(r.brotli).padStart(9)} ${KB(r.gzip).padStart(9)} ${KB(r.parsed).padStart(9)}`);
  }
  console.log('-'.repeat(76));
  const legacy = ok[0]?.legacyParsed ?? 0;
  if (legacy) console.log(`\nnoModule polyfills (legacy browsers only): ${KB(legacy)} parsed — not in the numbers above`);
  console.log(`\nShared by EVERY route: ${everywhere.length} chunks, ${KB(sharedOf('brotli'))} brotli / ${KB(sharedOf('parsed'))} parsed`);
  for (const u of everywhere) {
    const c = sizeCache.get(u);
    console.log(`  ${KB(c.brotli).padStart(9)} br / ${KB(c.parsed).padStart(9)} raw  ${u}`);
  }
  const marketing = ok.filter(r => !['/app', '/coach'].includes(r.route));
  if (marketing.length) {
    const worst = marketing.reduce((a, b) => (b.parsed > a.parsed ? b : a));
    console.log(`\nHeaviest marketing route: ${worst.route} at ${KB(worst.brotli)} brotli / ${KB(worst.parsed)} parsed`);
  }
}
