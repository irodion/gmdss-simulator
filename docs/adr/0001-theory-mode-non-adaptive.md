# Theory Mode is non-adaptive

The Theory Mode (offline trainer, tab VII — authored multiple-choice questions
on GMDSS knowledge) deliberately does **not** participate in the adaptive
learning system. It writes nothing to `learning-events.ts`, contributes no
atoms to `atom-universe.ts`, has no Mastery-table row, and is excluded from
Exam Mock. A session draws a random, topic-balanced set of questions; missed
questions do not resurface. We chose this for v1 simplicity over parity with
the Drill Modes — every other count-driven Mode feeds the adaptive queue, so
this is a deliberate deviation, not an oversight.

## Considered options

- **Full atom integration** — each question an atom (`theory:<id>`) covered by
  the generic `adaptive-selection.ts`, queue preview, and `AdaptiveModeToggle`.
  Rejected for v1: most wiring, and the authored question bank starts small.
- **Missed-question resurfacing** — a lightweight Theory-specific selector
  favouring never-seen and recently-missed questions. Rejected for v1 as still
  more plumbing than a random topic-balanced pick.

## Consequences

- A finished Theory session credits `applySessionAndPersist({ freeItems: N })`,
  so it shows under Logbook "Today" as free practice and does not advance the
  streak (the streak is driven solely by `adaptiveItems`).
- Revisit this decision if the question bank grows large enough that
  resurfacing weak questions becomes worthwhile — at which point the Theory
  selector and a `theory:<id>` atom universe would be the migration path.
