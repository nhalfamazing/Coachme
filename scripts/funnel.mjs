// Counts the real tap path from the marketing landing to a completed
// athlete signup. Each page.tap() below is one user tap; typing is not
// a tap. Fails loudly if any step is missing.
//
//   node scripts/funnel.mjs [url]

import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3000';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let taps = 0;
const tap = async (label, locator) => {
  taps += 1;
  await locator.click({ force: true, timeout: 8000 });
  console.log(`tap ${taps}: ${label}`);
  await page.waitForTimeout(600);
};

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 1: landing hero CTA
await tap('Get started free (landing)', page.getByText('Get started free', { exact: true }).first());
await page.waitForTimeout(1200);

// ?signup=1 must land directly on the name step (no welcome-screen tap)
await page.getByText('WHO ARE YOU?', { exact: false }).first().waitFor({ timeout: 8000 });

await page.getByPlaceholder('Noah').fill('Funnel');
await page.getByPlaceholder('Scarlett').fill('Test');
await tap('Continue (name)', page.getByText('Continue', { exact: true }).last());

await page.locator('select').nth(0).selectOption({ index: 1 });
await page.waitForTimeout(300);
await page.locator('select').nth(1).selectOption({ index: 1 });
await page.locator('select').nth(2).selectOption({ index: 9 });
await tap('Continue (sport)', page.getByText('Continue', { exact: true }).last());

await page.getByPlaceholder('Start typing your city').fill('Miami');
await tap('Continue (location)', page.getByText('Continue', { exact: true }).last());

await tap('Skip for now (stats)', page.getByText('Skip for now', { exact: true }).last());
await tap('Open my CoachMe', page.getByText('Open my CoachMe', { exact: true }).last());

await page.getByText('TRAINING LOG', { exact: false }).first().waitFor({ timeout: 8000 });
console.log(`\nFUNNEL COMPLETE in ${taps} taps (landing -> signed-in profile)`);
await browser.close();
