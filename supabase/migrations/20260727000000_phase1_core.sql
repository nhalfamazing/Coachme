-- ============================================================================
-- Phase 1 core schema for CoachMe.
--
-- RLS POLICY STATEMENT (THIS PHASE — read before adding policies):
--   Row Level Security is ENABLED on every table below, and NO policies are
--   created on purpose. Pre-auth, the anon key must have zero direct table
--   access; ALL reads and writes go through server routes using the service
--   role key (which bypasses RLS). Per-user policies land in the auth phase,
--   once profiles.auth_user_id is populated from real Supabase auth.
--
-- Supersedes 20260721000000_shared_tables.sql (the earlier cloud stub:
-- jsonb blob tables coaches/athletes/threads with wide-open anon
-- read/insert/update policies). Those tables are DROPPED below — the drop
-- must happen before the creates, because the stub's `threads` table shares
-- its name with the relational one here and `if not exists` would otherwise
-- silently keep the old shape.
--
-- Data minimization (users include minors): profiles carry NO email, NO
-- phone, NO exact birthdate (age integer only), and city/state only for
-- location. Parent-verified auth arrives in a later phase.
--
-- Identity: 3-word codes remain a device-pairing convenience. `code` stores
-- the words; `legacy_id` stores today's deterministic hash(code) id so the
-- localStorage -> Postgres migration can match existing profiles.
--
-- NOTE: no drills table on purpose — the Drill Library is static content
-- shipped in src/lib/drills.ts.
-- ============================================================================

begin;

-- Drop the superseded cloud-stub blob tables (and their anon policies with
-- them). Their jsonb payloads are re-imported into the relational tables by
-- the separate data-migration step, matched via legacy_id / legacy_key.
drop table if exists public.coaches cascade;
drop table if exists public.athletes cascade;
drop table if exists public.threads cascade;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,               -- deterministic hash(code) id from the localStorage era
  role text not null check (role in ('athlete', 'coach')),
  code text unique not null,           -- the 3-word device-pairing code
  first_name text not null,
  last_name text not null,
  sport text,
  position text,
  specialty text,
  age int check (age between 5 and 25),      -- athletes only; never a birthdate
  years_pro int,                              -- coaches only
  years_coaching int,                         -- coaches only
  city text,
  state text,
  rate_cents int,                             -- coaches
  modes text[] check (modes <@ array['in_person', 'live_online', 'async']),  -- coaches
  background text,                            -- coach background category
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  auth_user_id uuid unique references auth.users (id),  -- filled when real auth lands
  created_at timestamptz default now()
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,              -- the `${athleteId}::${coachId}` localStorage key
  athlete_id uuid not null references public.profiles (id),
  coach_id uuid not null references public.profiles (id),
  created_at timestamptz default now(),
  unique (athlete_id, coach_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_role text not null check (sender_role in ('athlete', 'coach')),
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz default now()
);

create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  duration_min int,
  intensity int check (intensity between 1 and 5),
  notes text,
  performed_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists workouts_athlete_performed_idx
  on public.workouts (athlete_id, performed_at);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) <= 280),
  created_at timestamptz default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (post_id, profile_id)
);

-- RLS on, no policies: see the policy statement at the top of this file.
alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.workouts enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;

commit;
