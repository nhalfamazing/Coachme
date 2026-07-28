import { flagContext, pendingFlags } from "../_lib/data";

export const dynamic = "force-dynamic";

function ProfileLine({ p, label }: { p: any; label: string }) {
  if (!p) return null;
  return (
    <span className="body" style={{ fontSize: 12.5 }}>
      <span className="adm-faint mono" style={{ fontSize: 10, letterSpacing: "0.08em" }}>{label} </span>
      {p.first_name} {p.last_name}
      <span className="adm-muted">
        {" "}· {p.role}{p.age ? ` · age ${p.age}` : ""}{p.city ? ` · ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}
        {" "}· {p.verification_status}{p.banned === true ? " · BANNED" : ""}
      </span>
    </span>
  );
}

export default async function FlagsQueue() {
  const flags = await pendingFlags();

  if (flags.state === "no-cloud") {
    return <div className="adm-card body" style={{ fontSize: 13.5 }}>Cloud database isn't configured in this environment.</div>;
  }
  if (flags.state === "no-tables") {
    return (
      <div className="adm-card body" style={{ fontSize: 13.5 }}>
        The trust &amp; safety migration hasn't been applied yet, so there is no flag queue to read.
        Apply supabase/migrations/20260728000000_trust_safety.sql and this page comes alive.
      </div>
    );
  }

  const items = [];
  for (const flag of flags.rows) {
    items.push({ flag, ctx: await flagContext(flag) });
  }

  return (
    <>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 6px", textTransform: "uppercase" }}>Review queue</h1>
      <p className="adm-muted body" style={{ fontSize: 13, margin: "0 0 18px" }}>
        {flags.rows.length === 0 ? "Nothing pending. Clean queue." : `${flags.rows.length} pending flag${flags.rows.length === 1 ? "" : "s"}, oldest first.`}
      </p>

      {items.map(({ flag, ctx }) => (
        <div key={flag.id} className="adm-card">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <span className="adm-tag mono" style={{ background: "#3A2A1E", color: "#FFB347" }}>{flag.reason}</span>
            {flag.matched_pattern && (
              <span className="adm-faint mono" style={{ fontSize: 11 }}>pattern: {flag.matched_pattern}</span>
            )}
            <span className="adm-faint mono" style={{ fontSize: 11, marginLeft: "auto" }}>
              {new Date(flag.created_at).toLocaleString()}
            </span>
          </div>

          {ctx ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                <ProfileLine p={ctx.athlete} label="ATHLETE" />
                <ProfileLine p={ctx.coach} label="COACH" />
              </div>
              <div style={{ marginBottom: 12 }}>
                {ctx.context.map((m: any) => (
                  <div key={m.id} className={`adm-msg body ${m.id === flag.message_id ? "adm-msg--flagged" : ""}`}>
                    <span className="adm-faint mono" style={{ fontSize: 10, letterSpacing: "0.06em" }}>
                      {m.sender_role.toUpperCase()}{m.hidden === true ? " · HIDDEN" : ""} ·{" "}
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <div>{m.body}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="adm-muted body" style={{ fontSize: 12.5 }}>Message context unavailable (message may have been deleted).</p>
          )}

          <form method="post" action={`/api/admin/flags/${flag.id}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="adm-btn adm-btn--ok body" name="action" value="dismiss" type="submit">Dismiss (it's fine)</button>
            <button className="adm-btn adm-btn--warn body" name="action" value="remove" type="submit">Remove message</button>
            <button className="adm-btn adm-btn--danger body" name="action" value="ban" type="submit">Remove + ban sender</button>
            <input className="adm-input body" name="reason" placeholder="Reason (kept on record)" style={{ flex: 1, minWidth: 160 }} />
          </form>
        </div>
      ))}
    </>
  );
}
