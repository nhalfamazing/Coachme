-- ============================================================================
-- Founding member status for CoachMe.
--
-- WHY: KoachMe is free during beta, and anyone who signs up during beta is
-- promised that the features they use today stay free for as long as their
-- account is active. That promise is made to families on /pricing and in
-- the FAQ, so it needs to be recorded per profile rather than inferred
-- from a signup date later, when the beta cutoff is a thing someone has to
-- remember.
--
-- BACKFILL: every existing profile becomes 'founding'. They signed up under
-- earlier promises — including the now-removed "$9 a month" copy that was
-- never charged — and we keep them. There is no cohort here that gets a
-- worse deal than the one it was shown.
--
-- NO BILLING HERE. There is no price, no Stripe customer, no subscription
-- state. This column records WHICH PROMISE a profile was made, nothing
-- about payment. Payment storage is its own piece of work and does not
-- exist yet.
--
-- ADDITIVE ONLY: add column if not exists, with a default. Nothing is
-- dropped, renamed, or rewritten.
--
-- APPLY: this file is written by tooling but applied by a human.
-- ============================================================================

begin;

-- 'founding'  — signed up during beta; keeps the beta feature set free.
-- 'standard'  — signed up after pricing launched. Nothing sets this yet;
--               it exists so the check constraint does not have to change
--               on the day pricing launches.
alter table public.profiles
  add column if not exists plan text not null default 'founding';

-- Written as a separate guarded block so re-running the file on a database
-- that already has the constraint is a no-op rather than an error.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_check check (plan in ('founding', 'standard'));
  end if;
end $$;

-- Backfill. The default above only covers rows inserted from now on; this
-- covers everyone already here. Idempotent.
update public.profiles set plan = 'founding' where plan is null or plan = '';

comment on column public.profiles.plan is
  'Which offer this profile was created under. founding = signed up during beta, keeps the beta feature set free while the account is active. See src/lib/offer.ts and docs/terms-additions-draft.md.';

commit;
