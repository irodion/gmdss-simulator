/**
 * Theory Mode question bank — authored multiple-choice questions on GMDSS
 * regulatory and systems knowledge.
 *
 * Unlike the count-driven Drill Modes, Theory questions are authored (not
 * generated) and each carries its own correct answer plus three distractors.
 * Theory has no adaptive footprint — see docs/adr/0001-theory-mode-non-adaptive.md.
 *
 * The seed set below is derived only from already-vetted repository content:
 * `channels.ts` and the frontend lesson JSON under
 * `apps/frontend/public/content/en/modules/`. Every seeded question is flagged
 * `REVIEW:` — the bank is expected to be verified and expanded by a domain
 * reviewer, who deletes the flag once a question is confirmed.
 */

export type TheoryTopic = "COSPAS-SARSAT" | "NAVTEX" | "Channels" | "SART" | "VHF" | "MMSI";

/** Companion enumeration of every TheoryTopic — drives topic-balanced selection. */
export const THEORY_TOPICS: readonly TheoryTopic[] = [
  "COSPAS-SARSAT",
  "NAVTEX",
  "Channels",
  "SART",
  "VHF",
  "MMSI",
];

export interface TheoryQuestion {
  /** Stable id, e.g. "theory-navtex-1". */
  readonly id: string;
  readonly topic: TheoryTopic;
  readonly prompt: string;
  /** The single correct option, verbatim. */
  readonly correctAnswer: string;
  /** Exactly three self-contained wrong options (no "a and c"-style references). */
  readonly distractors: readonly [string, string, string];
  /** Optional rationale shown after the question is answered. */
  readonly explanation?: string;
}

