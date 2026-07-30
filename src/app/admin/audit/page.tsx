import { auditLog } from "../_lib/data";

export const dynamic = "force-dynamic";

/* Who did what, newest first.
 *
 * Read-only by design. There is no control on this page to edit or delete a
 * row, and there should never be one — a log the actors can rewrite is not a
 * log. Rows cover both authentication (links requested, redeemed, refused)
 * and every destructive moderation action. */

const LABELS: Record<string, { text: string; tone: "ok" | "warn" | "danger" | "plain" }> = {
  link_requested: { text: "Link requested", tone: "plain" },
  link_request_ignored: { text: "Link request ignored", tone: "warn" },
  link_request_rate_limited: { text: "Rate limited", tone: "warn" },
  link_request_failed: { text: "Link send failed", tone: "danger" },
  link_redeemed: { text: "Signed in", tone: "ok" },
  link_redemption_failed: { text: "Sign-in refused", tone: "danger" },
  signed_out: { text: "Signed out", tone: "plain" },
  coach_verified: { text: "Coach verified", tone: "ok" },
  coach_rejected: { text: "Coach rejected", tone: "warn" },
  flag_dismissed: { text: "Flag dismissed", tone: "plain" },
  flag_removed: { text: "Message removed", tone: "warn" },
  flag_banned: { text: "Banned from flag", tone: "danger" },
  report_resolved: { text: "Report resolved", tone: "plain" },
  report_banned: { text: "Banned from report", tone: "danger" },
};

const TONE_STYLE: Record<string, { background: string; color: string; border: string }> = {
  ok: { background: "rgba(125,223,160,0.10)", color: "#7DDFA0", border: "1px solid #2C5A3E" },
  warn: { background: "rgba(255,179,71,0.10)", color: "#FFB347", border: "1px solid #5A452C" },
  danger: { background: "rgba(255,136,136,0.10)", color: "#FF8888", border: "1px solid #5A2C2C" },
  plain: { background: "#111A26", color: "#C7D2DE", border: "1px solid #1B2634" },
};

export default async function AdminAuditPage() {
  const log = await auditLog();

  return (
    <>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 6px", textTransform: "uppercase" }}>
        Audit log
      </h1>
      <p className="adm-muted body" style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
        Every sign-in and every destructive action, newest first. This page is
        read-only.
      </p>

      {log.state === "no-cloud" && (
        <div className="adm-card body" style={{ fontSize: 13.5 }}>
          Cloud database isn&apos;t configured in this environment, so there is
          nothing to show here.
        </div>
      )}

      {log.state === "no-tables" && (
        <div className="adm-card body" style={{ fontSize: 13.5 }}>
          The admin auth migration hasn&apos;t been applied to this database yet.
        </div>
      )}

      {log.state === "ok" && log.rows.length === 0 && (
        <div className="adm-card body" style={{ fontSize: 13.5 }}>
          Nothing logged yet.
        </div>
      )}

      {log.state === "ok" && log.rows.length > 0 && (
        <div className="adm-card adm-scroll" style={{ padding: 4 }}>
          <table className="adm-table body">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {log.rows.map(row => {
                const label = LABELS[row.action] ?? { text: row.action, tone: "plain" as const };
                return (
                  <tr key={row.id}>
                    <td className="mono adm-faint" style={{ whiteSpace: "nowrap" }}>
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="mono" style={{ wordBreak: "break-all" }}>
                      {row.email ?? <span className="adm-faint">—</span>}
                    </td>
                    <td>
                      <span className="adm-tag" style={TONE_STYLE[label.tone]}>{label.text}</span>
                    </td>
                    <td className="adm-muted" style={{ wordBreak: "break-word" }}>
                      {row.detail ?? <span className="adm-faint">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
