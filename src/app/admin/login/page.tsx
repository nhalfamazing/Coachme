import type { Metadata } from "next";
import { LINK_TTL_MINUTES } from "@/lib/admin-link";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* One field, one button.
 *
 * The confirmation copy is deliberately non-committal: "if that address has
 * access". It reads the same whether the address is on the allowlist or not,
 * because it is the visible half of the rule the API enforces — this page
 * must not become the oracle the endpoint refuses to be.
 *
 * A plain form post, so it works with JavaScript off. */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div style={{ maxWidth: 400, margin: "10vh auto 0" }}>
      <div className="adm-card">
        <h1 className="display" style={{ fontSize: 28, margin: "0 0 6px", textTransform: "uppercase" }}>
          Admin access
        </h1>
        <p className="adm-muted body" style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
          Sign in with your email. We send a link — there is no password.
        </p>

        {status === "sent" && (
          <p className="body" style={{
            fontSize: 12.5, lineHeight: 1.55, padding: "10px 12px", borderRadius: 8, margin: "0 0 14px",
            background: "rgba(125,223,160,0.08)", border: "1px solid #2C5A3E", color: "#7DDFA0",
          }}>
            If that address has access, the link is on its way. It expires in{" "}
            {LINK_TTL_MINUTES} minutes and works once.
          </p>
        )}

        {status === "invalid" && (
          <p className="body" style={{
            fontSize: 12.5, lineHeight: 1.55, padding: "10px 12px", borderRadius: 8, margin: "0 0 14px",
            background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.4)", color: "#FF8888",
          }}>
            That link did not work. Links expire after {LINK_TTL_MINUTES} minutes
            and can only be used once — request a new one below.
          </p>
        )}

        <form
          method="post"
          action="/api/admin/auth/request"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <label className="adm-muted body" htmlFor="admin-email" style={{ fontSize: 12 }}>
            Email address
          </label>
          <input
            id="admin-email" className="adm-input body" type="email" name="email"
            placeholder="you@example.com" autoComplete="email" required
            style={{ width: "100%", padding: "11px 12px", fontSize: 14 }}
          />
          <button className="adm-btn adm-btn--ok body" type="submit" style={{ padding: "11px 16px", fontSize: 13.5 }}>
            Send me a link
          </button>
        </form>

        <p className="adm-faint body" style={{ fontSize: 11.5, lineHeight: 1.55, margin: "14px 0 0" }}>
          Access is limited to a short list of people and is not
          self-service. If you should be on it and are not, that is a code
          change, not a setting.
        </p>
      </div>
    </div>
  );
}
