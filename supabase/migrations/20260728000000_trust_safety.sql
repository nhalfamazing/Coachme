-- ============================================================================
-- Trust & Safety schema for CoachMe.
--
-- WHY: minors and unverified adults can message each other. This adds the
-- storage for (1) automatic server-side flagging of risky messages,
-- (2) user-filed reports, (3) user blocks, (4) admin-hidden messages, and
-- (5) profile bans. The moderation logic itself lives in the API routes
-- (service role); this file is storage only.
--
-- RLS POLICY STATEMENT (same as 20260727000000_phase1_core.sql):
--   RLS is ENABLED on every new table and NO policies are created on
--   purpose. The anon key has zero direct access; all reads/writes go
--   through server routes holding the service role key. Per-user policies
--   arrive with real auth.
--
-- APPLY: this file is written by tooling but applied by a human.
-- ============================================================================

begin;

-- Automatic flags raised by the server-side message screen, plus context
-- flags captured when a user files a report. One row per flagged message
-- per reason.
create table if not exists public.message_flags (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  reason text not null,                 -- pattern category ('secrecy', 'meetup_pressure', ...) or 'report_context'
  matched_pattern text,                 -- the pattern label that fired, for admin review; never shown to users
  status text not null default 'pending'
    check (status in ('pending', 'reviewed_ok', 'reviewed_removed')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by text                      -- admin identifier; free text until real admin accounts exist
);

create index if not exists message_flags_status_created_idx
  on public.message_flags (status, created_at);

-- User-filed reports (athlete reporting a coach or coach reporting an
-- athlete). message_id optionally pins the report to one message.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_profile_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  reason text not null,                 -- picker value ('uncomfortable', 'personal_info', 'move_off_platform', 'other')
  details text check (char_length(details) <= 500),
  status text not null default 'open'
    check (status in ('open', 'resolved_ok', 'resolved_action')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at);

-- Blocks: blocker never receives messages from blocked and vice versa.
-- The blocked party is never notified (checked server-side on send).
create table if not exists public.blocks (
  blocker_profile_id uuid not null references public.profiles (id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_profile_id, blocked_profile_id)
);

-- Admin moderation: hidden messages stay in the database (evidence) but
-- are excluded from non-admin reads.
alter table public.messages add column if not exists hidden boolean not null default false;
alter table public.messages add column if not exists hidden_reason text;

-- Profile bans: banned profiles cannot send messages and banned coaches
-- disappear from athlete-facing directories.
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists banned_reason text;

-- RLS on, no policies: see the policy statement at the top of this file.
alter table public.message_flags enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

commit;
