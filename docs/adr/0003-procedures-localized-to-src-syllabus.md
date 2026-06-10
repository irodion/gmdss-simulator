# Procedures content is localized to the Israeli SRC syllabus

The offline trainer's **Procedures Mode** content is reconciled to the Israeli
SRC course material ("the book") the trainee is actually examined against,
rather than to a generic international ROC reading. Two things follow that a
future reader will otherwise find surprising and "correct" back the other way.
First, the canonical voice sequences are aligned to the book (which matches
ITU): the MAYDAY message header is **`MAYDAY <vessel>` with no second `THIS IS`**
(only the call carries `THIS IS`); PAN PAN and Securité **must** carry an
addressee (`ALL STATIONS ×3` / coast station) after the signal word; and the
MEDICO working-channel phase is the **abbreviated** reading (coast station ×1,
own vessel ×2) bracketed by "MEDICAL MESSAGE BEGINS / MEDICO MESSAGE ENDS",
without re-stating callsign or position. Second, Scenario identities are an Israeli
**roster**: home vessels carry **MID 428**, and a foreign MMSI appears **only**
when the brief is set abroad (e.g. Amalia 234 off Gibraltar, Pacific 209). The
glossary in CONTEXT.md records the per-identity rule; this ADR records why the
scope shifted from the generic-ROC framing the earlier docs assumed.

This decision concerns voice content only. The DSC/equipment configuration model
is governed by [ADR-0002](0002-procedures-as-configuration.md) and is unchanged —
it was already book-faithful (high power, EPIRB/spare-antenna/abandon flags,
relay `forbidden` vs on-scene `permitted` Undesignated).

## Considered options

- **Keep the generic-ROC reading.** Rejected: this is a national SRC trainer.
  A candidate drilling `MAYDAY · THIS IS · vessel`, an addressee-less PAN PAN, or
  a full-repetition MEDICO learns transmissions that would be marked down in the
  exam, and own ships flagged under a foreign MID are incongruous.
- **Full localization including vessel names.** Replace the English roster names
  (Blue Duck, Grey Whale, …) with Hebrew/book forms as well as the MMSIs.
  Rejected for this pass: the examinable defect is the **flag state** (wrong MID),
  not the name; re-MID-only fixes the correctness issue with far less churn and
  no risk of colliding with the relayed/abroad vessels' names.
- **Follow the book literally where it is internally inconsistent.** The book
  shows two MMSIs for one vessel and a slightly different MEDICO phase-2 between
  its structure slide and its worked example. Rejected: we resolve each such
  conflict once, record the resolution in CONTEXT.md, and treat that as
  authoritative rather than reproducing the ambiguity.

## Consequences

- The expected `sequenceParts` for the affected rubrics (`distress`,
  `distress-mob`, `urgency`, `safety`, `urgency-medico`, `routine-tr`) change, so
  "correct" shifts for those Scenarios; previously-recorded trainee stats reflect
  the old sequences and are not migrated.
- Plain urgency/safety Scenarios now carry a `facts.addressee` (`"All Stations"`),
  consumed by the addressee chips; the MEDICO begins/ends markers are literal
  chips that need no fact (they fall back to their label in `materialize`).
- This applies to the offline Procedures Mode only. The online AI-voice-simulator
  surface (tier `ScenarioDefinition` files and the `requiredFields`/`prowordRules`
  read by `scoreTranscript`) still carries legacy `BLUE DUCK` / `211…` identities
  and is a separate localization pass.
- Procedures the book covers but Procedures Mode does not yet model — **SEELONCE
  / SEELONCE PRUDENCE / SEELONCE FEENEE** and **false-alarm cancellation** (DSC +
  EPIRB) — remain out of scope and are candidates for a later slice.
