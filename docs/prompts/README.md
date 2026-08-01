# Session prompts

Every working session's prompt, saved verbatim before any of it is executed.

## Why

A prompt is the spec. It carries the reasoning behind decisions that the diff
alone does not explain — why a slug is shaped one way, which trade-off was
already argued and settled, what was explicitly ruled out. When a session is
cleared, that spec is gone, and the next session re-litigates decisions that
were already made or, worse, quietly reverses them.

The first commit of a session is this file. Not the last, because a session
that runs out of room before it finishes is exactly the one whose prompt was
worth keeping.

## Convention

- One file per session: `YYYY-MM-DD-short-topic.md`.
- Save it **before executing**, and commit it on its own:
  `docs: save the <topic> session prompt`.
- Copy the prompt **verbatim**. Do not summarise, tidy, or reorder it — a
  paraphrase is a second-hand account of the decision.
- Record mid-session corrections and scope changes in the same file, under a
  clearly marked heading, with the original text left intact above them. What
  changed mid-flight is usually the most useful part six weeks later.
- Note what was actually executed versus deferred at the top, so a reader
  knows whether the file describes shipped work or an open plan.

## Index

| Date | File | Topic | Status |
| --- | --- | --- | --- |
| 2026-07-30 | [2026-07-30-seo-aeo-cro.md](2026-07-30-seo-aeo-cro.md) | Original SEO/AEO/CRO plan, phases 0–6 | Phases 0–3 shipped; 4–6 open |
| 2026-07-30 | [2026-07-30-seo-followup.md](2026-07-30-seo-followup.md) | SEO follow-up: slugs, bundle split, duration, addendum | Phases A, B, C, E, F shipped |
| 2026-07-30 | [2026-07-30-aeo-cro-ship.md](2026-07-30-aeo-cro-ship.md) | Phase D: AEO layer, CRO, verify and ship | In progress |
| 2026-07-31 | [2026-07-31-offer-copy-reconcile.md](2026-07-31-offer-copy-reconcile.md) | Founding member model, remove $9 claims, offer as data | Phases 0-6 shipped |
