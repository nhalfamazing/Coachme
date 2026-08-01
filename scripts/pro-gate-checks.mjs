/* Drill-gate checks against a production build on localhost:3000.
   Exit 0 = all pass.

   WHAT THIS USED TO CHECK: that a 30-day trial expired and locked the
   drill videos behind a "PRO · $9/MO" screen. That gate is off. KoachMe is
   free during beta, founding members keep the drill library free, and
   drillTrialState() forces `expired` false while OFFER.PRICING_LAUNCHED is
   false.

   WHAT IT CHECKS NOW: that nothing expires. A profile whose trial stamp is
   40 days old — which under the old rule was locked — sees exactly what a
   fresh profile sees, and no price string appears anywhere in the app. The
   old script asserted the bug; this one asserts it stays fixed.

   ASSERTIONS ARE ON THE LIBRARY GRID, NOT THE DRILL SHEET. The old script
   clicked a drill title and counted <video> elements in the sheet. That
   never worked: the sheet does not open under this harness, so those
   checks passed vacuously from the day they were written. The card badge
   ("INTRO + DEMO" vs "LOCKED") is driven by the same `trial.expired` flag
   the sheet is, is genuinely observable here, and is what this change
   actually controls. Getting the sheet to open under Playwright is its own
   piece of work. */

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.error(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const ATHLETE = {
  id: 424242, firstName: 'Test', lastName: 'Athlete', name: 'T. Athlete', initials: 'TA',
  sport: 'Baseball', position: 'Shortstop', age: 14, city: 'Miami', state: 'FL',
  location: 'Miami, FL', photo: null, banner: '/banner.jpg', stats: [],
  level: 1, xp: 120, xpMax: 500, code: 'test-tiger-moon',
};

/* Any way a price could reach the screen. None of these may ever match. */
const PRICE_RE = /\$\s?\d|\d+\s?\/\s?MO\b|\b\d+ (a|per) month\b|FIRST MONTH FREE|FREE MONTH ·/i;

const browser = await chromium.launch();

async function openLibrary(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.getByText('Test Athlete', { exact: false }).first().click({ force: true });
  await page.waitForTimeout(600);
  await page.locator('button').filter({ hasText: /^\s*\d*\s*Trainers\s*\d*\s*$/i }).last().click({ force: true });
  await page.waitForTimeout(600);
  return page;
}

/* ---------- fresh profile ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((athlete) => {
    localStorage.setItem('coachme_athlete', JSON.stringify(athlete));
    localStorage.removeItem('coachme_signed_out');
  }, ATHLETE);
  const page = await openLibrary(context);

  const chip = await page.getByText('FREE DURING BETA').count();
  check('fresh: FREE DURING BETA chip shown', chip === 1, `count=${chip}`);

  const playable = await page.getByText('INTRO + DEMO').count();
  const locked = await page.getByText('LOCKED').count();
  check('fresh: every drill card playable', playable > 0 && locked === 0,
    `playable=${playable} locked=${locked}`);

  const body = await page.evaluate(() => document.body.innerText);
  check('fresh: no price anywhere in the app', !PRICE_RE.test(body),
    PRICE_RE.exec(body)?.[0] ?? '');
  check('fresh: no countdown language', !/DAYS? LEFT/i.test(body));
  await context.close();
}

/* ---------- profile whose trial stamp is 40 days old ---------- */
/* Under the old rule this was locked. It must not be. Real users have this
   stamp in localStorage from before the gate was turned off, and they were
   promised the library stays free. */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((athlete) => {
    localStorage.setItem('coachme_athlete', JSON.stringify(athlete));
    localStorage.setItem(
      `coachme_drills_trial::${athlete.id}`,
      new Date(Date.now() - 40 * 86400000).toISOString(),
    );
    localStorage.removeItem('coachme_signed_out');
  }, ATHLETE);
  const page = await openLibrary(context);

  const chip = await page.getByText('FREE DURING BETA').count();
  check('40-day-old stamp: still FREE DURING BETA', chip === 1, `count=${chip}`);

  const playable = await page.getByText('INTRO + DEMO').count();
  const locked = await page.getByText('LOCKED').count();
  check('40-day-old stamp: nothing locked, cards still playable',
    playable > 0 && locked === 0, `playable=${playable} locked=${locked}`);

  const body = await page.evaluate(() => document.body.innerText);
  check('40-day-old stamp: no lock or expiry language',
    !/LOCKED|FREE MONTH IS|DAYS? LEFT/i.test(body));
  check('40-day-old stamp: no price anywhere', !PRICE_RE.test(body),
    PRICE_RE.exec(body)?.[0] ?? '');

  const disclosure = await page.getByText('AI COACH', { exact: false }).count();
  check('40-day-old stamp: AI disclosure still visible', disclosure >= 1,
    `count=${disclosure}`);
  await context.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length }, null, 2));
process.exit(failed.length ? 1 : 0);
