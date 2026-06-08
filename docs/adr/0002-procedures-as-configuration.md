# Procedures graded as DSC/equipment configuration, not an ordered sequence

The Procedures Mode (offline trainer) grades the equipment phase of a Scenario
as a **final configuration** set in an always-visible DSC/equipment control
panel — EPIRB / spare-antenna / abandon toggles, a DSC call-type cascade
(Distress · Individual · All ships), a voice-channel selector, and a power
toggle — **not** as an ordered sequence of placed chips. Inter-step ordering of
equipment actions is no longer assessed; only the spoken radiotelephony message
retains chip-ordering, because composing that message in the correct order is
the core ROC skill while operating the radio is not. We chose this to remove the
chip-placement busywork that made the old Procedures Mode tedious and
distracting, trading away the ability to test "did the operator turn on the
EPIRB _before_ sending the DSC alert."

## Considered options

- **Keep the ordered-chip sequence for the whole procedure.** Rejected: the
  manual placement-and-reordering is exactly the friction this change exists to
  remove, and a real DSC controller enforces most of its own internal order
  anyway, so click-order is not the examinable skill.
- **A faithful, multi-call DSC taxonomy** with relay, group, area, and
  acknowledgement call types. Rejected as out of ROC / Class-D VHF scope: such
  sets have no user-facing distress-relay function, ships acknowledge a MAYDAY
  by voice (never by DSC), and group/area calls aren't taught. The panel
  therefore offers only **Distress · Individual · All ships**.

## Consequences

- **Relays and acknowledgements have no DSC call type.** A trainee relays by
  voice ("MAYDAY RELAY" on Ch16); only when the brief explicitly places them
  on-scene may they additionally send a DSC distress alert with nature
  **Undesignated**. Each Scenario's expected DSC state is one of **Required /
  Forbidden / Permitted**, so the panel is always visible even when the correct
  answer is "touch no DSC" — recognising _when not to_ transmit is itself
  assessed.
- The expected configuration lives in an explicit **`dsc` block on each
  Scenario**; rubrics keep only the voice sequenceParts and requiredFields. The
  panel's fixed option lists (the 11 natures, the channel set, the power toggle,
  a shared coast-station list) replace the old per-rubric decoy pools
  (`channelPowerDecoys`, `callsignDecoys`) and runtime nature-decoy generation.
- The `procedure` scoring DimensionId is retained (it is persisted in
  `GradeEvent.dimensionPasses`) but is relabelled "DSC & equipment" in the UI
  and scored as a checklist of panel facts. **Critical-failure rules** apply: a
  false distress alert (DSC distress when Forbidden) or a wrong/missing required
  call type auto-fails the Scenario regardless of voice score, because
  tolerating either trains a dangerous habit.
