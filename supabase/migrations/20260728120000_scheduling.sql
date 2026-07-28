-- ============================================================================
-- Scheduling schema for CoachMe: request-based booking.
--
-- MODEL: coaches publish recurring weekly availability windows (the
-- simplest honest model; no per-date calendar overrides yet). Athletes
-- request a concrete start time derived from those windows; coaches
-- accept (which materializes a sessions row) or decline. No payments:
-- rates stay display-only.
--
-- TIMEZONE: window times are minutes-from-midnight in the coach's local
-- timezone, assumed America/New_York for this phase (the product's
-- launch market is Miami). Concrete request/session times are stored as
-- UTC timestamptz. The derivation code owns the zone math.
--
-- RLS POLICY STATEMENT (same as prior migrations): RLS ENABLED, zero
-- policies on purpose. The anon key has no direct access; all traffic
-- goes through server routes holding the service role key.
--
-- APPLY: written by tooling, applied by a human.
-- ============================================================================

begin;

create table if not exists public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 1 and 1440),
  mode text not null check (mode in ('in_person', 'live_online', 'async')),
  location_note text check (char_length(location_note) <= 120),  -- e.g. "Tropical Park, field 3"
  active boolean not null default true,
  created_at timestamptz default now(),
  check (end_minute > start_minute)
);

create index if not exists coach_availability_coach_weekday_idx
  on public.coach_availability (coach_id, weekday);

create table if not exists public.session_requests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  requested_start timestamptz not null,
  duration_min int not null default 60 check (duration_min between 15 and 240),
  mode text not null check (mode in ('in_person', 'live_online', 'async')),
  note text check (char_length(note) <= 280),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled_by_athlete', 'cancelled_by_coach')),
  decline_reason text,
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists session_requests_coach_status_idx
  on public.session_requests (coach_id, status);
create index if not exists session_requests_athlete_idx
  on public.session_requests (athlete_id, requested_start);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.session_requests (id) on delete set null,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min between 15 and 240),
  mode text not null check (mode in ('in_person', 'live_online', 'async')),
  location_note text check (char_length(location_note) <= 120),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'no_show', 'cancelled')),
  cancel_reason text,
  created_at timestamptz default now()
);

create index if not exists sessions_athlete_starts_idx
  on public.sessions (athlete_id, starts_at);
create index if not exists sessions_coach_starts_idx
  on public.sessions (coach_id, starts_at);

-- RLS on, no policies: see the policy statement at the top of this file.
alter table public.coach_availability enable row level security;
alter table public.session_requests enable row level security;
alter table public.sessions enable row level security;

commit;
