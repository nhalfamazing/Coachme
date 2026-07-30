import Link from "next/link";
import { overviewCounts } from "./_lib/data";

export const dynamic = "force-dynamic";

// No login form here any more: signing in lives at /admin/login, and the
// middleware guarantees nobody unauthenticated reaches this page.
export default async function AdminHome() {
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
