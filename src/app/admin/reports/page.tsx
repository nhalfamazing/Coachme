import { openReports, reportContext } from "../_lib/data";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  uncomfortable: "Made them uncomfortable",
  personal_info: "Asked for personal info",
  move_off_platform: "Asked to move off CoachMe",
  other: "Something else",
};

function Who({ p, label }: { p: any; label: string }) {
  if (!p) return null;
  return (
    <div className="body" style={{ fontSize: 12.5 }}>
      <span className="adm-faint mono" style={{ fontSize: 10, letterSpacing: "0.08em" }}>{label} </span>
      {p.first_name} {p.last_name}
      <span className="adm-muted">
        {" "}· {p.role}{p.age ? ` · age ${p.age}` : ""}{p.city ? ` · ${p.city}` : ""}
        {" "}· {p.verification_status}{p.banned === true ? " · BANNED" : ""}
      </span>
    </div>
  );
}

export default async function ReportsQueue() {
  const reports = await openReports();

  if (reports.state === "no-cloud") {
    return <div className="adm-card body" style={{ fontSize: 13.5 }}>Cloud database isn't configured in this environment.</div>;
  }
  if (reports.state === "no-tables") {
    return (
      <div className="adm-card body" style={{ fontSize: 13.5 }}>
        The trust &amp; safety migration hasn't been applied yet, so there are no reports to read.
      </div>
    );
  }

  const items = [];
  for (const report of reports.rows) {
    items.push({ report, ctx: await reportContext(report) });
  }

  return (
    <>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 6px", textTransform: "uppercase" }}>Reports</h1>
      <p className="adm-muted body" style={{ fontSize: 13, margin: "0 0 18px" }}>
        {reports.rows.length === 0 ? "No open reports." : `${reports.rows.length} open report${reports.rows.length === 1 ? "" : "s"}, oldest first.`}
      </p>

      {items.map(({ report, ctx }) => (
        <div key={report.id} className="adm-card">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <span className="adm-tag mono" style={{ background: "#3A1E1E", color: "#FF8888" }}>
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            <span className="adm-faint mono" style={{ fontSize: 11, marginLeft: "auto" }}>
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>

          {ctx && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
              <Who p={ctx.reporter} label="REPORTER" />
              <Who p={ctx.subject} label="REPORTED" />
            </div>
          )}

          {report.details && (
            <p className="body" style={{
              fontSize: 13, lineHeight: 1.5, margin: "0 0 10px", padding: "8px 12px",
              borderLeft: "3px solid #38BDF8", background: "#111A26", borderRadius: 6,
            }}>
              &quot;{report.details}&quot;
            </p>
          )}

          {ctx && ctx.messages.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <div className="adm-faint mono" style={{ fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>
                CAPTURED CONVERSATION CONTEXT ({ctx.messages.length} MESSAGES)
              </div>
              {ctx.messages.map((m: any) => (
                <div key={m.id} className="adm-msg body">
                  <span className="adm-faint mono" style={{ fontSize: 10, letterSpacing: "0.06em" }}>
                    {m.sender_role.toUpperCase()}{m.hidden === true ? " · HIDDEN" : ""} ·{" "}
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                  <div>{m.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="adm-muted body" style={{ fontSize: 12.5, marginBottom: 12 }}>
              No captured conversation context (the pair may not have a server-side thread).
            </p>
          )}

          <form method="post" action={`/api/admin/reports/${report.id}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="adm-btn adm-btn--ok body" name="action" value="resolve_ok" type="submit">Resolve (no action)</button>
            <button className="adm-btn adm-btn--danger body" name="action" value="remove_ban" type="submit">Ban reported profile</button>
            <input className="adm-input body" name="reason" placeholder="Reason (kept on record)" style={{ flex: 1, minWidth: 160 }} />
          </form>
        </div>
      ))}
    </>
  );
}
