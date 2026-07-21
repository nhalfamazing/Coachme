-- Shared data for cross-device CoachMe: coaches, athletes, message threads.
-- Each row stores the app's JSON payload; id is the app's own id as text.
-- NOTE: the anon policies below are wide open on purpose for this phase so
-- the app works without user accounts. Phase 1 auth will lock them down.

create table if not exists public.coaches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.athletes (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.threads (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.coaches enable row level security;
alter table public.athletes enable row level security;
alter table public.threads enable row level security;

drop policy if exists "anon read coaches" on public.coaches;
create policy "anon read coaches" on public.coaches for select using (true);
drop policy if exists "anon insert coaches" on public.coaches;
create policy "anon insert coaches" on public.coaches for insert with check (true);
drop policy if exists "anon update coaches" on public.coaches;
create policy "anon update coaches" on public.coaches for update using (true) with check (true);

drop policy if exists "anon read athletes" on public.athletes;
create policy "anon read athletes" on public.athletes for select using (true);
drop policy if exists "anon insert athletes" on public.athletes;
create policy "anon insert athletes" on public.athletes for insert with check (true);
drop policy if exists "anon update athletes" on public.athletes;
create policy "anon update athletes" on public.athletes for update using (true) with check (true);

drop policy if exists "anon read threads" on public.threads;
create policy "anon read threads" on public.threads for select using (true);
drop policy if exists "anon insert threads" on public.threads;
create policy "anon insert threads" on public.threads for insert with check (true);
drop policy if exists "anon update threads" on public.threads;
create policy "anon update threads" on public.threads for update using (true) with check (true);
