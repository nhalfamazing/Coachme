/* Who may open the admin console.
 *
 * This is a CODE CONSTANT on purpose, and it must stay one.
 *
 * Not a database table: anything holding the service role key could insert
 * itself a row. Not an env var: env vars are edited in a dashboard by one
 * person, at any hour, with no review and no diff. Granting somebody access
 * to a console full of data about children should require a commit, a
 * reviewer, and a deploy. The friction IS the feature.
 *
 * Removing an address here revokes access immediately on deploy: the session
 * cookie carries the email, and every check re-tests it against this list, so
 * a live signed-in session dies with the deploy rather than lingering until
 * the cookie expires.
 *
 * Kept dependency-free so the edge middleware can import it.
 */

export const ADMIN_EMAILS = [
  "rscarlett@netaesthetics.com",
  "noahrscarlett@gmail.com",
] as const;

/** Lowercase and trim. Addresses arrive from a form and from a cookie; both
 *  are compared in this normalised form, never raw. */
export function normalizeEmail(input: string | null | undefined): string {
  return String(input ?? "").trim().toLowerCase();
}

/** True when this address is on the allowlist. Callers must pass user input
 *  through here rather than comparing strings themselves. */
export function isAllowedAdmin(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}
