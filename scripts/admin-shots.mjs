// Screenshots of the admin console: the login page (signed out) and each
// queue view (signed in).
//
//   node scripts/admin-shots.mjs [baseUrl]
//
// Signing in for a screenshot does NOT go through the email round trip: that
// would need a real inbox, and it would put a live magic-link token inside a
// screenshotting script. Instead this mints the session cookie the server
// would have issued, using ADMIN_SESSION_SECRET, which it reads and never
// prints. The gate itself is verified separately by admin-gate-check.mjs.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const base = process.argv[2] || "http://localhost:3000";

let KEY = null;
for (const file of [".env.production.local", ".env.development.local", ".env.local"]) {
  try {
    const m = readFileSync(file, "utf8").match(/^ADMIN_SESSION_SECRET=(.+)$/m);
    if (m && m[1].trim()) { KEY = m[1].trim(); break; }
  } catch { /* skip */ }
}

// Must match src/lib/admin-allowlist.ts.
const ADMIN_EMAIL = "rscarlett@netaesthetics.com";

function sessionCookie() {
  const payload = `${ADMIN_EMAIL}.${Date.now() + 60 * 60 * 1000}`;
  return `${payload}.${createHmac("sha256", KEY).update(payload).digest("hex")}`;
}

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: width <= 480 ? 844 : 900 } });
  const page = await context.newPage();

  // Signed out: the login page, and the state after asking for a link.
  await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.screenshots/adm-login-${width}.png` });
  await page.goto(`${base}/admin/login?status=sent`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.screenshots/adm-login-sent-${width}.png` });

  if (KEY) {
    const { hostname } = new URL(base);
    await context.addCookies([{
      name: "coachme_admin", value: sessionCookie(),
      domain: hostname, path: "/", httpOnly: true, sameSite: "Strict",
    }]);
    const views = [["", "overview"], ["/flags", "flags"], ["/reports", "reports"], ["/coaches", "coaches"], ["/audit", "audit"]];
    for (const [view, file] of views) {
      await page.goto(`${base}/admin${view}`, { waitUntil: "networkidle" });
      await page.screenshot({ path: `.screenshots/adm-${file}-${width}.png` });
    }
  } else {
    console.log("no ADMIN_SESSION_SECRET found: signed-out screenshots only");
  }
  await context.close();
}
await browser.close();
console.log("admin screenshots saved");
