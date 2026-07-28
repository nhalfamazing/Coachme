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

// 2. Coach Vega filter -> she has no drills in the manifest today, so
// the empty state must show (and zero cards).
await page.locator('button').filter({ hasText: /COACH VEGA/ }).first().click({ force: true });
await page.waitForTimeout(400);
titles = await cardTitles();
const emptyVisible = await page.getByText('No drills here yet. More coming.').isVisible().catch(() => false);
check(
  'Coach Vega filter shows only her drills (zero) + empty state',
  titles.length === 0 && emptyVisible,
  `cards: ${titles.length}, empty state visible: ${emptyVisible}`,
);
await page.locator('button').filter({ hasText: /COACH VEGA/ }).first().click({ force: true });
await page.waitForTimeout(300);

// 3. Search "sprint".
await page.getByPlaceholder('Search drills').fill('sprint');
await page.waitForTimeout(400);
titles = await cardTitles();
check(
  'search "sprint" finds Sprint start only',
  titles.length === 1 && titles[0] === 'SPRINT START',
  `saw: ${titles.join(', ') || '(none)'}`,
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