export const THEORY_QUESTIONS: readonly TheoryQuestion[] = [
  // ── COSPAS-SARSAT ── seeded from modules/6/lesson-3.json (EPIRB) ──────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-1",
    topic: "COSPAS-SARSAT",
    prompt:
      "On which frequency does an EPIRB transmit its primary distress signal to the Cospas-Sarsat satellite system?",
    correctAnswer: "406 MHz",
    distractors: ["121.5 MHz", "518 kHz", "156.8 MHz"],
    explanation:
      "EPIRBs transmit the satellite distress signal on 406 MHz. 121.5 MHz is the low-power homing frequency for rescue craft closing in — it is not used for satellite detection.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-2",
    topic: "COSPAS-SARSAT",
    prompt:
      "How does the current MEOSAR generation of Cospas-Sarsat improve on the older LEOSAR system?",
    correctAnswer: "It provides near-instantaneous global detection and better position accuracy",
    distractors: [
      "It removes the need to register the beacon",
      "It lets the beacon transmit voice as well as data",
      "It works without a 406 MHz beacon on board",
    ],
    explanation:
      "MEOSAR (Medium Earth Orbit) gives near-instantaneous global detection and improved accuracy. The older LEOSAR system relied on Doppler processing and could take up to two hours to fix a position.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-3",
    topic: "COSPAS-SARSAT",
    prompt: "Why is registering an EPIRB with the relevant authority mandatory?",
    correctAnswer: "It links the beacon's coded identity to the vessel so rescuers can identify it",
    distractors: [
      "It activates the beacon's 406 MHz transmitter",
      "It is only required for Category 2 EPIRBs",
      "It extends the battery life to five years",
    ],
    explanation:
      "Each EPIRB carries a coded identity linked to the vessel's MMSI. Without registration a rescue coordination centre cannot identify the vessel in distress, which delays the SAR response.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-4",
    topic: "COSPAS-SARSAT",
    prompt: "What activates a Category 1 EPIRB when a vessel sinks?",
    correctAnswer: "A hydrostatic release unit lets it float free and transmit automatically",
    distractors: [
      "The crew must remove it from its bracket and switch it on by hand",
      "An internal timer triggers it 24 hours after the last GPS fix",
      "Seawater contact with the antenna completes a transmit circuit",
    ],
    explanation:
      "A Category 1 EPIRB sits in a bracket with a hydrostatic release unit (HRU). Water pressure frees it so it floats clear and transmits automatically. A Category 2 EPIRB must be activated by hand.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-5",
    topic: "COSPAS-SARSAT",
    prompt: "Which of these is NOT a feature you would find on a 406 MHz satellite EPIRB?",
    correctAnswer: "An acoustic homing transmitter",
    distractors: [
      "A 121.5 MHz homing transmitter",
      "An AIS locating transmitter",
      "A high-intensity flashing light",
    ],
    explanation:
      "A 406 MHz EPIRB locates by radio and light: the 406 MHz signal reaches the Cospas-Sarsat satellites, a low-power 121.5 MHz transmitter homes in rescue craft, newer beacons add an AIS locating signal, and a high-intensity light aids the visual search. An EPIRB carries no acoustic homing — there is no sonar-style signal to home on.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-6",
    topic: "COSPAS-SARSAT",
    prompt: "An EPIRB has been activated by accident. What should you do?",
    correctAnswer:
      "Deactivate the EPIRB and notify the nearest Rescue Coordination Centre (RCC) on VHF Channel 16 to cancel the alert",
    distractors: [
      "Disconnect the EPIRB's battery and take no further action",
      "Notify a Mission Control Centre (MCC) by DSC on Channel 70",
      "Broadcast a distress-alert cancellation to all stations on Channel 16",
    ],
    explanation:
      "If an EPIRB is set off by accident, the Cospas-Sarsat satellites have already relayed a distress alert to a Rescue Coordination Centre (RCC) — switching the beacon off does not undo that. The correct procedure is to deactivate the EPIRB to stop further transmission and immediately notify the nearest RCC on VHF Channel 16 to cancel the alert, giving the vessel name, MMSI, position, and the nature of the false activation. Do not confuse the RCC, which coordinates the SAR response, with a Mission Control Centre (MCC) — the Cospas-Sarsat ground station that routes the satellite alert. Broadcasting to all stations is how a false DSC alert is cancelled. Authorities normally impose no penalty for an accidental alert that is cancelled promptly and correctly.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-7",
    topic: "COSPAS-SARSAT",
    prompt:
      "A MEOLUT (Medium Earth Orbit Local User Terminal) ground station receives beacon data from:",
    correctAnswer:
      "MEOSAR repeaters carried on navigation (GNSS) satellites in medium Earth orbit, about 19,000–24,000 km up",
    distractors: [
      "LEOSAR satellites in low Earth orbit, about 1,000 km up",
      "Inmarsat satellites in geostationary orbit",
      "A Mission Control Centre (MCC) on the ground",
    ],
    explanation:
      "A MEOLUT is the ground station of the MEOSAR system. MEOSAR places SAR repeaters on the navigation (GNSS) satellites — GPS, Galileo, and GLONASS — in medium Earth orbit at roughly 19,000–24,000 km. A MEOLUT tracks several of these satellites at once and receives the 406 MHz beacon bursts they relay; working from multiple satellites simultaneously, rather than waiting for one low-orbit satellite to pass overhead and measuring its Doppler shift, gives near-instantaneous and highly accurate global detection. The MEOLUT then forwards the located data to a Mission Control Centre (MCC), which passes it to the RCC. It does not receive from the ~1,000 km LEOSAR satellites — that is a LEOLUT's job — or from Inmarsat, and the MCC sits downstream of the MEOLUT, not as its source.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-8",
    topic: "COSPAS-SARSAT",
    prompt: "What is a LUT (Local User Terminal) in the Cospas-Sarsat system?",
    correctAnswer:
      "A ground receiving station that takes satellite-relayed beacon signals and computes the beacon's position",
    distractors: [
      "A satellite that detects a beacon and relays its signal down to the ground",
      "The centre that forwards located beacon data to the responsible rescue authorities",
      "The centre that tasks and coordinates the search-and-rescue units on scene",
    ],
    explanation:
      "A LUT (Local User Terminal) is the ground receiving station of the Cospas-Sarsat system. When a 406 MHz beacon is activated, a satellite picks up the signal — for the classic LEOSAR/GEOSAR generation it also measures the Doppler shift as it passes overhead — and relays the raw data down to a LUT. The LUT processes that data to compute the beacon's position and identity, then passes the result to a Mission Control Centre (MCC), which routes it to the Rescue Coordination Centre (RCC) that coordinates the rescue. The chain runs: beacon → satellite → LUT → MCC → RCC.",
  },

  // ── NAVTEX ── seeded from modules/6/lesson-1.json (NAVTEX) ────────────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-1",
    topic: "NAVTEX",
    prompt: "On which frequency is the International NAVTEX service broadcast?",
    correctAnswer: "518 kHz",
    distractors: ["490 kHz", "4209.5 kHz", "2187.5 kHz"],
    explanation:
      "International NAVTEX broadcasts in English on 518 kHz. 490 kHz carries national-language NAVTEX, and 4209.5 kHz is the tropical HF NAVTEX frequency.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-2",
    topic: "NAVTEX",
    prompt: "How often does each NAVTEX station broadcast on its assigned schedule?",
    correctAnswer: "Once every 4 hours",
    distractors: ["Once every hour", "Once every 12 hours", "Continuously, with no fixed schedule"],
    explanation:
      "Each NAVTEX station transmits once every 4 hours, with each broadcast lasting up to 10 minutes. The fixed schedule lets many stations share one frequency without overlapping.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-3",
    topic: "NAVTEX",
    prompt: "Which NAVTEX message types can NOT be rejected by the receiver?",
    correctAnswer: "Navigational warnings, meteorological warnings, and SAR information",
    distractors: [
      "Ice reports and pilot service messages",
      "Meteorological forecasts only",
      "Any message type may be rejected by the operator",
    ],
    explanation:
      "Message types A (navigational warnings), B (meteorological warnings), D (SAR information) and L (additional navigational warnings) cannot be rejected — they are mandatory safety categories.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-4",
    topic: "NAVTEX",
    prompt: "In a NAVTEX message preamble, what does the first character (B1) identify?",
    correctAnswer: "The transmitting station",
    distractors: ["The message type", "The message serial number", "The message priority level"],
    explanation:
      "In the preamble B1B2B3B4, the B1 character (A-Z) identifies the transmitting station. B2 is the message type and B3B4 are the two-digit serial number.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-5",
    topic: "NAVTEX",
    prompt: "What are the three priority levels a NAVTEX message can carry?",
    correctAnswer: "Vital, Important, and Routine",
    distractors: [
      "Distress, Urgency, and Safety",
      "Emergency, Priority, and Normal",
      "Critical, Standard, and Optional",
    ],
    explanation:
      "NAVTEX messages carry one of three priority levels. VITAL messages demand immediate broadcast and use serial number 00 — they are always printed. IMPORTANT messages go out at the next scheduled transmission. ROUTINE messages travel in the normal broadcast cycle. Distress, Urgency, and Safety are the priorities of radiotelephony traffic, not NAVTEX.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-6",
    topic: "NAVTEX",
    prompt: "NAVTEX delivers MSI to ships. What does the abbreviation MSI stand for?",
    correctAnswer: "Maritime Safety Information",
    distractors: [
      "Maritime Situation Index",
      "Marine Signal Identifier",
      "Mandatory Safety Instructions",
    ],
    explanation:
      "MSI is Maritime Safety Information — navigational warnings, meteorological warnings and forecasts, and SAR information. NAVTEX is one of the GMDSS services that delivers MSI to ships automatically.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-7",
    topic: "NAVTEX",
    prompt: "In a NAVTEX preamble, what type of message does the B2 type-code 'D' identify?",
    correctAnswer: "Search and rescue information",
    distractors: ["Navigational warnings", "Ice reports", "Meteorological forecasts"],
    explanation:
      "The B2 character codes the message type: A = navigational warnings, B = meteorological warnings, C = ice reports, D = SAR information, E = meteorological forecasts, L = additional navigational warnings. Codes A, B, D and L cannot be rejected by the receiver.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-8",
    topic: "NAVTEX",
    prompt: "Which of these would NOT be broadcast on a NAVTEX service?",
    correctAnswer: "A ship's routine position report to its company office",
    distractors: [
      "A navigational warning about a damaged buoy",
      "A coastal gale warning",
      "A search-and-rescue information broadcast",
    ],
    explanation:
      "NAVTEX carries Maritime Safety Information only — navigational warnings, meteorological warnings and forecasts, and SAR information — broadcast one-way to all ships. It never carries a vessel's own routine or private traffic, such as a position report to its company.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-9",
    topic: "NAVTEX",
    prompt:
      "The radio equipment carried into a life raft has one purpose: to get the survivors found. Which of these is NOT part of that survival-craft equipment?",
    correctAnswer: "A NAVTEX receiver",
    distractors: ["An EPIRB", "A portable (handheld) VHF radio", "A SART"],
    explanation:
      "The radio equipment carried into a survival craft has one job — to get you found. An EPIRB alerts rescue authorities through the Cospas-Sarsat satellites, a SART lets searching ships and aircraft home in on the craft, and a portable handheld VHF gives on-scene voice contact with rescuers. A NAVTEX receiver does the opposite: it only receives Maritime Safety Information — navigational and weather warnings broadcast to the ship. It cannot alert anyone to your distress or help anyone locate you, so it has no place in the life raft.",
  },

  // ── Channels ── seeded from drills/channels.ts ───────────────────────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-1",
    topic: "Channels",
    prompt:
      "Which VHF channel is the international voice channel for distress, safety, and calling?",
    correctAnswer: "Channel 16",
    distractors: ["Channel 70", "Channel 06", "Channel 13"],
    explanation:
      "Channel 16 is the international voice distress, safety, and calling channel. Channel 70 carries DSC distress alerts but no voice traffic.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-2",
    topic: "Channels",
    prompt:
      "Which VHF channel is reserved for Digital Selective Calling (DSC) distress, safety, and calling?",
    correctAnswer: "Channel 70",
    distractors: ["Channel 16", "Channel 06", "Channel 72"],
    explanation:
      "Channel 70 is used exclusively for DSC distress, safety, and calling — no voice transmission is permitted on it. Voice distress traffic moves to Channel 16.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-3",
    topic: "Channels",
    prompt: "Which VHF channel is designated worldwide for bridge-to-bridge navigation safety?",
    correctAnswer: "Channel 13",
    distractors: ["Channel 16", "Channel 06", "Channel 09"],
    explanation:
      "Channel 13 is the world-wide bridge-to-bridge channel for navigation safety communication between vessels. Channel 06 is primary for inter-ship SAR; Channel 16 is for distress and calling.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-4",
    topic: "Channels",
    prompt:
      "Which VHF channel is the primary frequency for inter-ship and ship-to-aircraft search and rescue?",
    correctAnswer: "Channel 06",
    distractors: ["Channel 16", "Channel 13", "Channel 09"],
    explanation:
      "Channel 06 is the primary inter-ship and ship-to-aircraft channel for search and rescue. Channel 16 is for distress and calling; Channel 13 is for bridge-to-bridge navigation safety.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-5",
    topic: "Channels",
    prompt: "Which of these VHF channels is NOT a simplex channel?",
    correctAnswer: "Channel 25",
    distractors: ["Channel 16", "Channel 06", "Channel 13"],
    explanation:
      "Channels 24 and 25 are public-correspondence channels — duplex, using separate ship and coast-station frequencies so both can speak at once, like a telephone call. Channels 16, 06 and 13 are simplex: one frequency, press-to-talk, one station at a time.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-6",
    topic: "Channels",
    prompt: "What is the purpose of bridge-to-bridge communication on VHF?",
    correctAnswer:
      "Coordinating navigation safety between vessels — agreeing passing, overtaking, and manoeuvring intentions",
    distractors: [
      "Coordinating search-and-rescue operations between ships and aircraft",
      "Calling port authorities to arrange a berth and request a pilot",
      "Exchanging routine operational and social messages between vessels' crews",
    ],
    explanation:
      "Bridge-to-bridge communication is one of the GMDSS functional requirements. On VHF it uses Channel 13, and its purpose is navigation safety: the watch officers of two vessels speak directly, bridge to bridge, to agree how they will pass, overtake, or manoeuvre clear of one another. It matters most in congested waterways, near bridges, and in port approaches, where many states make monitoring Channel 13 mandatory. It is not a search-and-rescue channel (Ch 06), a port-operations channel (Ch 12/14), or a channel for routine chatter.",
  },

  // ── SART ── seeded from modules/6/lesson-4.json (SART and AIS-SART) ───────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-1",
    topic: "SART",
    prompt: "How does a radar-SART appear on a searching vessel's radar display at long range?",
    correctAnswer: "Twelve equally-spaced dots extending from the SART's position",
    distractors: [
      "A single bright dot",
      "A set of concentric circles",
      "A flashing alphanumeric label",
    ],
    explanation:
      "At long range a radar-SART shows 12 equally-spaced dots. As the vessel closes in the dots become arcs, and within about 1 NM they merge into concentric circles. A single dot indicates the self-test mode.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-2",
    topic: "SART",
    prompt: "A radar-SART responds only to which type of radar?",
    correctAnswer: "X-band (9 GHz) radar",
    distractors: ["S-band (3 GHz) radar", "Both X-band and S-band radar", "Doppler weather radar"],
    explanation:
      "A radar-SART responds only to X-band (9 GHz) radar. It will not respond to S-band (3 GHz) radar, so a searching vessel must use its X-band set.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-3",
    topic: "SART",
    prompt: "What is the main advantage of an AIS-SART over a traditional radar-SART?",
    correctAnswer:
      "It appears on every AIS-equipped display within range, not only on radar screens",
    distractors: [
      "It can be detected by S-band as well as X-band radar",
      "It has a far longer detection range than a radar-SART",
      "It transmits an audible alarm as well as a radio signal",
    ],
    explanation:
      "An AIS-SART transmits on the AIS VHF channels, so it appears on every AIS-equipped display (ECDIS, AIS receivers, radar with AIS overlay) within range — not just on radar screens.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-4",
    topic: "SART",
    prompt: "What does a radar-SART show on the radar display during its self-test?",
    correctAnswer: "A single dot",
    distractors: [
      "Twelve equally-spaced dots",
      "A ring of concentric circles",
      "No response at all",
    ],
    explanation:
      "The radar-SART self-test produces a single dot — distinct from the twelve dots of a live activation. Run the test briefly and only when no SAR operation is in progress.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-5",
    topic: "SART",
    prompt:
      "How does an active AIS-SART appear on a radar or chart plotter that displays AIS targets?",
    correctAnswer: "As a dedicated SART symbol — a circle with a cross — that raises an alarm",
    distractors: [
      "As twelve equally-spaced dots, exactly like a radar-SART trace",
      "As an ordinary AIS vessel triangle, with no special marking",
      "As a ring of expanding concentric circles centred on its position",
    ],
    explanation:
      "An AIS-SART is reported as a distinct distress target: the plotter draws the standardised SART symbol — a circle with a cross — and raises an alarm. This differs from a radar-SART, which has no symbol; it paints a raw radar echo of twelve dots, then arcs, then concentric circles as the range closes.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-6",
    topic: "SART",
    prompt:
      "As a searching vessel closes the range on a radar-SART, how does its mark on the X-band radar change?",
    correctAnswer:
      "Twelve dots first, then arcs, then complete concentric circles centred on the SART",
    distractors: [
      "Complete circles first, then arcs, then twelve dots",
      "A single dot that simply grows brighter as the range closes",
      "Twelve dots that move closer together without changing shape",
    ],
    explanation:
      "At long range a radar-SART paints twelve equally-spaced dots. As the vessel closes in, the dots stretch into arcs; within about 1 NM the arcs merge into complete concentric circles centred on the SART. This changing picture confirms the team is homing in. A single dot instead indicates the self-test mode.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-7",
    topic: "SART",
    prompt:
      "A survival craft has activated a radar-SART. How can the survivors improve the range at which it is detected?",
    correctAnswer: "Mount or hold the SART as high as possible above the water",
    distractors: [
      "Switch the SART to a higher transmit-power setting",
      "Aim the SART's antenna toward the approaching vessel",
      "Press the self-test button repeatedly so it sends more signals",
    ],
    explanation:
      "A radar-SART works by line of sight, like radar itself, so detection range depends on height. Raising the SART — on a pole or held up — extends that line of sight: a ship's radar (15 m scanner) picks it up at about 8 NM, while an aircraft detects it up to 30 NM purely because of the greater height. A SART has no power control and radiates in all directions, so the only thing survivors can do to extend its range is get it as high as they can — at least 1 metre above sea level.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-8",
    topic: "SART",
    prompt: "A SART has been activated by mistake. How must the false alert be cancelled?",
    correctAnswer:
      "Switch the SART off and broadcast a formal distress cancellation to all stations on Channel 16",
    distractors: [
      "Switch the SART off — once it stops transmitting, no further action is needed",
      "Notify only the nearest Rescue Coordination Centre (RCC), with no broadcast to other ships",
      "Report it to a Mission Control Centre (MCC), which will route the cancellation to nearby ships",
    ],
    explanation:
      "A SART is a locally visible distress signal: a radar-SART paints a twelve-dot trace on the X-band radar of any ship or aircraft within range, and an AIS-SART appears on every AIS-equipped display in range. A false activation may therefore already have been seen by vessels all around you — not by a single coordination centre. Cancelling it takes two steps: switch the SART off to stop the signal, then broadcast a formal distress cancellation to all stations on Channel 16 so every vessel that may have detected it knows the distress was false. This differs from a false EPIRB alert, which travels by satellite to one RCC and is cancelled by notifying that RCC.",
  },

  // ── VHF ── seeded from modules/2/lesson-1.json (VHF Radio Basics) ─────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-1",
    topic: "VHF",
    prompt: "What is the maximum permitted output power for a fixed VHF marine radio installation?",
    correctAnswer: "25 watts",
    distractors: ["1 watt", "5 watts", "100 watts"],
    explanation:
      "A fixed VHF installation may transmit at up to 25 watts (high power). The 1-watt low-power setting should be used whenever range allows, to limit interference.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-2",
    topic: "VHF",
    prompt: "What kind of propagation does maritime VHF communication rely on?",
    correctAnswer: "Line-of-sight",
    distractors: [
      "Ground wave following the Earth's curvature",
      "Sky wave reflected by the ionosphere",
      "Tropospheric scatter over the horizon",
    ],
    explanation:
      "VHF signals travel in straight lines and do not bend around the horizon. Range therefore depends mainly on antenna height — typically 20 to 60 NM for a ship installation.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-3",
    topic: "VHF",
    prompt: "What is the typical communication range of a ship-mounted VHF radio?",
    correctAnswer: "About 20 to 60 nautical miles",
    distractors: [
      "About 5 nautical miles",
      "Up to about 400 nautical miles",
      "Several thousand nautical miles",
    ],
    explanation:
      "Because VHF is line-of-sight, a ship-mounted set typically reaches 20 to 60 NM depending on antenna heights. MF ground wave reaches roughly 400 NM; HF sky wave reaches thousands of NM.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-4",
    topic: "VHF",
    prompt: "In which frequency band does maritime VHF radio operate?",
    correctAnswer: "156 to 174 MHz",
    distractors: ["300 kHz to 3 MHz", "3 to 30 MHz", "406 to 512 MHz"],
    explanation:
      "Maritime VHF operates between 156 and 174 MHz. 300 kHz to 3 MHz is the MF band; 3 to 30 MHz is the HF band.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-5",
    topic: "VHF",
    prompt: "What does the abbreviation DSC stand for in GMDSS radio equipment?",
    correctAnswer: "Digital Selective Calling",
    distractors: [
      "Duplex Selective Calling",
      "Digital Selective Command",
      "Distress Selective Calling",
    ],
    explanation:
      "DSC stands for Digital Selective Calling — a technique that sends a short, coded digital message to alert a specific station, a group, or all stations. On VHF it uses Channel 70; a DSC distress alert carries the vessel's MMSI and, when the set is interfaced to a GPS, its position.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-6",
    topic: "VHF",
    prompt:
      "Which of the following is NOT required to be carried by a vessel operating only in GMDSS Sea Area A1?",
    correctAnswer: "An MF radio installation with DSC",
    distractors: ["A VHF radio with DSC", "A 406 MHz satellite EPIRB", "A NAVTEX receiver"],
    explanation:
      "Sea Area A1 lies within VHF range of a coast station that keeps a continuous DSC watch, so a vessel operating only there carries a VHF radio with DSC, a NAVTEX receiver for maritime safety information, and a 406 MHz EPIRB. An MF radio with DSC is the defining requirement of Sea Area A2, not A1.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-7",
    topic: "VHF",
    prompt: "Which of these situations would NOT call for an Urgency (PAN PAN) message?",
    correctAnswer: "A large unlit object is drifting in a busy shipping lane",
    distractors: [
      "A crew member needs urgent medical advice",
      "A vessel has lost steering but is not in immediate danger",
      "A vessel has engine failure in a shipping lane, with no immediate danger to life",
    ],
    explanation:
      "Urgency (PAN PAN) covers a vessel or person in a serious situation that is not yet grave and imminent danger — lost steering, engine failure, or a crew member needing urgent medical advice. A drifting navigational hazard endangers no vessel directly; warning other ships about it is a Safety (SÉCURITÉ) message.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-8",
    topic: "VHF",
    prompt: "Which of these is NOT part of a spoken MAYDAY distress message?",
    correctAnswer: "The vessel's destination and estimated time of arrival",
    distractors: [
      "The vessel's position",
      "The nature of the distress",
      "The number of persons on board",
    ],
    explanation:
      "A voice MAYDAY message follows a precise format: identity (name, call sign, MMSI), position, nature of the distress, assistance required, number of persons on board, and any other useful information. The vessel's destination and ETA are no part of it — a distress message reports the emergency now, not the voyage plan.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-9",
    topic: "VHF",
    prompt: 'When does a vessel transmit a Transit Report (TR, spoken "Tango Romeo")?',
    correctAnswer:
      "When it is underway, to give coast stations along its route its voyage details so authorities can track it",
    distractors: [
      "When the vessel is in distress and needs immediate rescue assistance",
      "When the vessel sights a hazard it must warn other ships about",
      "When the vessel wants the coast station to place a telephone call ashore",
    ],
    explanation:
      'A Transit Report (TR, "Tango Romeo") is a routine report a vessel underway sends to coast stations along its route. It lists voyage details — vessel name and call sign, departure and destination ports, intermediate stops, ETA, and persons on board — so authorities can track the vessel and launch a search if it fails to arrive. Many coastal states make a TR mandatory in their waters. It is not a distress call, a navigational warning, or a public-correspondence (telephone) request.',
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-10",
    topic: "VHF",
    prompt: "What is the low-power setting of a fixed (ship-installed) VHF marine radio?",
    correctAnswer: "1 watt",
    distractors: ["0.25 watt", "0.5 watt", "5 watts"],
    explanation:
      "A fixed VHF installation switches between 25 watts (high) and 1 watt (low). Regulations require using the minimum power necessary, so 1 watt is correct for nearby vessels and port working — it reduces interference. Note that 1 watt is the low setting for a fixed set but the high setting for a GMDSS handheld, whose low power is only 0.25 watt.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-11",
    topic: "VHF",
    prompt:
      "What is the minimum low-power setting of a GMDSS-compliant portable (handheld) VHF radio?",
    correctAnswer: "0.25 watt",
    distractors: ["0.5 watt", "1 watt", "5 watts"],
    explanation:
      "A GMDSS-compliant handheld VHF has a minimum low power of 0.25 watt and a high power of 1 watt — far less than a fixed installation's 25 watts. The low 0.25-watt setting conserves the battery, which matters in a survival craft. Take care not to confuse the figures: 1 watt is the handheld's high power but a fixed set's low power.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-12",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear a station transmit: "ALL STATIONS, ALL STATIONS, ALL STATIONS — THIS IS Marion — SEELONCE MAYDAY." What does this mean?',
    correctAnswer:
      "Marion is ordering radio silence — all stations must stop transmitting on the frequency while distress traffic continues",
    distractors: [
      "The distress is over; normal working on the channel may now resume",
      "Marion is relaying another vessel's distress to the coast station as a MAYDAY RELAY",
      "Radio silence is partly relaxed; the frequency may now be used with care for distress-related traffic",
    ],
    explanation:
      'SEELONCE MAYDAY ("SEELONCE" is the phonetic French for "silence") is the primary radio-silence command. It is transmitted by the vessel in distress, or by the station controlling the distress traffic, to demand that every other station immediately stop transmitting on the distress frequency so the distress traffic is not blocked. "Marion" is simply the identity of the station imposing the silence. It does not mean the distress is over — that is SEELONCE FEENEE — nor that the frequency may be used cautiously again — that is PRUDONCE.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-13",
    topic: "VHF",
    prompt:
      'On Channel 16 a coast station broadcasts: "ALL STATIONS x3 — THIS IS [coast station] — SEELONCE FEENEE." What does this mean?',
    correctAnswer:
      "The distress is over — radio silence is lifted and normal working on the channel may resume",
    distractors: [
      "All stations must stop transmitting at once — distress traffic is in progress",
      "The frequency may be used cautiously, but only for traffic related to the distress",
      "A new distress incident has begun and a fresh period of silence applies",
    ],
    explanation:
      'SEELONCE FEENEE (from the French "silence finie" — silence ended) marks the formal end of a distress. It is broadcast by the station supervising the distress traffic, usually a coast station, to lift the radio silence and restore normal working on the frequency. Demanding silence is SEELONCE MAYDAY; a cautious partial relaxation is PRUDONCE. An individual vessel may not declare the distress over — only the supervising station can.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-14",
    topic: "VHF",
    prompt:
      'On Channel 16 the station controlling a distress transmits: "PRUDONCE." What does this mean?',
    correctAnswer:
      "Radio silence is partly relaxed — the frequency may be used with care, but only for traffic related to the distress",
    distractors: [
      "The distress is over and full normal working may now resume",
      "Complete radio silence is demanded from every station",
      "The frequency is open for any urgent traffic, including unrelated PAN PAN messages",
    ],
    explanation:
      'PRUDONCE (from the French "prudence") is a partial relaxation of radio silence, issued only by the station controlling the distress. The distress is still ongoing, so the frequency may be used cautiously for distress-related traffic only — normal traffic stays prohibited. The full lifting of silence is SEELONCE FEENEE; a total silence demand is SEELONCE MAYDAY.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-15",
    topic: "VHF",
    prompt:
      'During a distress on Channel 16, a vessel that is not controlling the distress transmits: "SEELONCE DISTRESS." What does this mean?',
    correctAnswer:
      "That vessel has heard interference with the distress traffic and is demanding the interfering station stop",
    distractors: [
      "It is the silence command reserved for the vessel in distress or the controlling station",
      "It announces that the distress traffic has finished and normal working may resume",
      "It permits cautious use of the frequency for distress-related traffic",
    ],
    explanation:
      "SEELONCE DISTRESS may be transmitted by any station — not just the one controlling the distress — that hears harmful interference with the distress traffic; it tells the offending station to stop. SEELONCE MAYDAY, by contrast, is the silence command reserved for the vessel in distress or the controlling station. SEELONCE FEENEE ends the distress; PRUDONCE relaxes the silence.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-16",
    topic: "VHF",
    prompt:
      "You are part-way through a routine call on Channel 16 when a MAYDAY distress call breaks in. What must you do?",
    correctAnswer:
      "Immediately stop transmitting and listen — distress traffic has absolute priority",
    distractors: [
      "Quickly finish your current message, then release the channel",
      "Switch to low power and continue your call",
      "Move your routine call to a working channel and carry on",
    ],
    explanation:
      "Distress communications have absolute priority over all other traffic. The instant a MAYDAY is heard, every station whose transmission could interfere must stop at once and listen — you do not finish your message, reduce power, or relocate the call first. Finishing the message delays the casualty, low power still interferes, and moving channels risks missing the distress traffic. Only immediate silence guarantees the vessel in distress can be heard.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-17",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "PAN PAN, PAN PAN, PAN PAN — ALL STATIONS x3 — THIS IS ...". What does this mean?',
    correctAnswer: "A vessel or person has an urgent but not immediately life-threatening problem",
    distractors: [
      "A vessel is in grave and imminent danger and needs immediate assistance",
      "A navigational or weather hazard is being broadcast for the safety of shipping",
      "A station is relaying a distress message on behalf of another vessel",
    ],
    explanation:
      'PAN PAN (from the French "panne", a breakdown) is the urgency signal — second in the priority order, below distress (MAYDAY) and above safety (SECURITE) and routine traffic. It announces a serious situation concerning a vessel or person that is not grave and imminent danger: loss of steering, engine failure in a shipping lane, a person overboard, or a serious but not immediately life-threatening injury. If the danger becomes immediate, the message is upgraded to MAYDAY.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-18",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "SECURITE, SECURITE, SECURITE — ALL STATIONS x3 — THIS IS ...". What does this mean?',
    correctAnswer:
      "A safety message follows — a navigational or meteorological warning for the awareness of shipping",
    distractors: [
      "A vessel is in grave and imminent danger and needs immediate assistance",
      "A vessel has an urgent but not immediately life-threatening problem",
      "A station is relaying a distress message on behalf of another vessel",
    ],
    explanation:
      'SECURITE (pronounced "say-cure-ee-tay", French for safety) is the safety signal — third in the priority order, below distress and urgency and above routine traffic. Unlike MAYDAY and PAN PAN it does not concern a vessel in danger; it carries a navigational or meteorological warning — a floating hazard, an unlit buoy, a new wreck, approaching severe weather — for the awareness of all shipping. It is a one-way broadcast and ends with OUT, as no acknowledgment is expected.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-19",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY — THIS IS ...". What does this mean?',
    correctAnswer:
      "A station that is not itself in distress is passing on a distress message for another vessel",
    distractors: [
      "The vessel transmitting is itself in grave and imminent danger",
      "A vessel has an urgent but not immediately life-threatening problem",
      "A navigational or weather hazard is being broadcast for the safety of shipping",
    ],
    explanation:
      "A MAYDAY RELAY is transmitted by a station that is not itself in distress, to pass on a distress message for another vessel — typically because that vessel cannot transmit, or its distress call has gone unanswered. Any vessel or coast station may relay. Note the word RELAY: an ordinary MAYDAY is the casualty's own call, whereas a MAYDAY RELAY carries someone else's distress. The relaying station quotes the original message exactly and tries to reach a coast station first.",
  },

  // ── MMSI ── seeded from modules/4/lesson-1.json (MMSI and Call Signs) ─────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-1",
    topic: "MMSI",
    prompt: "How many digits does a Maritime Mobile Service Identity (MMSI) contain?",
    correctAnswer: "9 digits",
    distractors: ["7 digits", "6 digits", "11 digits"],
    explanation:
      "An MMSI is a unique 9-digit number programmed into the ship's DSC equipment and automatically included in every DSC transmission.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-2",
    topic: "MMSI",
    prompt: "An MMSI that begins with the prefix 00 identifies which kind of station?",
    correctAnswer: "A coast station",
    distractors: ["A ship station", "A group of ships for a fleet call", "A SAR aircraft"],
    explanation:
      "An MMSI beginning with 00 followed by the MID is a coast station. A single leading 0 marks a group call, prefix 111 a SAR aircraft, and no leading zero a ship station.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-3",
    topic: "MMSI",
    prompt: "What is the Maritime Identification Digit (MID) within an MMSI?",
    correctAnswer: "A 3-digit country code assigned by the ITU",
    distractors: [
      "The vessel's alphanumeric voice call sign",
      "A checksum that validates the MMSI",
      "A 2-digit code identifying the sea area",
    ],
    explanation:
      "The MID is a 3-digit ITU country code. Its position within the 9-digit MMSI indicates the station type — for example, positions 1 to 3 for a ship station.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-4",
    topic: "MMSI",
    prompt: "Which MMSI prefix identifies a SAR aircraft?",
    correctAnswer: "Prefix 111",
    distractors: ["Prefix 00", "Prefix 970", "Prefix 99"],
    explanation:
      "Prefix 111 identifies a SAR aircraft. Prefix 00 marks a coast station, 970 an AIS-SART, and 99 a navigational aid.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-5",
    topic: "MMSI",
    prompt: "Which MMSI prefix identifies an AIS-equipped EPIRB (an EPIRB-AIS device)?",
    correctAnswer: "Prefix 974",
    distractors: ["Prefix 970", "Prefix 972", "Prefix 111"],
    explanation:
      "An AIS-EPIRB transmits an AIS identity beginning with 974. The neighbouring device prefixes are 970 for an AIS-SART and 972 for an AIS man-overboard (MOB) device; 111 identifies a SAR aircraft.",
  },
];
