-- ============================================================================
-- Per-drill logging for CoachMe.
--
-- WHY: the drill detail page gets a MY PROGRESS tab. An athlete taps "Log
-- this drill" and we record that they did it — optionally with a rep count
-- and a note. Everything the tab shows (total completions, streak on this
-- drill, reps over time, last sessions) derives from these rows. No
-- aggregates are stored; nothing is ever inferred on the athlete's behalf.
--
-- ADDITIVE ONLY: this file creates one new table and touches nothing that
-- already exists. No renames, no drops, no column changes.
--
-- drill_id is a text key from data/drills-manifest.json, deliberately NOT a
-- foreign key: the Drill Library is static content shipped in
-- src/lib/drills.ts (see the note in 20260727000000_phase1_core.sql), so
-- there is no drills table to reference. A drill retired from the manifest
-- leaves its sessions intact rather than deleting a kid's history.
--
-- completed_at is when the athlete says they trained; created_at is when the
-- row reached us. They differ for queued offline logs, and the streak math
-- must use completed_at.
--
-- RLS POLICY STATEMENT (same as 20260727000000_phase1_core.sql):
--   RLS is ENABLED and NO policies are created on purpose. The anon key has
--   zero direct access; all reads/writes go through server routes holding
--   the service role key. Per-user policies arrive with real auth.
-- ============================================================================

begin;

create table if not exists public.drill_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  drill_id text not null,
  completed_at timestamptz not null default now(),
  -- Both optional: one tap with nothing filled in is a valid log, and
  -- friction is what stops kids logging at all.
  reps int check (reps > 0 and reps <= 10000),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz default now()
);

-- The two reads the progress tab makes: this athlete's sessions for one
-- drill (newest first), and their whole drill history for achievements.
create index if not exists drill_sessions_profile_drill_completed_idx
  on public.drill_sessions (profile_id, drill_id, completed_at desc);

create index if not exists drill_sessions_profile_completed_idx
  on public.drill_sessions (profile_id, completed_at desc);

-- RLS on, no policies: see the policy statement at the top of this file.
alter table public.drill_sessions enable row level security;

commit;
