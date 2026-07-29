/* Scripted checks for the drill library discovery UX and the landing
   samples section. Run against a server on localhost:3000 (production
   build). Exit 0 = all pass.

   Checks:
   1. Library: FOOTBALL sport chip -> only football drills shown.
   2. Library: Coach Vega chip -> only her drills (today that is zero,
      so the honest empty state must render).
   3. Library: search "sprint" -> finds Sprint start, nothing else.
   4. Landing: no .mp4 network request before tapping a sample; the
      demo mp4 loads only after the tap. */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Expectations derive from the generated library, never hardcoded, so
// these checks keep working as the manifest grows.
const drillsTs = readFileSync(fileURLToPath(new URL('../src/lib/drills.ts', import.meta.url)), 'utf8');
const DEMO_URLS = [...drillsTs.matchAll(/demo: \{ cdn: "[^"]*", blob: "([^"]+)" \}/g)].map(m => m[1]);
const TOTAL_DRILLS = DEMO_URLS.length;

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.error(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem('coachme_athlete', JSON.stringify({
    id: 424242, firstName: 'Test', lastName: 'Athlete', name: 'T. Athlete', initials: 'TA',
    sport: 'Baseball', position: 'Shortstop', age: 14, city: 'Miami', state: 'FL',
    location: 'Miami, FL', photo: null, banner: '/banner.jpg', stats: [],
    level: 1, xp: 120, xpMax: 500, code: 'test-tiger-moon',
  }));
  localStorage.removeItem('coachme_signed_out');
});

/* ---------- library checks ---------- */
// LANDING_ONLY=1 skips the library section: it seeds a signed-in
// athlete, which the app syncs to the cloud registry - never do that
// against production. Landing checks are read-only.
if (!process.env.LANDING_ONLY) {
const page = await context.newPage();
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.getByText('Test Athlete', { exact: false }).first().click({ force: true });
await page.waitForTimeout(700);
const trainersTab = page.locator('button').filter({ hasText: /^\s*Trainers\s*\d*\s*$/i }).last();
await trainersTab.click();
await page.waitForTimeout(700);

const cardTitles = async () =>
  page.locator('.drill-grid button .display').allInnerTexts();

// 1. Football filter.
await page.locator('button').filter({ hasText: /FOOTBALL/ }).first().click({ force: true });
await page.waitForTimeout(400);
let titles = await cardTitles();
const footballSet = ['CATCH TRIANGLE', 'THREE-POINT STANCE'];
check(
  'football filter shows only football drills',
  titles.length === 2 && footballSet.every(t => titles.includes(t)),
  `saw: ${titles.join(', ') || '(none)'}`,
);

// Reset to All.
await page.locator('button').filter({ hasText: /^ALL\s*\d+$/ }).first().click({ force: true });
await page.waitForTimeout(400);

// 2. Softball filter -> exactly the two softball drills. Softball is
// the newest sport and needed no code change to appear, so this also
// guards the manifest-driven sport config.
await page.locator('button').filter({ hasText: /SOFTBALL/ }).first().click({ force: true });
await page.waitForTimeout(400);
titles = await cardTitles();
const softballSet = ['WINDMILL PITCHING', 'SOFT TOSS'];
check(
  'softball filter shows exactly the 2 softball drills',
  titles.length === 2 && softballSet.every(t => titles.includes(t)),
  `saw: ${titles.join(', ') || '(none)'}`,
);
await page.locator('button').filter({ hasText: /^ALL\s*\d+$/ }).first().click({ force: true });
await page.waitForTimeout(400);

// 3. Coach filter sheet: every coach listed exactly once with a count,
// and Koach Nia resolves to her four drills (one Nia row, not two -
// she must never be duplicated into a second coach record).
await page.locator('button').filter({ hasText: /COACH · ANY/ }).first().click({ force: true });
await page.waitForTimeout(400);
const sheetRows = await page.locator('[role="dialog"] button').allInnerTexts();
const coachRows = sheetRows.filter(r => !/ALL COACHES/i.test(r));
const niaRows = sheetRows.filter(r => /KOACH NIA/i.test(r));
check(
  'coach sheet lists every coach once with a drill count',
  coachRows.length === 7 && coachRows.every(r => /\d+ DRILLS?/.test(r)),
  `coach rows: ${coachRows.length} (expected 7)`,
);
check(
  'exactly one Koach Nia entry in the coach sheet',
  niaRows.length === 1,
  `Nia rows: ${niaRows.length} — ${niaRows.join(' | ')}`,
);
check(
  'coach sheet reports 4 drills for Koach Nia',
  /\b4 DRILLS\b/.test(niaRows[0] ?? ''),
  `row: ${niaRows[0] ?? '(none)'}`,
);
await page.locator('[role="dialog"] button').filter({ hasText: /KOACH NIA/i }).first().click({ force: true });
await page.waitForTimeout(400);
titles = await cardTitles();
check(
  'Koach Nia filter shows her 4 drills',
  titles.length === 4,
  `saw ${titles.length}: ${titles.join(', ') || '(none)'}`,
);
await page.locator('button[aria-label="Clear coach filter"]').click({ force: true });
await page.waitForTimeout(300);

// 4. Search "sprint".
await page.getByPlaceholder('Search drills').fill('sprint');
await page.waitForTimeout(400);
titles = await cardTitles();
check(
  'search "sprint" finds Sprint start only',
  titles.length === 1 && titles[0] === 'SPRINT START',
  `saw: ${titles.join(', ') || '(none)'}`,
);
await page.getByPlaceholder('Search drills').fill('');
await page.waitForTimeout(500);

// 5. Every card in the full grid renders a real decoded poster (a
// broken or 404 image decodes to naturalWidth 0).
const posterStats = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll('.drill-grid button img')];
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = r; i.onerror = r; })));
  // Two imgs per card: the poster and the coach avatar.
  const posters = imgs.filter(i => i.getAttribute('src')?.includes('poster'));
  return { cards: document.querySelectorAll('.drill-grid > button').length, posters: posters.length, broken: posters.filter(i => !i.naturalWidth).length };
});
check(
  'every drill card shows a decoded poster',
  posterStats.cards === TOTAL_DRILLS && posterStats.posters === TOTAL_DRILLS && posterStats.broken === 0,
  `cards: ${posterStats.cards}, posters: ${posterStats.posters}, broken: ${posterStats.broken}`,
);

