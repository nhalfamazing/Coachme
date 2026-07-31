# Conversion goals and the funnel

Set 2026-07-30. This is what the analytics are for; every event below exists
to answer one of these two questions and nothing else.

## Primary goal

> Athlete activation: a profile created and at least one drill logged in the
> same session (`signup_completed` + `first_drill_played`). Signup alone is a
> vanity metric while nothing is charged; logging is what predicts return.

## Secondary goal

> Coach application submitted (`coach_apply_completed`), since supply is the
> bottleneck in a two-sided marketplace with no trainers yet, and one coach
> serves many athletes.

The second goal is why a one-line coach CTA sits at the foot of every public
drill page and sport hub (`src/components/marketing/coach-cta.tsx`). A coach
searching for a drill is supply, and the drill library is the only thing we
publish that coaches actively search for.

## Why not signup

`signup_completed` is free to earn and means nothing on its own: nobody is
charged, so a signup costs a visitor a minute and commits them to nothing. A
profile with no logged drill is indistinguishable from a bounce a day later.
The first logged drill is the first moment the product has done its job, and
it is the number to optimise even when it is smaller and slower to move than
signups.

Reading it: count sessions with `signup_completed`, then the share of those
that also fire `first_drill_played`. That ratio is the funnel. A change that
raises signups and lowers the ratio has made things worse.

## Events

All go through Vercel Analytics `track()` — the analytics already in the
product. No new vendor, no new script, no cookie.

| Event | Fired from | Props |
| --- | --- | --- |
| `drill_page_viewed` | public drill page | `drillId`, `sport`, `referrerType` |
| `drill_video_played` | public drill page, first play only | `drillId`, `sport` |
| `drill_page_cta_click` | drill page, hub and library CTAs | `cta`, `section` |
| `landing_section_viewed` | landing sections, once per pageload | `id` |
| `cta_click` | every other marketing CTA | `cta`, `section` |
| `signup_started` | app signup entry | `source`, `sport` when known |
| `signup_step_completed` | each signup step advance | `step` |
| `signup_completed` | signup finish | — |
| `first_drill_played` | first drill an athlete ever logs | `sport`, `drillId` |
| `first_workout_logged` | first workout an athlete ever logs | `type` |

Also already present and still useful: `pro_gate_shown`, `drill_logged`,
`coach_apply_started`, `coach_apply_completed`, `landing_drill_play`,
`faq_opened`.

### Renamed on 2026-07-30

- `section_viewed` → `landing_section_viewed`
- `landing_cta_click` → `cta_click`, now with a `section` prop

Both renames break continuity with data collected before that date. That was
worth it: the CtaLink component now serves drill pages and hubs too, so a
`landing_`-prefixed name was wrong on most pages using it, and `section` is
what makes a click comparable to the view of the same section.

## Privacy

Event props carry the page slot, the drill, and a coarse referrer class.
They never carry anything about the visitor. `referrerType` buckets to
`search` / `ai` / `social` / `internal` / `direct` / `other` and the referrer
URL is deliberately discarded — a search referrer can contain what somebody
typed, and that is not ours to collect. No athlete name, code, id, or
location appears in any event.

## The A/B seam

`src/lib/variants.ts` holds alternative hero headline and primary CTA copy
behind one switch. **No test is running.** The variant is resolved at build
time and identical for every visitor, which keeps the pages static and means
nobody sees a flash of control copy before JavaScript swaps it.

Running a real test needs work this seam deliberately does not do: a
bucketing cookie set at the edge, and the variant key attached to every
funnel event so the two sides can be told apart. Splitting traffic without
that produces numbers that look like results and are not.
