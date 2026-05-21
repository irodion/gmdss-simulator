# GMDSS Simulator

A maritime radio-operator training platform. Two trainee-facing surfaces exist:
the main PWA (lessons, AI voice simulator) and a standalone offline trainer
("R.O.C. Phonetics"). This glossary captures the shared domain language; the
offline trainer's drill vocabulary dominates it.

## Language

### Offline trainer

**Mode**:
A self-contained training activity the trainee picks from a tab in the offline
trainer — Callsigns, Numbers, Listen, Procedures, Abbreviations, Channels,
Theory. Internally an `AppMode`.
_Avoid_: scenario, screen, tab (as the name of the concept)

**Drill Mode**:
The subset of Modes that are count-driven and generate their Challenges
algorithmically — everything except Procedures and Theory. Internally a
`DrillType`.

**Challenge**:
A single question or item presented within a Mode session.

**Scenario**:
A scripted procedure exercise consumed by the Procedures Mode. Not a synonym
for Mode.
_Avoid_: using "scenario" to mean a Mode or a tab

**Exam Mock**:
A specific existing feature — an assessment that interleaves Challenges from the
Drill Modes and scores strictly (only 100%-correct items count). Not a generic
word for any test-like activity.
_Avoid_: "exam", "mock exam", or "quiz" as names for other features

**Theory**:
The Mode of authored multiple-choice questions on GMDSS regulatory and systems
knowledge (COSPAS-SARSAT, NAVTEX, channels, SART, VHF, MMSI). Knowledge recall —
authored, not algorithmically generated.
_Avoid_: quiz, exam

**Atom**:
The smallest trackable unit of knowledge for adaptive selection — e.g. one
abbreviation in one direction. Weak Atoms resurface in later sessions.

## Flagged ambiguities

- **"Scenario"** — used loosely to mean "a part of the app." In this codebase a
  Scenario is strictly a Procedures script. The new Theory feature is a **Mode**.
- **"Exam" / "quiz"** — the existing **Exam Mock** is a specific feature. The new
  **Theory** Mode is separate and must not be labelled an exam or quiz, in code
  or UI.

## Example dialogue

> **Dev:** The Theory Mode — does it go into Exam Mock like the other Modes?
>
> **Domain expert:** No. Exam Mock interleaves the _Drill Modes_ — the ones that
> generate Challenges. Procedures isn't in it either. Theory is authored
> knowledge questions; it's its own Mode, like Procedures.
>
> **Dev:** So a Theory Challenge isn't an Atom?
>
> **Domain expert:** Right. Atoms exist so adaptive selection can resurface
> weak items. Theory (v1) has no adaptive resurfacing — a session draws a
> random, topic-balanced set — so Theory questions are deliberately not Atoms,
> and nothing about them is written to the learning-events store.
