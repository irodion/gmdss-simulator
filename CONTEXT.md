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

### DSC & radiotelephony procedure

**DSC call type**:
The kind of Digital Selective Calling alert a trainee composes in a Procedures
Scenario. In ROC / Class-D VHF scope there are exactly three: a **Distress**
alert, an **Individual** call (to one named station, typically a coast
station), and an **All Ships** call. Group calls, area calls, and a dedicated
distress-relay call type are out of ROC scope and deliberately not modelled.
_Avoid_: "group call", "distress relay call" — neither exists in this scope.

**Nature of distress**:
The category attached to a DSC distress alert. The canonical ROC set is eleven:
Undesignated, Sinking, Collision, Fire & explosion, Disabled & adrift,
Listing & capsizing, Flooding, Grounding, Piracy, Abandoning ship, Man
overboard. **Undesignated** is the catch-all and is the nature used when
alerting on-scene on behalf of another vessel (see MAYDAY relay).

**MAYDAY relay**:
Re-broadcasting another vessel's distress. A Class-D VHF set has no
distress-relay function, so the trainee relays **by voice** ("MAYDAY RELAY" on
Ch16). Only when the brief explicitly places the trainee **on-scene** may they
additionally send a DSC distress alert with nature **Undesignated** — never a
dedicated relay call.

### Scenario roster & localization

Procedures-Mode Scenarios (`rubrics/v1/scenarios.json`) deliberately use a
**roster of distinct vessels** — one per Scenario — so drills feel varied; there
is no single "own ship". Localization to the Israeli SRC syllabus (the source
"book") is therefore a **per-identity rule**, not a single canonical cast:

- **Home vessels carry MID 428** (Israel). Legacy Scenarios still using German
  **MMSI 211…** (Blue Duck, Sea Otter, Northern Star, River Hawk, Aurora,
  Wandering Albatross, Red Fox, Silver Arrow, Grey Whale, Cargo Ranger, Blue
  Marlin) are being re-MID'd to 428.
- **Foreign MMSIs are kept only when the brief is abroad** — e.g. Amalia (234,
  Gibraltar), Pacific (209). These are intentional, not gaps.
- Recurring shore stations: **RCC Haifa**, **Haifa Radio**, **Cyprus Radio**.

Israel **MID 428**; national call-sign components **4X / 4Z**.
_Avoid_: treating the roster as a single own-ship; treating an abroad-brief's
foreign MMSI as an error to "fix".

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
