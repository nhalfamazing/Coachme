// Viewport screenshot tool for the responsive retrofit.
//
//   node scripts/screenshot.mjs <url> [options]
//
// Options:
//   --widths 390,768,1024,1440   viewport widths to capture (default all four)
//   --out landing                filename prefix; files land in .screenshots/
//   --seed                       seed a signed-in test athlete into localStorage
//   --tab trainers               click a bottom-nav/sidebar tab after load
//   --click "Some text"          click element(s) by visible text after load
//                                (repeatable; runs in order after --tab)
//   --tall                       use a 2400px-tall viewport to expose content
//                                below the fold of the app's internal scroller
//   --scroll "#selector"         scroll an element into view before capture
//                                (for mid-page marketing sections)
//
// The app scrolls inside its own container (not the document), so fullPage
// screenshots would not show below-the-fold content; --tall is the substitute.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
if (!url) {
  console.error('Usage: node scripts/screenshot.mjs <url> [--widths ...] [--out name] [--seed] [--tab name] [--click "text"] [--tall]');
  process.exit(1);
}

function opt(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}
const widths = opt('widths', '390,768,1024,1440').split(',').map(Number);
const out = opt('out', 'shot');
const seed = args.includes('--seed');
const tall = args.includes('--tall');
// --trial-expired seeds the drill free-month stamp 40 days back so the
// KoachMe Pro locked state renders.
const trialExpired = args.includes('--trial-expired');
// --click, --clickjs and --tab actions run in the order they appear on
// the command line. --clickjs clicks via the DOM (querySelector +
// element.click()) for elements Playwright's locators struggle with.
const actions = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--click') actions.push({ kind: 'click', value: args[i + 1] });
  if (args[i] === '--clickjs') actions.push({ kind: 'clickjs', value: args[i + 1] });
  if (args[i] === '--tab') actions.push({ kind: 'tab', value: args[i + 1] });
}
// --persona marketing renames the seeded athlete to an obviously-sample
// profile and seeds no coach, for product screenshots used on the
// marketing site (integrity rule: no invented coach names in marketing).
const persona = opt('persona', null);

// Realistic viewport heights per width tier (phone / tablet / desktop).
const HEIGHTS = { 390: 844, 768: 1024, 1024: 768, 1440: 900 };

const TEST_ATHLETE = {
  id: 424242,
  firstName: 'Test', lastName: 'Athlete',
  name: 'T. Athlete', initials: 'TA',
  sport: 'Baseball', position: 'Shortstop', age: 14,
  city: 'Miami', state: 'FL', location: 'Miami, FL',
  photo: null, banner: '/banner.jpg',
  stats: [
    { label: 'Exit Velo', value: 85, unit: 'mph', delta: null, pct: null, verified: 'self' },
    { label: '60 Yd Dash', value: 7.4, unit: 's', delta: null, pct: null, verified: 'self' },
    { label: 'Throw Velo', value: 74, unit: 'mph', delta: null, pct: null, verified: 'self' },
    { label: 'Pop Time', value: 2.2, unit: 's', delta: null, pct: null, verified: 'self' },
  ],
  level: 1, xp: 120, xpMax: 500,
  code: 'test-tiger-moon',
};
const TEST_WORKOUTS = [
  { id: 1, date: new Date().toISOString(), type: 'practice', duration: 90, intensity: 3, notes: 'Team practice, live at-bats.' },
  { id: 2, date: new Date(Date.now() - 86400000).toISOString(), type: 'strength', duration: 45, intensity: 4, notes: '' },
];
// A device-local coach so trainer detail / chat / booking flows render.
// Only ever seeded against a dev server running with cloud sync disabled.
const TEST_COACH = {
  id: 'test-coach-1', name: 'Sam Rivera', initials: 'SR',
  sport: 'Baseball', title: 'Hitting Coach', specialty: 'Exit velo development',
  location: 'Miami, FL', city: 'Miami', state: 'FL',
  rate: 60, rating: null, reviews: 0, athletes: 0, avgGain: null, commits: 0,
  modes: ['in_person', 'live_online', 'async'], badge: 'VERIFIED',
  bio: 'Former college infielder. Ten years coaching youth baseball in South Florida.',
  color: '#C5FF3D', cover: null, photo: null, years: 10,
  code: 'sam-coach-tiger', verified: true, pending: false,
};
// Availability mirror so the booking sheet derives real slots in the
// local-first path: Sat 10-12 in person, Mon 9-11 live online.
const TEST_WINDOWS = {
  'sam-coach-tiger': [
    { id: 'w-sat', weekday: 6, startMinute: 600, endMinute: 720, mode: 'in_person', locationNote: 'Tropical Park, field 3', active: true },
    { id: 'w-mon', weekday: 1, startMinute: 540, endMinute: 660, mode: 'live_online', locationNote: null, active: true },
  ],
};

