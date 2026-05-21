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
