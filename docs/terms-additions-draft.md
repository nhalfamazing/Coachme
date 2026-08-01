# Draft terms language: the founding-member promise

> **NOT PUBLISHED. NEEDS LEGAL REVIEW BEFORE IT GOES ANYWHERE.**
>
> This is a draft of language `/terms` would need in order to reflect the
> founding-member promise. It has **not** been published to `/terms`, and it
> must not be until a qualified lawyer has reviewed it. `/terms` and
> `/privacy` are both still DRAFT-flagged and unreviewed themselves, which
> makes this a promise sitting on top of an unreviewed foundation.
>
> Written 2026-08-01, during the offer-copy reconciliation session.

## Why this needs a lawyer and not just an editor

Everything else changed in that session was a **correction**: the site said
"$9 a month" for something nobody was charged, and now it says what is true.
Removing a false claim carries no new obligation.

The founding-member promise is different in kind. It is the first thing
KoachMe has said that **creates a forward commitment to families** — that a
named set of features stays free, for an indefinite period, for a group of
people defined by when they signed up. That is a term of service, and it is
the kind of term that matters most precisely when the company would rather
it did not: when money is tight and the founding cohort is the obvious place
to find some.

The specific things a lawyer needs to rule on:

1. **What "active account" means, and who decides.** The promise is scoped
   to "as long as the account is active". If we get to define "active"
   unilaterally and without notice, the promise is worth nothing, and a
   regulator or a parent could fairly say so. It probably needs a definition
   and a floor (e.g. an account is not inactive without a warning and a
   window to return).
2. **Whether we can ever withdraw it, and on what grounds.** Insolvency,
   acquisition, and shutdown are the real cases. Silence here is not
   protection; it is ambiguity that gets resolved against the drafter.
3. **What happens on acquisition.** A promise that does not survive a change
   of control is not the promise a parent reads on `/pricing`.
4. **Whether "features built after beta may be paid" is a workable line.**
   It is honest, and it is also vague. A future team could reasonably call a
   redesign of the existing stat sheet a "new feature". If the line cannot
   be drawn crisply, the promise should be narrowed to something that can.
5. **Whether any of this is an enforceable offer** in the jurisdictions where
   families actually sign up, and whether stating it on a marketing page
   creates obligations independent of the terms.
6. **Minors.** Accounts are created for children aged 6 to 25, frequently by
   a parent. Who holds this promise, and who can enforce it, is not obvious.

## Draft clause

> ### Founding accounts
>
> KoachMe is currently in beta. Everything in KoachMe is free during beta,
> and we do not collect payment information from athletes or their families.
>
> An account created while KoachMe is in beta is a **founding account**. For
> as long as a founding account remains active, the following stay free for
> that account:
>
> - an athlete profile;
> - unlimited workout and drill logging;
> - core stat tracking;
> - streaks and XP;
> - posting to the community feed;
> - the drill library as it stands when beta ends;
> - finding and messaging coaches;
> - booking sessions.
>
> **What this does not cover.** Features we build after beta ends may be
> paid, including for founding accounts. Founding status covers the list
> above as it stands at the end of beta. It is not a promise of free access
> to everything KoachMe may offer in future.
>
> **Notice.** We will give at least 30 days notice before any pricing change
> takes effect for an existing account. Notice will be given in the app and,
> where we hold one, by email to the address on the account.
>
> **When beta ends.** Pricing may launch for new users at any time and no
> date is set. When it does, accounts created before that point keep their
> founding status, and accounts created after it do not.
>
> **[LAWYER: the following need drafting and are deliberately not attempted
> here]** the definition of an inactive account and the process for
> designating one; the circumstances in which founding status can be
> withdrawn or the service discontinued; the treatment of founding status on
> a change of control; and who holds these rights where the account belongs
> to a minor.

## What has already shipped that this needs to match

Changing the clause above without changing these will put the terms and the
marketing copy back out of sync, which is the exact failure this session
existed to fix.

| Surface | What it now promises |
| --- | --- |
| [`src/lib/offer.ts`](../src/lib/offer.ts) | `foundingBenefits`, `foundingExcludes`, `noticeDays` — the single source every surface reads |
| [`/pricing`](../src/app/(marketing)/pricing/page.tsx) | The two-column comparison, the exclusion, and the notice commitment |
| [`faq-data.ts`](../src/components/marketing/faq-data.ts) | "What is a founding member?", "Will you ever charge me?", "What happens when beta ends?" |
| [`/terms`](../src/app/(marketing)/terms/page.tsx) | A short paragraph stating the intent, pointing at `/pricing` — deliberately lighter than the clause above |
| `profiles.plan` | `'founding'` per profile, backfilled for everyone who existed before this |

## Blocking status

**This is blocking before any real money is charged.** Not before launch,
not before more signups — before the first charge. The order that keeps us
honest:

1. Legal review of `/terms` and `/privacy` as they stand today (already
   overdue, and independent of this).
2. Legal review of the founding clause above.
3. Published terms reflecting it.
4. Only then: any payment code at all.

Charging anyone while the grandfathering promise lives only in marketing
copy and a database column would mean the most consequential thing we have
told families is the one thing with no reviewed legal basis.