const dir = resolve('.screenshots');
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const width of widths) {
    const height = tall ? 2400 : (HEIGHTS[width] || 900);
    const context = await browser.newContext({ viewport: { width, height } });
    if (seed) {
      const athlete = persona === 'marketing'
        ? { ...TEST_ATHLETE, firstName: 'Sample', lastName: 'Athlete', name: 'S. Athlete', initials: 'SA' }
        : TEST_ATHLETE;
      await context.addInitScript(({ athlete, workouts, coach, windows, expiredTrial }) => {
        localStorage.setItem('coachme_athlete', JSON.stringify(athlete));
        localStorage.setItem(`coachme_workouts::${athlete.id}`, JSON.stringify(workouts));
        if (coach) localStorage.setItem('coachme_coaches', JSON.stringify([coach]));
        if (coach && windows) localStorage.setItem('coachme_availability', JSON.stringify(windows));
        // One thread with an unread coach reply (messages inbox + chat).
        localStorage.setItem('coachme_threads', JSON.stringify([{
          id: `${athlete.id}::${coach.id}`, coachId: coach.id, coachName: coach.name,
          athlete: { id: athlete.id, name: athlete.name, initials: athlete.initials, sport: athlete.sport },
          messages: [
            { id: 1, from: 'athlete', text: 'Hey coach, can you check my swing this week?', ts: Date.now() - 7200000 },
            { id: 2, from: 'coach', text: 'Sure - send a clip from your next practice and we will go through it together.', ts: Date.now() - 3600000 },
          ],
          updatedAt: Date.now() - 3600000,
        }]));
        // One feed post by the athlete (composer + post card + like row).
        localStorage.setItem('coachme_posts', JSON.stringify([{
          id: 9001, authorId: athlete.id,
          author: { name: athlete.name, initials: athlete.initials, sport: athlete.sport, position: athlete.position, city: athlete.city, photo: null },
          text: 'New PR on exit velo today - 85 mph off the tee. Chasing 90 by fall.',
          ts: Date.now() - 5400000, likes: 3, liked: false,
        }]));
        localStorage.removeItem('coachme_signed_out');
        if (expiredTrial) {
          localStorage.setItem(`coachme_drills_trial::${athlete.id}`, new Date(Date.now() - 40 * 86400000).toISOString());
        }
      }, { athlete, workouts: TEST_WORKOUTS, coach: persona === 'marketing' ? null : TEST_COACH, windows: persona === 'marketing' ? null : TEST_WINDOWS, expiredTrial: trialExpired });
    }
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.goto(url));
    await page.waitForTimeout(1200);
    for (const action of actions) {
      if (action.kind === 'click') {
        // Exact text match first (so "Message" cannot hit the "Messages"
        // nav), falling back to substring; .last() prefers overlay content,
        // which renders after the app body. force: true skips the stability
        // check - cards scale down on mousedown (pressed state), which
        // otherwise loops the check forever.
        let loc = page.getByText(action.value, { exact: true }).last();
        if (await loc.count() === 0) loc = page.getByText(action.value, { exact: false }).last();
        await loc.click({ timeout: 5000, force: true }).catch(e => {
          console.error(`  [${width}] click "${action.value}" failed: ${e.message.split('\n')[0]}`);
        });
      } else if (action.kind === 'clickjs') {
        const hit = await page.evaluate((text) => {
          const t = text.toLowerCase();
          const els = [...document.querySelectorAll('button, a')];
          const el = els.find(e =>
            (e.innerText || '').toLowerCase().includes(t) ||
            (e.getAttribute('aria-label') || '').toLowerCase().includes(t));
          if (el) { el.click(); return true; }
          return false;
        }, action.value);
        if (!hit) console.error(`  [${width}] clickjs "${action.value}" found nothing`);
      } else {
        // Nav buttons have exactly the tab label as text (plus an optional
        // numeric unread badge); .last() skips same-named content buttons.
        const re = new RegExp(`^\\s*\\d*\\s*${action.value}\\s*\\d*\\s*$`, 'i');
        await page.locator('button').filter({ hasText: re }).last().click({ timeout: 5000, force: true }).catch(e => {
          console.error(`  [${width}] tab click "${action.value}" failed: ${e.message.split('\n')[0]}`);
        });
      }
      await page.waitForTimeout(700);
    }
    const scrollTo = opt('scroll', null);
    if (scrollTo) {
      await page.evaluate((sel) => {
        document.querySelector(sel)?.scrollIntoView({ block: 'start' });
      }, scrollTo);
      await page.waitForTimeout(400);
    }
    // Never capture half-loaded images: cold image-optimizer hits can
    // take seconds on first request, which reads as broken black cards.
    await page.waitForFunction(
      () => [...document.images].every(i => !i.src || i.complete),
      { timeout: 20000 },
    ).catch(() => console.error(`  [${width}] warning: images still loading at capture`));
    await page.waitForTimeout(300);
    const file = `${dir}/${out}-${width}${tall ? '-tall' : ''}.png`;
    await page.screenshot({ path: file });
    console.log(`saved ${file}`);
    await context.close();
  }
} finally {
  await browser.close();
}
