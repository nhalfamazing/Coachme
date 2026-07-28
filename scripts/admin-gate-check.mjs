// Verifies the /admin gate end to end against a local server.
// Reads ADMIN_SECRET from .env.local and NEVER prints it.
import { readFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
// Local overrides first (where the local-only test secret lives), then
// .env.local. The value is used for requests and never printed.
let SECRET = null;
for (const file of [".env.production.local", ".env.development.local", ".env.local"]) {
  try {
    const m = readFileSync(file, "utf8").match(/^ADMIN_SECRET=(.+)$/m);
    if (m && m[1].trim()) { SECRET = m[1].trim(); break; }
  } catch { /* file may not exist */ }
}
if (!SECRET) { console.log("FAIL: no ADMIN_SECRET found in env files"); process.exit(1); }

let pass = 0, fail = 0;
const check = (name, ok) => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"} ${name}`); };

// 1. Unauthed /admin shows the login form, not the console.
const r1 = await fetch(`${base}/admin`);
const t1 = await r1.text();
check("unauthed /admin -> login form", r1.status === 200 && t1.includes("Admin access") && !t1.includes("Pending message flags"));

// 2. Unauthed /admin/flags redirects to /admin.
const r2 = await fetch(`${base}/admin/flags`, { redirect: "manual" });
check("unauthed /admin/flags -> redirect", r2.status >= 300 && r2.status < 400 && (r2.headers.get("location") || "").includes("/admin"));

// 3. Unauthed admin API -> 401.
const r3 = await fetch(`${base}/api/admin/flags/some-id`, { method: "POST", body: new FormData() });
check("unauthed admin API -> 401", r3.status === 401);

// 4. Wrong secret -> bounced back with error, no cookie.
const wrongForm = new URLSearchParams({ secret: "definitely-not-the-secret" });
const r4 = await fetch(`${base}/api/admin/login`, {
  method: "POST", body: wrongForm, redirect: "manual",
  headers: { "content-type": "application/x-www-form-urlencoded" },
});
const loc4 = r4.headers.get("location") || "";
const cookie4 = r4.headers.get("set-cookie") || "";
check("wrong secret -> error bounce, no cookie", loc4.includes("error=1") && !cookie4.includes("coachme_admin="));

// 5. Right secret -> cookie + bounce to console.
const rightForm = new URLSearchParams({ secret: SECRET });
const r5 = await fetch(`${base}/api/admin/login`, {
  method: "POST", body: rightForm, redirect: "manual",
  headers: { "content-type": "application/x-www-form-urlencoded" },
});
const setCookie = r5.headers.get("set-cookie") || "";
const cookieVal = (setCookie.match(/coachme_admin=([^;]+)/) || [])[1];
check("right secret -> signed cookie set", Boolean(cookieVal) && (r5.headers.get("location") || "").endsWith("/admin"));

// 6. Cookie opens the console.
const r6 = await fetch(`${base}/admin`, { headers: { cookie: `coachme_admin=${cookieVal}` } });
const t6 = await r6.text();
check("cookie -> console (overview or no-cloud panel)", r6.status === 200 && !t6.includes("Admin access") && (t6.includes("Overview") || t6.includes("isn't configured")));

// 7. Tampered cookie is rejected.
const tampered = cookieVal ? cookieVal.replace(/.$/, c => (c === "0" ? "1" : "0")) : "x.y";
const r7 = await fetch(`${base}/admin/flags`, { redirect: "manual", headers: { cookie: `coachme_admin=${tampered}` } });
check("tampered cookie -> rejected", r7.status >= 300 && r7.status < 400);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
