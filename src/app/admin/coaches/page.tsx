import { pendingCoaches } from "../_lib/data";

export const dynamic = "force-dynamic";

const FIELD_LABELS: Array<[string, string]> = [
  ["sport", "Sport"],
  ["specialty", "Specialty"],
  ["years_coaching", "Years coaching"],
  ["years_pro", "Years pro"],
  ["city", "City"],
  ["state", "State"],
  ["background", "Background"],
  ["code", "Login code"],
  ["created_at", "Applied"],
];

export default async function CoachQueue() {
  const coaches = await pendingCoaches();

  if (coaches.state === "no-cloud") {
    return <div className="adm-card body" style={{ fontSize: 13.5 }}>Cloud database isn't configured in this environment.</div>;
  }

  const rows = coaches.state === "ok" ? coaches.rows : [];

  return (
    <>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 6px", textTransform: "uppercase" }}>Coach verification</h1>
      <p className="adm-muted body" style={{ fontSize: 13, margin: "0 0 18px" }}>
        {rows.length === 0
          ? "No coaches waiting. Every pending badge in the app corresponds to a row here."
          : `${rows.length} coach${rows.length === 1 ? "" : "es"} awaiting review. Approve makes the profile verified in the athlete app; reject keeps them out of verified surfaces.`}
      </p>

      {rows.map((c: any) => (
        <div key={c.id} className="adm-card">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <span className="display" style={{ fontSize: 20 }}>{c.first_name} {c.last_name}</span>
            <span className="adm-tag mono" style={{ background: "#2A2A1E", color: "#E8DF7A" }}>pending</span>
            {c.banned === true && <span className="adm-tag mono" style={{ background: "#3A1E1E", color: "#FF8888" }}>banned</span>}
            {c.rate_cents != null && (
              <span className="adm-muted body" style={{ fontSize: 12.5 }}>${(c.rate_cents / 100).toFixed(0)}/hr</span>
            )}
            {Array.isArray(c.modes) && c.modes.length > 0 && (
              <span className="adm-muted body" style={{ fontSize: 12.5 }}>{c.modes.join(", ")}</span>
            )}
          </div>

          <dl className="body" style={{ margin: "0 0 12px", display: "grid", gridTemplateColumns: "150px 1fr", gap: "4px 10px", fontSize: 12.5 }}>
            {FIELD_LABELS.map(([key, label]) => (
              c[key] != null && c[key] !== "" ? (
                <div key={key} style={{ display: "contents" }}>
                  <dt className="adm-faint mono" style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</dt>
                  <dd style={{ margin: 0 }}>{key === "created_at" ? new Date(c[key]).toLocaleString() : String(c[key])}</dd>
                </div>
              ) : null
            ))}
          </dl>
          <p className="adm-faint body" style={{ fontSize: 11.5, margin: "0 0 12px" }}>
            Contact details (email/phone) stay on the coach's own device in this phase; verification beyond
            this application data happens off-platform for now.
          </p>

          <form method="post" action={`/api/admin/coaches/${c.id}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="adm-btn adm-btn--ok body" name="action" value="approve" type="submit">Approve → verified</button>
            <button className="adm-btn adm-btn--danger body" name="action" value="reject" type="submit">Reject</button>
            <input className="adm-input body" name="reason" placeholder="Rejection reason (kept on record)" style={{ flex: 1, minWidth: 180 }} />
          </form>
        </div>
      ))}
    </>
  );
}