// 6. Every drill's demo clip actually plays: load each served Blob URL
// into a video element and require currentTime to advance past zero.
const playback = await page.evaluate(async (urls) => {
  const results = [];
  for (const url of urls) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = url;
    document.body.appendChild(v);
    let ok = false;
    let note = '';
    try {
      await new Promise((res, rej) => {
        v.onloadeddata = res;
        v.onerror = () => rej(new Error(`media error ${v.error?.code ?? '?'}`));
        setTimeout(() => rej(new Error('timeout loading')), 20000);
      });
      await v.play();
      await new Promise(r => setTimeout(r, 350));
      ok = v.currentTime > 0;
      if (!ok) note = 'currentTime did not advance';
    } catch (e) {
      note = String(e.message ?? e);
    }
    v.pause();
    v.remove();
    results.push({ url: url.split('/').slice(-2).join('/'), ok, note });
  }
  return results;
}, DEMO_URLS);
const unplayable = playback.filter(r => !r.ok);
check(
  'every drill demo clip plays',
  playback.length === TOTAL_DRILLS && unplayable.length === 0,
  `played ${playback.length - unplayable.length}/${playback.length}${unplayable.length ? ` — failed: ${unplayable.map(u => `${u.url} (${u.note})`).join(', ')}` : ''}`,
);
await page.close();
}

/* ---------- landing network assertion ---------- */
const lp = await context.newPage();
const mp4Requests = [];
lp.on('request', req => {
  if (req.url().includes('.mp4')) mp4Requests.push(req.url());
});
await lp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await lp.waitForTimeout(1200);
const before = mp4Requests.length;
check('landing loads zero mp4 bytes before interaction', before === 0, `mp4 requests: ${before}`);

const posterVisible = await lp.locator('.mk-drill-play img').first().isVisible();
check('landing sample shows a poster image', posterVisible);

await lp.locator('.mk-drill-play').first().click();
await lp.waitForTimeout(2500);
const after = mp4Requests.length;
check(
  'tapping a sample loads exactly its demo clip',
  after >= 1 && mp4Requests.every(u => u.includes('/demo.mp4')),
  `mp4 requests after tap: ${after} (${mp4Requests.map(u => u.split('/').slice(-2).join('/')).join(', ')})`,
);

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
process.exit(failed.length ? 1 : 0);
