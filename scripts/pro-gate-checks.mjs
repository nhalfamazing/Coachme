/* KoachMe Pro drill-gate checks against a production build on
   localhost:3000. Exit 0 = all pass.

   Fresh profile: FIRST MONTH FREE chip, drills play, opening a drill
   starts the 30-day clock (chip flips to DAYS LEFT).
   Expired profile (trial stamp seeded 40 days back): PRO chip, locked
   cards, drill sheet shows the honest lock screen with ZERO video
   elements, everything-else-free line and AI disclosure visible. */

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

  const chipBefore = await page.getByText('FIRST MONTH FREE').count();
  check('fresh: FIRST MONTH FREE chip shown', chipBefore === 1);

  await page.getByText('Tee Work', { exact: false }).first().click({ force: true });
  await page.waitForTimeout(800);
  const videos = await page.locator('video').count();
  check('fresh: drill sheet has both videos', videos === 2, `videos=${videos}`);
  const stamp = await page.evaluate((id) => localStorage.getItem(`coachme_drills_trial::${id}`), ATHLETE.id);
  check('fresh: opening a drill starts the clock', !!stamp, `stamp=${stamp?.slice(0, 10)}`);
  await page.mouse.click(8, 8);
  await page.waitForTimeout(500);
  const daysLeft = await page.getByText(/FREE MONTH · \d+ DAYS? LEFT/).count();
  check('fresh: chip flips to days-left after first open', daysLeft === 1);
  await context.close();
}

/* ---------- expired profile ---------- */
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

  const proChip = await page.getByText(/PRO · \$9\/MO/).count();
  check('expired: PRO $9/MO markers shown', proChip >= 1, `count=${proChip}`);

  await page.getByText('Tee Work', { exact: false }).first().click({ force: true });
  await page.waitForTimeout(800);
  const videos = await page.locator('video').count();
  check('expired: zero video elements in locked sheet', videos === 0, `videos=${videos}`);
  const lockCopy = await page.getByText('YOUR FREE MONTH IS').count();
  check('expired: lock screen copy shown', lockCopy === 1);
  const freeLine = await page.getByText('STAY FREE', { exact: false }).count();
  check('expired: everything-else-free line shown', freeLine >= 1);
  const disclosure = await page.getByText('This coach is AI-generated', { exact: false }).count();
  check('expired: AI disclosure still visible', disclosure === 1);
  await context.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length }, null, 2));
process.exit(failed.length ? 1 : 0);
