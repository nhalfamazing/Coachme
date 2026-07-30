-- ============================================================================
-- Admin magic-link auth for CoachMe.
--
-- WHY: the console guards data about children. The previous gate was a single
-- shared ADMIN_SECRET — it could not be rotated per person, could not be
-- recovered if lost, and every action in the console was attributable only to
-- "someone who knew the secret". This replaces it with passwordless email auth
-- on a hardcoded allowlist, so every action has a name against it.
--
-- ADDITIVE ONLY: two new tables, nothing existing is touched.
--
-- WHO MAY SIGN IN IS NOT IN THIS DATABASE. The allowlist is a code constant
-- (src/lib/admin-allowlist.ts) on purpose: granting console access to a new
-- person requires a code change, review, and a deploy. A row in a table can be
-- inserted by anything holding the service role key; a constant cannot.
--
-- admin_sessions holds MAGIC-LINK TOKENS, not browser sessions. One row per
-- link emailed. Only the SHA-256 hash of the token is stored — the token
-- itself exists in the email and nowhere else, so a database leak cannot be
-- replayed into a login. Rows are single-use (used_at) and short-lived
-- (expires_at, 15 minutes). The browser session that follows redemption is a
-- stateless HMAC-signed cookie; it is re-checked against the code allowlist on
-- every request, so removing someone from ADMIN_EMAILS and deploying kills
-- their live session immediately.
--
-- ip and user_agent are recorded for one reason: if a link is redeemed by
-- someone it was not sent to, we want to be able to see that.
--
-- RLS POLICY STATEMENT (same as 20260727000000_phase1_core.sql):
--   RLS is ENABLED and NO policies are created on purpose. The anon key has
--   zero direct access; all reads/writes go through server routes holding the
--   service role key. This matters more here than anywhere else in the schema:
--   direct anon access to admin_sessions would be an authentication bypass.
-- ============================================================================

begin;

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- SHA-256 of the token, hex. The token itself is never stored.
  token_hash text not null unique,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  -- Set on redemption. A non-null value means this link is spent and must
  -- never authenticate anyone again.
  used_at timestamptz,
  ip text,
  user_agent text
);

-- Redemption looks up by hash; the per-email rate limit counts recent rows.
create index if not exists admin_sessions_token_hash_idx
  on public.admin_sessions (token_hash);
create index if not exists admin_sessions_email_created_idx
  on public.admin_sessions (email, created_at desc);

-- Append-only record of who did what. Never updated, never deleted from.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  -- Null only when an action genuinely has no actor.
  email text,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);
-- The per-IP rate limit counts request rows in a time window.
create index if not exists admin_audit_log_action_created_idx
  on public.admin_audit_log (action, created_at desc);

-- RLS on, no policies: see the policy statement at the top of this file.
alter table public.admin_sessions enable row level security;
alter table public.admin_audit_log enable row level security;

commit;
