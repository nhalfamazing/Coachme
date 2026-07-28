import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Plain, functional console reusing the coach-console palette. Server
// components throughout; forms post to /api/admin/*.
const adminStyles = `
  .display { font-family: var(--font-display), 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
  .body { font-family: var(--font-body), 'Manrope', system-ui, sans-serif; }
  .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  .adm { background: #080D14; color: #E8ECF1; min-height: 100vh; }
  .adm a { color: inherit; }
  .adm-head { display: flex; align-items: center; gap: 18px; padding: 14px 20px; border-bottom: 1px solid #1B2634; flex-wrap: wrap; }
  .adm-nav { display: flex; gap: 4px; flex-wrap: wrap; }
  .adm-nav a { text-decoration: none; font-size: 13px; font-weight: 600; color: #8FA0B3; padding: 7px 12px; border-radius: 8px; }
  .adm-nav a:hover { color: #E8ECF1; background: #111A26; }
  .adm-wrap { max-width: 1000px; margin: 0 auto; padding: 24px 20px 80px; }
  .adm-card { background: #0D1520; border: 1px solid #1B2634; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .adm-muted { color: #8FA0B3; }
  .adm-faint { color: #5A6B7E; }
  .adm-tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; }
  .adm-btn { border: none; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .adm-btn--ok { background: #1E3A2A; color: #7DDFA0; border: 1px solid #2C5A3E; }
  .adm-btn--warn { background: #3A2A1E; color: #FFB347; border: 1px solid #5A452C; }
  .adm-btn--danger { background: #3A1E1E; color: #FF8888; border: 1px solid #5A2C2C; }
  .adm-btn--plain { background: #111A26; color: #C7D2DE; border: 1px solid #1B2634; }
  .adm-input { background: #111A26; border: 1px solid #1B2634; border-radius: 8px; color: #E8ECF1; padding: 8px 10px; font-size: 12.5px; font-family: inherit; }
  .adm-msg { border: 1px solid #1B2634; border-radius: 10px; padding: 8px 12px; margin: 4px 0; font-size: 13px; line-height: 1.5; }
  .adm-msg--flagged { border-color: #FFB347; background: rgba(255, 179, 71, 0.06); }
  .adm-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
  .adm-stat { background: #0D1520; border: 1px solid #1B2634; border-radius: 12px; padding: 16px; }
  .adm-stat b { display: block; font-size: 30px; line-height: 1; margin-bottom: 6px; font-family: var(--font-display), sans-serif; }
`;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const authed = await verifyAdminCookie(jar.get(ADMIN_COOKIE)?.value);

  return (
    <div className="adm body">
      <style>{adminStyles}</style>
      <header className="adm-head">
        <span className="display" style={{ fontSize: 22 }}>
          KOACH<span style={{ color: "#38BDF8" }}>ME</span> <span className="adm-muted" style={{ fontSize: 16 }}>ADMIN</span>
        </span>
        {authed && (
          <>
            <nav className="adm-nav" aria-label="Admin">
              <Link href="/admin">Overview</Link>
              <Link href="/admin/flags">Flags</Link>
              <Link href="/admin/reports">Reports</Link>
              <Link href="/admin/coaches">Coaches</Link>
            </nav>
            <form method="post" action="/api/admin/logout" style={{ marginLeft: "auto" }}>
              <button className="adm-btn adm-btn--plain body" type="submit">Log out</button>
            </form>
          </>
        )}
      </header>
      <main className="adm-wrap">{children}</main>
    </div>
  );
}
