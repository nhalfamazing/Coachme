import { cookies } from "next/headers";
import Link from "next/link";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth";
import { overviewCounts } from "./_lib/data";

export const dynamic = "force-dynamic";

function LoginForm({ error }: { error: boolean }) {
  return (
    <div style={{ maxWidth: 380, margin: "10vh auto 0" }}>
      <div className="adm-card">
        <h1 className="display" style={{ fontSize: 28, margin: "0 0 6px", textTransform: "uppercase" }}>
          Admin access
        </h1>
        <p className="adm-muted body" style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>
          Enter the admin secret to open the moderation console.
        </p>
        {error && (
          <p style={{
            fontSize: 12.5, padding: "9px 12px", borderRadius: 8, margin: "0 0 12px",
            background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.4)", color: "#FF8888",
          }}>
            That secret isn't right.
          </p>
        )}
        <form method="post" action="/api/admin/login" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="adm-input body" type="password" name="secret"
            placeholder="Admin secret" autoComplete="off" required
            style={{ width: "100%", padding: "11px 12px", fontSize: 14 }}
          />
          <button className="adm-btn adm-btn--ok body" type="submit" style={{ padding: "11px 16px", fontSize: 13.5 }}>
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  const authed = await verifyAdminCookie(jar.get(ADMIN_COOKIE)?.value);
  if (!authed) {
    const sp = await searchParams;
    return <LoginForm error={sp.error === "1"} />;
  }

  const counts = await overviewCounts();
  if (counts.state === "no-cloud") {
    return (
      <div className="adm-card body" style={{ fontSize: 13.5 }}>
        Cloud database isn't configured in this environment, so there is nothing to review here.
      </div>
    );
  }

  const stat = (label: string, value: number | null, href?: string) => (
    <div className="adm-stat">
      <b>{value === null ? "—" : value}</b>
      <span className="adm-muted body" style={{ fontSize: 12 }}>
        {label}{value === null ? " (awaiting migration)" : ""}
      </span>
      {href && value !== null && value > 0 && (
        <div style={{ marginTop: 8 }}>
          <Link href={href} className="body" style={{ fontSize: 12, color: "#38BDF8" }}>Review →</Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 16px", textTransform: "uppercase" }}>Overview</h1>
      <div className="adm-grid">
        {stat("Pending message flags", counts.pendingFlags, "/admin/flags")}
        {stat("Open reports", counts.openReports, "/admin/reports")}
        {stat("Coaches awaiting verification", counts.pendingCoaches, "/admin/coaches")}
        {stat("Athletes", counts.athletes)}
        {stat("Coaches", counts.coaches)}
      </div>
    </>
  );
}
